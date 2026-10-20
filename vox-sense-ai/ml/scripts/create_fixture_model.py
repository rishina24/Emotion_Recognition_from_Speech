"""
Creates a tiny untrained fixture model for testing the API pipeline.
The fixture model has random weights and MUST NOT be used as a production model.
It is clearly labelled with version='FIXTURE_TEST_ONLY'.

Usage:
    python ml/scripts/create_fixture_model.py
"""
from __future__ import annotations

import sys
import datetime
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

# pyrefly: ignore[missing-import]
from app.models.architecture import build_model

ARTIFACT_DIR = PROJECT_ROOT / "backend" / "artifacts"
FIXTURE_PATH = ARTIFACT_DIR / "fixture_model.pt"

CLASSES = [
    "neutral", "calm", "happy", "sad",
    "angry", "fearful", "disgust", "surprised",
]

import torch

def main() -> None:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    model = build_model(n_classes=8, device="cpu")
    # Keep random initialization — clearly labelled fixture
    checkpoint = {
        "model_state_dict": model.state_dict(),
        "classes": CLASSES,
        "model_version": "FIXTURE_TEST_ONLY",
        "epoch": 0,
        "val_acc": 0.0,
        "n_mfcc": 40,
        "sample_rate": 22050,
        "n_features": 120,
        "n_frames": 130,
        "training_seed": 0,
        "WARNING": "This is an untrained fixture model for software testing only. "
                   "It produces random outputs and MUST NOT be used in production.",
    }
    torch.save(checkpoint, FIXTURE_PATH)
    print(f"Fixture model saved to: {FIXTURE_PATH}")
    print("WARNING: This model is untrained and produces random predictions.")
    print("Use it only for testing the software pipeline, not for actual emotion recognition.")

if __name__ == "__main__":
    main()
