"""Inference service: loads the trained model and runs predictions."""
from __future__ import annotations

import time
import math
import uuid
import torch
import numpy as np
from pathlib import Path
from typing import Optional

from app.core.config import settings
from app.core.logging import get_logger
from app.models.architecture import EmotionCNNBiLSTM, build_model
from app.audio.preprocessing import extract_features, N_MFCC, SAMPLE_RATE

logger = get_logger(__name__)

RAVDESS_CLASSES = [
    "neutral", "calm", "happy", "sad",
    "angry", "fearful", "disgust", "surprised",
]

MODEL_VERSION = "unloaded"


class InferenceService:
    """Singleton-style inference service loaded at application startup."""

    def __init__(self) -> None:
        self._model: Optional[EmotionCNNBiLSTM] = None
        self._classes: list[str] = []
        self._model_version: str = "unloaded"
        self._device: str = "cuda" if torch.cuda.is_available() else "cpu"
        self._n_features: int = N_MFCC * 3
        self._n_frames: int = 130
        self.load_model()

    def load_model(self) -> None:
        artifact_path = Path(settings.MODEL_ARTIFACT_PATH)
        if not artifact_path.exists():
            logger.warning(
                f"Model artifact not found at '{artifact_path}'. "
                "The service will start in model-not-ready state. "
                "Train the model first using the ml/ training scripts."
            )
            self._model = None
            self._model_version = "not_trained"
            return

        try:
            checkpoint = torch.load(str(artifact_path), map_location=self._device, weights_only=False)

            # Validate checkpoint keys
            required_keys = {"model_state_dict", "classes", "model_version"}
            missing = required_keys - set(checkpoint.keys())
            if missing:
                raise KeyError(f"Checkpoint missing keys: {missing}")

            self._classes = checkpoint["classes"]
            self._model_version = checkpoint["model_version"]
            n_classes = len(self._classes)

            # Reconstruct model
            model = build_model(n_classes=n_classes, device=self._device)
            model.load_state_dict(checkpoint["model_state_dict"])
            model.eval()
            self._model = model

            logger.info(
                f"Model loaded successfully: version={self._model_version}, "
                f"classes={self._classes}, device={self._device}"
            )
        except Exception as exc:
            logger.error(f"Failed to load model from '{artifact_path}': {exc}")
            self._model = None
            self._model_version = "load_failed"

    @property
    def is_ready(self) -> bool:
        return self._model is not None

    @property
    def model_version(self) -> str:
        return self._model_version

    @property
    def supported_classes(self) -> list[str]:
        return list(self._classes)

    def predict(self, waveform: np.ndarray) -> dict:
        """
        Run inference on a pre-validated mono float32 waveform.
        Returns a dict with predicted_emotion, confidence, probabilities, etc.
        """
        if not self.is_ready:
            raise RuntimeError(
                "The emotion model is not ready. "
                "Follow the model training instructions before running predictions."
            )

        request_id = str(uuid.uuid4())
        t0 = time.perf_counter()

        try:
            # Feature extraction
            features = extract_features(waveform)  # (120, 130)
            tensor = torch.from_numpy(features).unsqueeze(0).to(self._device)  # (1, 120, 130)

            with torch.inference_mode():
                logits = self._model(tensor)  # (1, n_classes)

            # Validate logits
            if not torch.isfinite(logits).all():
                raise ValueError("Model produced non-finite logits.")

            probs = torch.softmax(logits, dim=1).squeeze(0).cpu().numpy()  # (n_classes,)

            if not np.isfinite(probs).all():
                raise ValueError("Probability vector contains non-finite values.")

            # Normalize to sum=1.0 (guard against float rounding)
            probs = probs / probs.sum()

            class_idx = int(np.argmax(probs))
            predicted_emotion = self._classes[class_idx]
            confidence = float(probs[class_idx])

            probabilities = {cls: float(p) for cls, p in zip(self._classes, probs)}

            t1 = time.perf_counter()
            processing_time_ms = (t1 - t0) * 1000.0

            result = {
                "request_id": request_id,
                "predicted_emotion": predicted_emotion,
                "confidence": confidence,
                "probabilities": probabilities,
                "model_version": self._model_version,
                "processing_time_ms": processing_time_ms,
            }

            logger.info(
                f"[{request_id}] Prediction: {predicted_emotion} "
                f"({confidence:.2%}) in {processing_time_ms:.1f}ms"
            )
            return result

        except (RuntimeError, ValueError):
            raise
        except Exception as exc:
            logger.error(f"[{request_id}] Unexpected inference error: {exc}", exc_info=True)
            raise RuntimeError(
                "An unexpected error occurred during analysis. "
                "Your audio has been preserved. Please retry or check diagnostics."
            ) from exc


# Global singleton — initialized at startup
_inference_service: Optional[InferenceService] = None


def get_inference_service() -> InferenceService:
    global _inference_service
    if _inference_service is None:
        _inference_service = InferenceService()
    return _inference_service
