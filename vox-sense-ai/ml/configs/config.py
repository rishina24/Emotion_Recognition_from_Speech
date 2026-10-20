import yaml
from pathlib import Path
from dataclasses import dataclass, asdict

# Training and Audio Feature Configuration
AUDIO_CONFIG = {
    "sample_rate": 22050,
    "duration_sec": 3.0,
    "n_mfcc": 40,
    "n_fft": 2048,
    "hop_length": 512,
    "include_delta": True,
    "include_delta2": True,
    "fixed_frames": 130,
}

TRAINING_CONFIG = {
    "batch_size": 32,
    "epochs": 40,
    "learning_rate": 0.001,
    "weight_decay": 1e-4,
    "seed": 42,
    "early_stopping_patience": 8,
    "device": "auto",
}

CLASSES = [
    "neutral",
    "calm",
    "happy",
    "sad",
    "angry",
    "fearful",
    "disgust",
    "surprised"
]
