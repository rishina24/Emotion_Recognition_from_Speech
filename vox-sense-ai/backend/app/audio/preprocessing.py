"""Audio loading, validation, and preprocessing pipeline."""
from __future__ import annotations

import io
import math
import numpy as np
import librosa
import soundfile as sf
from typing import Tuple
from app.core.logging import get_logger
from app.core.config import settings

logger = get_logger(__name__)

SUPPORTED_EXTENSIONS = {".wav", ".webm", ".ogg", ".mp3", ".m4a", ".flac", ".opus"}

# Canonical config — must match training config
SAMPLE_RATE = 22050
N_MFCC = 40
HOP_LENGTH = 512
WIN_LENGTH = 2048
N_FFT = 2048
MAX_FRAMES = 130  # ~3 seconds of audio at 22050 Hz with 512 hop


def load_and_validate_audio(
    audio_bytes: bytes,
    filename: str = "upload",
) -> Tuple[np.ndarray, float]:
    """
    Load audio bytes → mono float32 waveform at SAMPLE_RATE.
    Returns (waveform, duration_seconds).
    Raises ValueError with a user-friendly message on failure.
    """
    if not audio_bytes:
        raise ValueError("The uploaded file is empty. Please provide a valid audio file.")

    max_bytes = settings.max_upload_bytes
    if len(audio_bytes) > max_bytes:
        raise ValueError(
            f"File is too large ({len(audio_bytes) / 1_048_576:.1f} MB). "
            f"Maximum allowed size is {settings.MAX_UPLOAD_SIZE_MB:.0f} MB."
        )

    # Try soundfile first (fast and robust for in-memory WAV, OGG, FLAC)
    waveform = None
    sr_actual = None

    try:
        buf = io.BytesIO(audio_bytes)
        data, sr_actual = sf.read(buf, always_2d=False)
        if data.ndim > 1:
            data = data.mean(axis=1)
        waveform = data.astype(np.float32)
    except Exception as e_sf:
        logger.debug(f"soundfile.read failed for '{filename}': {e_sf}. Trying librosa fallback...")
        try:
            buf = io.BytesIO(audio_bytes)
            waveform, sr_actual = librosa.load(buf, sr=None, mono=True)
        except Exception as e_lib:
            logger.warning(f"Audio decoding failed for '{filename}' (sf: {e_sf}, librosa: {e_lib})")
            raise ValueError(
                "This audio file could not be decoded. "
                "Please provide a standard WAV, OGG, or MP3 file, or use microphone recording."
            )

    # --- Validate waveform ---
    if waveform is None or len(waveform) == 0:
        raise ValueError("No usable audio was found in the file.")

    if not np.isfinite(waveform).all():
        raise ValueError("The audio contains invalid values (NaN or Infinity). File may be corrupt.")

    if waveform.ndim != 1:
        raise ValueError(f"Unexpected waveform shape: {waveform.shape}.")

    # Resample to canonical sample rate
    if sr_actual != SAMPLE_RATE:
        waveform = librosa.resample(waveform, orig_sr=sr_actual, target_sr=SAMPLE_RATE)

    duration = len(waveform) / SAMPLE_RATE

    if duration < settings.MIN_AUDIO_DURATION_SECONDS:
        raise ValueError(
            f"Audio is too short ({duration:.2f}s). "
            f"Minimum duration is {settings.MIN_AUDIO_DURATION_SECONDS:.1f}s. "
            "Please record or upload a longer audio sample."
        )

    if duration > settings.MAX_AUDIO_DURATION_SECONDS:
        raise ValueError(
            f"Audio is too long ({duration:.1f}s). "
            f"Maximum allowed duration is {settings.MAX_AUDIO_DURATION_SECONDS:.0f}s. "
            "Please trim the audio before uploading."
        )

    # Check for near-silence
    rms = float(np.sqrt(np.mean(waveform ** 2)))
    if rms < 1e-6:
        raise ValueError(
            "The audio appears to be completely silent. "
            "Please ensure the microphone is working and speak clearly."
        )

    logger.info(
        f"Audio loaded: duration={duration:.2f}s, sr={SAMPLE_RATE}, "
        f"samples={len(waveform)}, rms={rms:.4f}"
    )
    return waveform.astype(np.float32), duration


def extract_features(waveform: np.ndarray) -> np.ndarray:
    """
    Extract MFCC + delta + delta-delta features.
    Returns a fixed-size 2D array of shape (N_MFCC * 3, MAX_FRAMES).
    """
    if len(waveform) == 0:
        raise ValueError("Cannot extract features from empty waveform.")

    # MFCCs
    mfcc = librosa.feature.mfcc(
        y=waveform,
        sr=SAMPLE_RATE,
        n_mfcc=N_MFCC,
        n_fft=N_FFT,
        hop_length=HOP_LENGTH,
        win_length=WIN_LENGTH,
    )  # (N_MFCC, T)

    delta = librosa.feature.delta(mfcc)
    delta2 = librosa.feature.delta(mfcc, order=2)

    features = np.concatenate([mfcc, delta, delta2], axis=0)  # (N_MFCC*3, T)

    # Pad or trim to MAX_FRAMES
    T = features.shape[1]
    if T < MAX_FRAMES:
        pad = MAX_FRAMES - T
        features = np.pad(features, ((0, 0), (0, pad)), mode="constant")
    else:
        features = features[:, :MAX_FRAMES]

    # Per-feature mean/std normalization (robust to varying amplitude)
    mean = features.mean(axis=1, keepdims=True)
    std = features.std(axis=1, keepdims=True) + 1e-8
    features = (features - mean) / std

    if not np.isfinite(features).all():
        raise ValueError("Feature extraction produced NaN or Infinity values.")

    return features.astype(np.float32)  # (120, 130)
