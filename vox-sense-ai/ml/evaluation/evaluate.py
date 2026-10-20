"""
Evaluation and metrics evaluation script for speech emotion recognition models.
Calculates accuracy, per-class precision/recall/F1, and confusion matrix.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, Any, List
import numpy as np

def compute_metrics(
    y_true: List[int],
    y_pred: List[int],
    class_names: List[str]
) -> Dict[str, Any]:
    """
    Computes precision, recall, F1, and accuracy given truth and predictions.
    """
    y_true_arr = np.array(y_true)
    y_pred_arr = np.array(y_pred)
    total = len(y_true_arr)
    if total == 0:
        return {"accuracy": 0.0, "total_samples": 0}

    correct = int(np.sum(y_true_arr == y_pred_arr))
    accuracy = float(correct / total)

    n_classes = len(class_names)
    confusion = np.zeros((n_classes, n_classes), dtype=int)
    for t, p in zip(y_true_arr, y_pred_arr):
        if 0 <= t < n_classes and 0 <= p < n_classes:
            confusion[t, p] += 1

    per_class = {}
    for i, name in enumerate(class_names):
        tp = int(confusion[i, i])
        fp = int(np.sum(confusion[:, i]) - tp)
        fn = int(np.sum(confusion[i, :]) - tp)
        precision = float(tp / (tp + fp)) if (tp + fp) > 0 else 0.0
        recall = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
        f1 = float(2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0
        per_class[name] = {
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4),
            "support": int(np.sum(confusion[i, :])),
        }

    return {
        "accuracy": round(accuracy, 4),
        "total_samples": total,
        "per_class": per_class,
        "confusion_matrix": confusion.tolist(),
        "classes": class_names,
    }
