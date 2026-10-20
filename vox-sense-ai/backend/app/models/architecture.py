"""CNN-BiLSTM emotion classifier model definition."""
from __future__ import annotations

import torch
import torch.nn as nn


class EmotionCNNBiLSTM(nn.Module):
    """
    Architecture: Conv1D feature extractor → BiLSTM → FC classifier.
    Input: (batch, channels, time) = (B, 120, 130) — MFCC*3 features × frames.
    Output: (batch, n_classes) logits.
    """

    def __init__(
        self,
        n_features: int = 120,   # N_MFCC * 3
        n_frames: int = 130,
        n_classes: int = 8,
        cnn_channels: list[int] | None = None,
        lstm_hidden: int = 128,
        lstm_layers: int = 2,
        dropout: float = 0.3,
    ) -> None:
        super().__init__()
        if cnn_channels is None:
            cnn_channels = [64, 128, 256]

        # CNN block — applied over time axis
        cnn_layers: list[nn.Module] = []
        in_ch = n_features
        for out_ch in cnn_channels:
            cnn_layers += [
                nn.Conv1d(in_ch, out_ch, kernel_size=3, padding=1),
                nn.BatchNorm1d(out_ch),
                nn.GELU(),
                nn.Dropout(dropout * 0.5),
            ]
            in_ch = out_ch
        self.cnn = nn.Sequential(*cnn_layers)

        # BiLSTM
        self.lstm = nn.LSTM(
            input_size=in_ch,
            hidden_size=lstm_hidden,
            num_layers=lstm_layers,
            batch_first=True,
            bidirectional=True,
            dropout=dropout if lstm_layers > 1 else 0.0,
        )

        # Attention
        self.attn = nn.Linear(lstm_hidden * 2, 1)

        # Classifier head
        self.classifier = nn.Sequential(
            nn.Dropout(dropout),
            nn.Linear(lstm_hidden * 2, 128),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(128, n_classes),
        )

        self._init_weights()

    def _init_weights(self) -> None:
        for m in self.modules():
            if isinstance(m, nn.Linear):
                nn.init.xavier_uniform_(m.weight)
                if m.bias is not None:
                    nn.init.zeros_(m.bias)
            elif isinstance(m, nn.Conv1d):
                nn.init.kaiming_normal_(m.weight, mode="fan_out", nonlinearity="relu")

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: (B, features, frames)
        x = self.cnn(x)          # (B, 256, frames)
        x = x.permute(0, 2, 1)   # (B, frames, 256)
        lstm_out, _ = self.lstm(x)  # (B, frames, hidden*2)

        # Scaled dot-product attention over frames
        attn_w = torch.softmax(self.attn(lstm_out), dim=1)  # (B, frames, 1)
        context = (attn_w * lstm_out).sum(dim=1)             # (B, hidden*2)

        logits = self.classifier(context)  # (B, n_classes)
        return logits


def build_model(n_classes: int = 8, device: str = "cpu") -> EmotionCNNBiLSTM:
    model = EmotionCNNBiLSTM(n_classes=n_classes)
    model.to(device)
    return model
