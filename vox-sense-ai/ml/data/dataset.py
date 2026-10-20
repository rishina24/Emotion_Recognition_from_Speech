"""
Dataset loader and parser for Speech Emotion Recognition.
Supports RAVDESS, TESS, and custom WAV dataset structures.
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import List, Tuple, Dict, Optional

# RAVDESS emotion codes:
# 01 = neutral, 02 = calm, 03 = happy, 04 = sad,
# 05 = angry, 06 = fearful, 07 = disgust, 08 = surprised
RAVDESS_EMOTION_MAP = {
    "01": "neutral",
    "02": "calm",
    "03": "happy",
    "04": "sad",
    "05": "angry",
    "06": "fearful",
    "07": "disgust",
    "08": "surprised",
}

def scan_ravdess_directory(dataset_dir: Path) -> List[Tuple[Path, str]]:
    """
    Scans a RAVDESS directory for audio files and extracts their emotion labels.
    Filename pattern: 03-01-06-01-02-01-12.wav (3rd part is emotion code)
    """
    records = []
    if not dataset_dir.exists():
        return records

    for file_path in dataset_dir.rglob("*.wav"):
        name_parts = file_path.stem.split("-")
        if len(name_parts) >= 3:
            code = name_parts[2]
            emotion = RAVDESS_EMOTION_MAP.get(code)
            if emotion:
                records.append((file_path, emotion))

    return records
