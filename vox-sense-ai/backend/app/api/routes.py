"""API router: /api/v1/health, /api/v1/model/*, /api/v1/predict"""
from __future__ import annotations

import os
import time
import tempfile
from pathlib import Path

from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging import get_logger
from app.schemas.responses import (
    HealthResponse, ModelStatusResponse, ModelInfoResponse,
    PredictionResponse, ErrorResponse,
)
from app.services.inference import get_inference_service, InferenceService, RAVDESS_CLASSES
from app.audio.preprocessing import (
    load_and_validate_audio, SAMPLE_RATE, N_MFCC, HOP_LENGTH, WIN_LENGTH, MAX_FRAMES
)

logger = get_logger(__name__)

router = APIRouter(prefix=settings.API_V1_PREFIX)

SUPPORTED_CONTENT_TYPES = {
    "audio/wav", "audio/wave", "audio/x-wav",
    "audio/webm", "audio/ogg", "audio/mpeg", "audio/mp4",
    "audio/aac", "audio/flac", "audio/opus",
    "application/octet-stream",  # allow generic binary for recordings
}

ACCEPTED_EXTENSIONS = {".wav", ".webm", ".ogg", ".mp3", ".m4a", ".flac", ".opus"}


# --------------------------------------------------------------------------- #
#  Health                                                                      #
# --------------------------------------------------------------------------- #

@router.get("/health", response_model=HealthResponse, tags=["Health"])
async def health() -> HealthResponse:
    return HealthResponse(status="ok", api_version="1.0.0")


# --------------------------------------------------------------------------- #
#  Model status & info                                                         #
# --------------------------------------------------------------------------- #

@router.get("/model/status", response_model=ModelStatusResponse, tags=["Model"])
async def model_status(
    svc: InferenceService = Depends(get_inference_service),
) -> ModelStatusResponse:
    return ModelStatusResponse(
        model_loaded=svc.is_ready,
        model_version=svc.model_version if svc.is_ready else None,
        supported_classes=svc.supported_classes,
        sample_rate=SAMPLE_RATE,
        n_mfcc=N_MFCC,
        message=(
            "Model is ready for inference."
            if svc.is_ready
            else (
                "Model is not trained. Run the training script in ml/scripts/ "
                "after placing the RAVDESS dataset under ml/data/RAVDESS/. "
                "See docs/DATASET_SETUP.md for instructions."
            )
        ),
    )


@router.get("/model/info", response_model=ModelInfoResponse, tags=["Model"])
async def model_info(
    svc: InferenceService = Depends(get_inference_service),
) -> ModelInfoResponse:
    return ModelInfoResponse(
        architecture="CNN-BiLSTM with attention",
        dataset="RAVDESS (Ryerson Audio-Visual Database of Emotional Speech and Song)",
        n_classes=len(svc.supported_classes) if svc.is_ready else 8,
        sample_rate=SAMPLE_RATE,
        n_mfcc=N_MFCC,
        hop_length=HOP_LENGTH,
        win_length=WIN_LENGTH,
        max_duration_seconds=settings.MAX_AUDIO_DURATION_SECONDS,
        training_status="ready" if svc.is_ready else "not_trained",
        model_version=svc.model_version if svc.is_ready else None,
        supported_classes=svc.supported_classes if svc.is_ready else RAVDESS_CLASSES,
        limitations=[
            "Model trained only on acted speech (RAVDESS) — may underperform on spontaneous speech.",
            "Speaker accent, recording environment, and microphone quality affect accuracy.",
            "Predictions are probabilistic interpretations of vocal patterns, not definitive assessments.",
            "Model may struggle with very short (<1 s) or very noisy recordings.",
            "Not intended for medical diagnosis, lie detection, or psychological assessment.",
        ],
    )


# --------------------------------------------------------------------------- #
#  Prediction                                                                  #
# --------------------------------------------------------------------------- #

@router.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
async def predict(
    audio: UploadFile = File(..., description="Audio file to analyze (WAV, WebM, OGG, MP3, M4A)"),
    svc: InferenceService = Depends(get_inference_service),
) -> JSONResponse:

    if not svc.is_ready:
        raise HTTPException(
            status_code=503,
            detail=(
                "The emotion model is not ready. "
                "Train the model first using the ml/ scripts."
            ),
        )

    # ---- Basic request validation -------------------------------------------
    content_type = (audio.content_type or "").split(";")[0].strip().lower()
    filename = audio.filename or "upload"
    ext = Path(filename).suffix.lower()

    if ext and ext not in ACCEPTED_EXTENSIONS and content_type not in SUPPORTED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=(
                f"Unsupported file type '{ext}' / content-type '{content_type}'. "
                "Accepted: WAV, WebM, OGG, MP3, M4A."
            ),
        )

    # ---- Read & size-check --------------------------------------------------
    audio_bytes = await audio.read()

    if not audio_bytes:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    if len(audio_bytes) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=413,
            detail=(
                f"File too large ({len(audio_bytes) / 1_048_576:.1f} MB). "
                f"Maximum: {settings.MAX_UPLOAD_SIZE_MB:.0f} MB."
            ),
        )

    # ---- Preprocessing & inference ------------------------------------------
    tmp_path: str | None = None
    try:
        # Save to temp file (some decoders need filesystem access)
        suffix = ext if ext else ".bin"
        fd, tmp_path = tempfile.mkstemp(suffix=suffix)
        with os.fdopen(fd, "wb") as f:
            f.write(audio_bytes)

        t_start = time.perf_counter()
        waveform, duration = load_and_validate_audio(audio_bytes, filename=filename)
        result = svc.predict(waveform)
        result["audio_duration_seconds"] = duration

        return JSONResponse(content=result)

    except ValueError as exc:
        # User-facing validation error
        logger.warning(f"Audio validation failed for '{filename}': {exc}")
        raise HTTPException(status_code=422, detail=str(exc))

    except RuntimeError as exc:
        # Model-layer error
        logger.error(f"Inference failed for '{filename}': {exc}")
        raise HTTPException(status_code=500, detail=str(exc))

    except Exception as exc:
        logger.error(f"Unexpected error processing '{filename}': {exc}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An unexpected server error occurred. Please retry or check diagnostics.",
        )

    finally:
        # Always clean up temp file
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError:
                pass
