"""Backend tests — audio preprocessing unit tests."""
from __future__ import annotations

import io
import struct
import wave
import math
# pyrefly: ignore[missing-import]
import numpy as np
# pyrefly: ignore[missing-import]
import pytest

from app.audio.preprocessing import (
    load_and_validate_audio, extract_features,
    SAMPLE_RATE, N_MFCC, MAX_FRAMES,
)


# ---- Helpers ----------------------------------------------------------------

def make_sine_wav(duration_s: float = 2.0, sr: int = 22050, freq: float = 440.0) -> bytes:
    """Return bytes of a valid PCM WAV file with a sine wave."""
    n_samples = int(sr * duration_s)
    t = np.linspace(0, duration_s, n_samples, endpoint=False)
    signal = (np.sin(2 * math.pi * freq * t) * 32767).astype(np.int16)

    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(signal.tobytes())
    return buf.getvalue()


def make_silent_wav(duration_s: float = 2.0, sr: int = 22050) -> bytes:
    n_samples = int(sr * duration_s)
    signal = np.zeros(n_samples, dtype=np.int16)
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(signal.tobytes())
    return buf.getvalue()


# ---- Tests: load_and_validate_audio ----------------------------------------

def test_load_valid_wav():
    audio_bytes = make_sine_wav(duration_s=2.0)
    waveform, duration = load_and_validate_audio(audio_bytes, filename="test.wav")
    assert isinstance(waveform, np.ndarray)
    assert waveform.dtype == np.float32
    assert waveform.ndim == 1
    assert len(waveform) > 0
    assert abs(duration - 2.0) < 0.1


def test_load_empty_bytes():
    with pytest.raises(ValueError, match="empty"):
        load_and_validate_audio(b"", filename="empty.wav")


def test_load_corrupt_bytes():
    with pytest.raises(ValueError):
        load_and_validate_audio(b"\x00\x01\x02\x03garbage", filename="corrupt.wav")


def test_load_too_short():
    """Audio shorter than MIN_AUDIO_DURATION_SECONDS should be rejected."""
    audio_bytes = make_sine_wav(duration_s=0.1)
    with pytest.raises(ValueError, match="too short"):
        load_and_validate_audio(audio_bytes, filename="short.wav")


def test_load_silent_audio():
    audio_bytes = make_silent_wav(duration_s=2.0)
    with pytest.raises(ValueError, match="silent"):
        load_and_validate_audio(audio_bytes, filename="silent.wav")


def test_load_oversized(monkeypatch):
    """Files exceeding MAX_UPLOAD_SIZE_MB should be rejected."""
    from app.core import config as cfg
    monkeypatch.setattr(cfg.settings, "MAX_UPLOAD_SIZE_MB", 0.001)
    audio_bytes = make_sine_wav(duration_s=2.0)
    with pytest.raises(ValueError, match="too large"):
        load_and_validate_audio(audio_bytes, filename="big.wav")


def test_load_non_audio_bytes():
    """Random binary data should raise ValueError."""
    garbage = b"PK\x03\x04" + bytes(range(256)) * 100  # ZIP magic bytes
    with pytest.raises(ValueError):
        load_and_validate_audio(garbage, filename="not_audio.wav")


# ---- Tests: extract_features ------------------------------------------------

def test_extract_features_shape():
    audio_bytes = make_sine_wav(duration_s=2.0)
    waveform, _ = load_and_validate_audio(audio_bytes, filename="test.wav")
    features = extract_features(waveform)
    assert features.shape == (N_MFCC * 3, MAX_FRAMES), f"Unexpected shape: {features.shape}"
    assert features.dtype == np.float32


def test_extract_features_finite():
    audio_bytes = make_sine_wav(duration_s=2.0)
    waveform, _ = load_and_validate_audio(audio_bytes, filename="test.wav")
    features = extract_features(waveform)
    assert np.isfinite(features).all(), "Features contain non-finite values"


def test_extract_features_empty_waveform():
    with pytest.raises(ValueError, match="empty"):
        extract_features(np.array([], dtype=np.float32))


def test_feature_normalization():
    """Features should have approximately zero mean (per-feature normalized)."""
    audio_bytes = make_sine_wav(duration_s=3.0)
    waveform, _ = load_and_validate_audio(audio_bytes, filename="test.wav")
    features = extract_features(waveform)
    # Per-feature mean should be close to 0 after normalization
    per_feature_mean = features.mean(axis=1)
    assert np.abs(per_feature_mean).max() < 0.1, "Feature means not near zero after normalization"
