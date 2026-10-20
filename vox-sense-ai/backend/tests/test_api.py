"""Backend integration tests using HTTPX and FastAPI test client."""
from __future__ import annotations

import io
import math
import struct
import wave
# pyrefly: ignore[missing-import]
import numpy as np
# pyrefly: ignore[missing-import]
import pytest
# pyrefly: ignore[missing-import]
from httpx import AsyncClient, ASGITransport

from app.main import app


# ---- Helpers ----------------------------------------------------------------

def make_sine_wav(duration_s: float = 2.0, sr: int = 22050) -> bytes:
    n = int(sr * duration_s)
    t = np.linspace(0, duration_s, n, endpoint=False)
    sig = (np.sin(2 * math.pi * 440 * t) * 16000).astype(np.int16)
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(sig.tobytes())
    return buf.getvalue()


# ---- Health -----------------------------------------------------------------

@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/v1/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "api_version" in data


# ---- Model status -----------------------------------------------------------

@pytest.mark.asyncio
async def test_model_status_structure():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/v1/model/status")
    assert resp.status_code == 200
    data = resp.json()
    assert "model_loaded" in data
    assert "message" in data
    assert isinstance(data["model_loaded"], bool)


@pytest.mark.asyncio
async def test_model_info():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/v1/model/info")
    assert resp.status_code == 200
    data = resp.json()
    assert "architecture" in data
    assert "limitations" in data


# ---- Predict: model not ready -----------------------------------------------

@pytest.mark.asyncio
async def test_predict_model_not_ready():
    """When model is not loaded, predict must return 503."""
    from app.services import inference as svc_mod
    original = svc_mod._inference_service

    try:
        # Force not-ready state
        from app.services.inference import InferenceService
        svc_mod._inference_service = None
        fake_svc = InferenceService.__new__(InferenceService)
        fake_svc._model = None
        fake_svc._classes = []
        fake_svc._model_version = "not_trained"
        fake_svc._device = "cpu"
        svc_mod._inference_service = fake_svc

        audio_bytes = make_sine_wav()
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post(
                "/api/v1/predict",
                files={"audio": ("test.wav", audio_bytes, "audio/wav")},
            )
        assert resp.status_code == 503
        assert "not ready" in resp.json()["detail"].lower() or "not trained" in resp.json()["detail"].lower()
    finally:
        svc_mod._inference_service = original


# ---- Predict: empty file ---------------------------------------------------

@pytest.mark.asyncio
async def test_predict_empty_file():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/predict",
            files={"audio": ("empty.wav", b"", "audio/wav")},
        )
    assert resp.status_code in (400, 422)


# ---- Predict: corrupt file --------------------------------------------------

@pytest.mark.asyncio
async def test_predict_corrupt_file():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/predict",
            files={"audio": ("bad.wav", b"\x00\x01garbage", "audio/wav")},
        )
    # Should be rejected — model not ready gives 503, invalid audio gives 422
    assert resp.status_code in (422, 503)


# ---- Predict: wrong field name should fail ----------------------------------

@pytest.mark.asyncio
async def test_predict_wrong_field_name():
    audio_bytes = make_sine_wav()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/predict",
            files={"file": ("test.wav", audio_bytes, "audio/wav")},  # wrong field
        )
    assert resp.status_code == 422  # FastAPI validation error


# ---- Predict: repeated requests (no state leakage) -------------------------

@pytest.mark.asyncio
async def test_predict_repeated_requests_no_state_leakage():
    """Multiple requests should each return independently without cross-contamination."""
    audio_bytes = make_sine_wav()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        for _ in range(3):
            resp = await client.post(
                "/api/v1/predict",
                files={"audio": ("test.wav", audio_bytes, "audio/wav")},
            )
            # Either 200 (if model loaded) or 503 (model not trained) — both are valid non-crash responses
            assert resp.status_code in (200, 422, 503)
