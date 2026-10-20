// Shared TypeScript types for VoxSense AI

export type EmotionClass =
  | 'neutral' | 'calm' | 'happy' | 'sad'
  | 'angry' | 'fearful' | 'disgust' | 'surprised';

export interface HealthResponse {
  status: string;
  api_version: string;
  timestamp: number;
}

export interface ModelStatusResponse {
  model_loaded: boolean;
  model_version: string | null;
  supported_classes: string[];
  sample_rate: number | null;
  n_mfcc: number | null;
  message: string;
}

export interface ModelInfoResponse {
  architecture: string;
  dataset: string;
  n_classes: number;
  sample_rate: number;
  n_mfcc: number;
  hop_length: number;
  win_length: number;
  max_duration_seconds: number;
  training_status: string;
  model_version: string | null;
  supported_classes: string[];
  limitations: string[];
}

export interface PredictionResponse {
  request_id: string;
  predicted_emotion: string;
  confidence: number;
  probabilities: Record<string, number>;
  model_version: string;
  audio_duration_seconds: number;
  processing_time_ms: number;
}

export interface ApiError {
  detail: string;
  error_code?: string;
  request_id?: string;
}

// Recording state machine
export type RecordingState =
  | 'idle'
  | 'requesting_permission'
  | 'recording'
  | 'stopping'
  | 'ready'
  | 'analyzing'
  | 'success'
  | 'error';

// Upload state
export type UploadState =
  | 'idle'
  | 'validating'
  | 'ready'
  | 'analyzing'
  | 'success'
  | 'error';

export interface AudioFile {
  blob: Blob;
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds?: number;
}

export interface AnalysisResult extends PredictionResponse {
  id: string;
  timestamp: number;
  inputMethod: 'recording' | 'upload';
  filename?: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  predicted_emotion: string;
  confidence: number;
  probabilities: Record<string, number>;
  model_version: string;
  audio_duration_seconds: number;
  processing_time_ms: number;
  inputMethod: 'recording' | 'upload';
  filename?: string;
}

export type BackendStatus = 'checking' | 'online' | 'offline' | 'error';
