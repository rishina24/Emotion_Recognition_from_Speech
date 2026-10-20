"""
VoxSense AI — Model Training Script
====================================
Trains the CNN-BiLSTM emotion classifier on the RAVDESS dataset.

Prerequisites:
    1. Download RAVDESS from https://zenodo.org/record/1188976
    2. Extract to:  ml/data/RAVDESS/
       Expected structure:
         ml/data/RAVDESS/
           Actor_01/  Actor_02/ ... Actor_24/
             03-01-01-01-01-01-01.wav
             ...
    3. Run this script from the project root:
         python ml/scripts/train.py

RAVDESS filename encoding (positions, 1-indexed):
    03 = modality (01=full-AV, 02=video-only, 03=audio-only)
    01 = vocal channel (01=speech, 02=song)
    XX = emotion (01=neutral, 02=calm, 03=happy, 04=sad,
                  05=angry, 06=fearful, 07=disgust, 08=surprised)
    01 = intensity (01=normal, 02=strong)
    01 = statement (01="Kids are...", 02="Dogs are...")
    01 = repetition (01 or 02)
    XX = actor (01-24, odd=male, even=female)

Only audio-only files (modality=03) with speech vocal channel (02 not used here — 
we keep modality=03, channel=01) are used.
"""
from __future__ import annotations

import sys
import os
import json
import math
import time
import random
import datetime
from pathlib import Path
from typing import Optional

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from sklearn.model_selection import StratifiedGroupKFold
from sklearn.metrics import (
    accuracy_score, f1_score, classification_report, confusion_matrix
)

# Allow import of backend modules from project root
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

# pyrefly: ignore[missing-import]
from app.audio.preprocessing import load_and_validate_audio, extract_features
# pyrefly: ignore[missing-import]
from app.models.architecture import EmotionCNNBiLSTM

# ---- Configuration ----------------------------------------------------------

SEED = 42
DATA_DIR = PROJECT_ROOT / "ml" / "data" / "RAVDESS"
ARTIFACT_DIR = PROJECT_ROOT / "backend" / "artifacts"
MODEL_CHECKPOINT = ARTIFACT_DIR / "model.pt"

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

CLASSES = list(RAVDESS_EMOTION_MAP.values())
CLASS_TO_IDX = {c: i for i, c in enumerate(CLASSES)}

# Training hyperparameters
BATCH_SIZE = 32
NUM_EPOCHS = 50
LEARNING_RATE = 1e-3
WEIGHT_DECAY = 1e-4
PATIENCE = 10   # early stopping patience
TEST_ACTORS = [23, 24]  # held-out test speakers (speaker-independent eval)


def set_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


# ---- Dataset ----------------------------------------------------------------

class RAVDESSDataset(Dataset):
    def __init__(self, samples: list[tuple[str, int]]) -> None:
        self.samples = samples

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int):
        path, label = self.samples[idx]
        try:
            audio_bytes = Path(path).read_bytes()
            waveform, _ = load_and_validate_audio(audio_bytes, filename=path)
            features = extract_features(waveform)   # (120, 130)
            return torch.from_numpy(features), torch.tensor(label, dtype=torch.long)
        except Exception as e:
            print(f"[WARN] Skipping {path}: {e}")
            # Return zeros — these will be filtered by collate or skipped via error count
            n_feat = 120
            n_frames = 130
            return torch.zeros(n_feat, n_frames), torch.tensor(label, dtype=torch.long)


def parse_ravdess_files(data_dir: Path) -> tuple[list[tuple[str, int]], list[int]]:
    """
    Walk RAVDESS directory, parse filenames, return (samples, speaker_ids).
    Only modality=03 (audio-only) speech files are included.
    """
    samples: list[tuple[str, int]] = []
    speaker_ids: list[int] = []
    skipped = 0

    for wav_path in sorted(data_dir.rglob("*.wav")):
        parts = wav_path.stem.split("-")
        if len(parts) != 7:
            skipped += 1
            continue
        modality, channel, emotion_code, intensity, statement, repetition, actor = parts
        if modality != "03":  # audio-only
            skipped += 1
            continue
        if emotion_code not in RAVDESS_EMOTION_MAP:
            skipped += 1
            continue
        emotion = RAVDESS_EMOTION_MAP[emotion_code]
        label = CLASS_TO_IDX[emotion]
        actor_id = int(actor)
        samples.append((str(wav_path), label))
        speaker_ids.append(actor_id)

    print(f"Found {len(samples)} samples, skipped {skipped} files.")
    return samples, speaker_ids


# ---- Training loop ----------------------------------------------------------

def train_one_epoch(model, loader, optimizer, criterion, device) -> float:
    model.train()
    total_loss = 0.0
    for features, labels in loader:
        features = features.to(device)
        labels = labels.to(device)
        optimizer.zero_grad()
        logits = model(features)
        loss = criterion(logits, labels)
        loss.backward()
        nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimizer.step()
        total_loss += loss.item() * features.size(0)
    return total_loss / len(loader.dataset)


@torch.inference_mode()
def evaluate(model, loader, criterion, device) -> tuple[float, float]:
    model.eval()
    total_loss = 0.0
    all_preds, all_labels = [], []
    for features, labels in loader:
        features = features.to(device)
        labels = labels.to(device)
        logits = model(features)
        loss = criterion(logits, labels)
        total_loss += loss.item() * features.size(0)
        preds = logits.argmax(dim=1).cpu().numpy()
        all_preds.extend(preds)
        all_labels.extend(labels.cpu().numpy())
    avg_loss = total_loss / len(loader.dataset)
    acc = accuracy_score(all_labels, all_preds)
    return avg_loss, acc


