# VoxSense AI — Speech Emotion Recognition & Acoustic Analysis

VoxSense AI is an end-to-end, full-stack Speech Emotion Recognition (SER) platform powered by deep acoustic feature extraction (MFCC + Delta + Delta-Delta) and a PyTorch CNN-LSTM neural architecture.

---

## 🌟 Key Features
- **Shared Audio Preprocessing Pipeline**: Unified audio ingestion for both live microphone recordings and file uploads (`.wav`, `.mp3`, `.ogg`, `.flac`, `.webm`).
- **Feature Extraction**: 40 Mel-Frequency Cepstral Coefficients (MFCC) with 1st and 2nd temporal derivatives (120 acoustic features across 130 time frames).
- **Deep Architecture**: 1D-CNN feature extraction layers paired with Bidirectional LSTM sequence modeling, followed by attention-weighted dense classification across 8 emotions:
  - `neutral`, `calm`, `happy`, `sad`, `angry`, `fearful`, `disgust`, `surprised`.
- **Confidence Scoring & Safe Fallbacks**: Explicit low-confidence warnings, entropy diagnostics, and transparent fallback notifications.
- **Modern Glassmorphic UI**: High-fidelity dark mode dashboard built with React 19, TypeScript, Tailwind CSS, Lucide icons, and Recharts.

---

## 🏗️ System Architecture

```
vox-sense-ai/
├── backend/
│   ├── app/
│   │   ├── api/routes.py         # FastAPI endpoints (/health, /model/status, /predict, etc.)
│   │   ├── audio/preprocessing.py # Shared audio validation, resampling, and MFCC computation
│   │   ├── models/architecture.py # PyTorch CNN-LSTM Neural Network
│   │   ├── schemas/              # Pydantic request/response schemas
│   │   ├── services/             # Model loading, inference, and prediction services
│   │   └── main.py               # FastAPI application setup & CORS configuration
│   ├── artifacts/                # Model checkpoints and training metadata
│   ├── tests/                    # Backend unit & integration test suites
│   ├── requirements.txt          # Python dependencies
│   └── run.py                    # Local server entry point
├── frontend/
│   ├── src/
│   │   ├── components/           # RecordTab, UploadTab, PredictionResult, Sidebar
│   │   ├── pages/                # Dashboard, AnalyzePage, HistoryPage, ModelInfo, Settings
│   │   ├── hooks/                # useRecorder (Web Audio API), useBackendStatus
│   │   ├── services/             # apiClient (Axios), historyService (LocalStorage)
│   │   ├── types/                # TypeScript type definitions
│   │   └── App.tsx               # Primary app routes and state management
│   ├── package.json
│   └── vite.config.ts
└── ml/
    ├── configs/                  # Audio and training hyperparameters
    ├── data/                     # Dataset parsing and loading utilities
    ├── evaluation/               # Metrics, accuracy, and confusion matrix calculation
    └── scripts/                  # Model training and fixture generation scripts
```

---

## 🚀 Quickstart Guide

### 1. Backend Setup

```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python run.py
```
Backend API documentation will be available at: `http://localhost:8000/docs`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 Testing

Run backend tests:
```bash
cd backend
pytest
```

Run frontend build verification:
```bash
cd frontend
npm run build
```
