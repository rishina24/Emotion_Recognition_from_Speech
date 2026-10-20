"""Pydantic schemas for request/response validation."""
from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, Field
import time


class HealthResponse(BaseModel):
    status: str = Field(..., description="Service health status")
    api_version: str = Field(..., description="API version string")
    timestamp: float = Field(default_factory=time.time)


class ModelStatusResponse(BaseModel):
    model_loaded: bool
    model_version: Optional[str] = None
    supported_classes: list[str] = []
    sample_rate: Optional[int] = None
    n_mfcc: Optional[int] = None
    message: str = ""


class ModelInfoResponse(BaseModel):
    architecture: str = ""
    dataset: str = ""
    n_classes: int = 0
    sample_rate: int = 0
    n_mfcc: int = 0
    hop_length: int = 0
    win_length: int = 0
    max_duration_seconds: float = 0.0
    training_status: str = "not_trained"
    model_version: Optional[str] = None
    supported_classes: list[str] = []
    limitations: list[str] = []


class PredictionResponse(BaseModel):
    request_id: str
    predicted_emotion: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    probabilities: dict[str, float]
    model_version: str
    audio_duration_seconds: float
    processing_time_ms: float


class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None
    request_id: Optional[str] = None