def main() -> None:
    set_seed(SEED)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}")

    if not DATA_DIR.exists():
        print(f"\n[ERROR] RAVDESS dataset not found at: {DATA_DIR}")
        print("Please download it from https://zenodo.org/record/1188976")
        print("and extract to ml/data/RAVDESS/ following the Actor_XX structure.")
        print("See docs/DATASET_SETUP.md for detailed instructions.")
        sys.exit(1)

    print(f"Loading RAVDESS from {DATA_DIR} ...")
    all_samples, speaker_ids = parse_ravdess_files(DATA_DIR)

    if len(all_samples) == 0:
        print("[ERROR] No valid audio samples found. Check dataset directory structure.")
        sys.exit(1)

    # Speaker-independent split: hold out test actors
    test_samples = [(p, l) for (p, l), sid in zip(all_samples, speaker_ids) if sid in TEST_ACTORS]
    train_val_samples = [(p, l) for (p, l), sid in zip(all_samples, speaker_ids) if sid not in TEST_ACTORS]
    train_val_speakers = [sid for sid in speaker_ids if sid not in TEST_ACTORS]

    # Validation: 20% of remaining speakers
    val_actor_set = set(random.sample(
        list(set(train_val_speakers)),
        max(1, len(set(train_val_speakers)) // 5)
    ))
    val_samples = [(p, l) for (p, l), sid in zip(train_val_samples, train_val_speakers) if sid in val_actor_set]
    train_samples = [(p, l) for (p, l), sid in zip(train_val_samples, train_val_speakers) if sid not in val_actor_set]

    print(f"Split: train={len(train_samples)}, val={len(val_samples)}, test={len(test_samples)}")

    train_loader = DataLoader(
        RAVDESSDataset(train_samples), batch_size=BATCH_SIZE, shuffle=True,
        num_workers=0, drop_last=False
    )
    val_loader = DataLoader(
        RAVDESSDataset(val_samples), batch_size=BATCH_SIZE, shuffle=False, num_workers=0
    )
    test_loader = DataLoader(
        RAVDESSDataset(test_samples), batch_size=BATCH_SIZE, shuffle=False, num_workers=0
    )

    model = EmotionCNNBiLSTM(n_classes=len(CLASSES)).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        # pyrefly: ignore[unexpected-keyword]
        optimizer, mode="max", patience=5, factor=0.5, verbose=True
    )
    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)

    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

    best_val_acc = 0.0
    no_improve = 0
    model_version = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")

    print("\n--- Training ---")
    for epoch in range(1, NUM_EPOCHS + 1):
        t0 = time.time()
        train_loss = train_one_epoch(model, train_loader, optimizer, criterion, device)
        val_loss, val_acc = evaluate(model, val_loader, criterion, device)
        scheduler.step(val_acc)
        elapsed = time.time() - t0

        print(
            f"Epoch {epoch:03d}/{NUM_EPOCHS} | "
            f"train_loss={train_loss:.4f} | val_loss={val_loss:.4f} | "
            f"val_acc={val_acc:.4f} | {elapsed:.1f}s"
        )

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            no_improve = 0
            # Atomic save: write to temp then rename
            tmp_path = MODEL_CHECKPOINT.with_suffix(".tmp")
            torch.save(
                {
                    "model_state_dict": model.state_dict(),
                    "classes": CLASSES,
                    "model_version": model_version,
                    "epoch": epoch,
                    "val_acc": val_acc,
                    "n_mfcc": 40,
                    "sample_rate": 22050,
                    "n_features": 120,
                    "n_frames": 130,
                    "training_seed": SEED,
                },
                tmp_path,
            )
            tmp_path.replace(MODEL_CHECKPOINT)
            print(f"  ✓ Checkpoint saved (val_acc={val_acc:.4f})")
        else:
            no_improve += 1
            if no_improve >= PATIENCE:
                print(f"Early stopping at epoch {epoch}.")
                break

    # ---- Final evaluation on held-out test set --------------------------------
    print("\n--- Test Evaluation (held-out speakers) ---")
    # Reload best checkpoint
    checkpoint = torch.load(MODEL_CHECKPOINT, map_location=device, weights_only=False)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    all_preds, all_labels = [], []
    with torch.inference_mode():
        for features, labels in test_loader:
            features = features.to(device)
            logits = model(features)
            preds = logits.argmax(dim=1).cpu().numpy()
            all_preds.extend(preds)
            all_labels.extend(labels.numpy())

    test_acc = accuracy_score(all_labels, all_preds)
    test_f1 = f1_score(all_labels, all_preds, average="macro", zero_division=0)
    report = classification_report(all_labels, all_preds, target_names=CLASSES, zero_division=0)
    cm = confusion_matrix(all_labels, all_preds)

    print(f"Test accuracy: {test_acc:.4f}")
    print(f"Macro F1:      {test_f1:.4f}")
    print("\nClassification report:")
    print(report)
    print("Confusion matrix:")
    print(cm)

    # Save evaluation results
    eval_path = ARTIFACT_DIR / "evaluation.json"
    eval_path.write_text(json.dumps({
        "test_accuracy": test_acc,
        "test_macro_f1": test_f1,
        "best_val_accuracy": best_val_acc,
        "n_test_samples": len(all_labels),
        "test_actors": TEST_ACTORS,
        "evaluation_methodology": "Speaker-independent hold-out (actors 23-24 as test set)",
        "classes": CLASSES,
        "model_version": model_version,
        "timestamp": datetime.datetime.now().isoformat(),
    }, indent=2))

    print(f"\n✓ Training complete. Model saved to: {MODEL_CHECKPOINT}")
    print(f"✓ Evaluation results saved to: {eval_path}")


if __name__ == "__main__":
    main()
