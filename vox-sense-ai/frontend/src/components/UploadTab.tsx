// UploadTab — audio file upload interface
import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, Play, Pause, AlertCircle, FileAudio, Zap } from 'lucide-react';
import { apiClient, ApiError, NetworkError, TimeoutError } from '../services/apiClient';
import { historyService } from '../services/historyService';
import PredictionResult from './PredictionResult';
import type { PredictionResponse, AudioFile } from '../types';
import { formatBytes } from '../utils/emotionUtils';

const ACCEPTED_TYPES = [
  'audio/wav', 'audio/wave', 'audio/x-wav',
  'audio/webm', 'audio/ogg', 'audio/mpeg',
  'audio/mp4', 'audio/aac', 'audio/flac', 'audio/opus',
  'application/octet-stream',
];
const ACCEPTED_EXTS = ['.wav', '.webm', '.ogg', '.mp3', '.m4a', '.flac', '.opus'];
const MAX_SIZE_MB = 25;
const MIN_DURATION_S = 0.5;
const MAX_DURATION_S = 60;

function getExt(name: string) {
  return name.slice(name.lastIndexOf('.')).toLowerCase();
}

async function getAudioDuration(blob: Blob): Promise<number | undefined> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(isFinite(audio.duration) ? audio.duration : undefined);
    };
    audio.onerror = () => { URL.revokeObjectURL(url); resolve(undefined); };
    setTimeout(() => { URL.revokeObjectURL(url); resolve(undefined); }, 5000);
  });
}

interface UploadTabProps {
  modelReady: boolean;
}

export default function UploadTab({ modelReady }: UploadTabProps) {
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const prevUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
    };
  }, []);

  const validateAndSetFile = useCallback(async (file: File) => {
    setValidationError(null);
    setApiError(null);
    setResult(null);

    // Size check
    if (file.size === 0) {
      setValidationError('The file is empty. Please select a valid audio file.');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setValidationError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum: ${MAX_SIZE_MB} MB.`);
      return;
    }

    // Extension check (not trusted alone — backend validates actual bytes)
    const ext = getExt(file.name);
    if (ext && !ACCEPTED_EXTS.includes(ext)) {
      setValidationError(`Unsupported file extension "${ext}". Accepted: WAV, WebM, OGG, MP3, M4A.`);
      return;
    }

    // Duration check (best-effort client-side)
    const duration = await getAudioDuration(file);
    if (duration !== undefined) {
      if (duration < MIN_DURATION_S) {
        setValidationError(`Audio is too short (${duration.toFixed(2)}s). Minimum: ${MIN_DURATION_S}s.`);
        return;
      }
      if (duration > MAX_DURATION_S) {
        setValidationError(`Audio is too long (${duration.toFixed(1)}s). Maximum: ${MAX_DURATION_S}s.`);
        return;
      }
    }

    // Revoke previous object URL
    if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
    const url = URL.createObjectURL(file);
    prevUrlRef.current = url;

    setAudioFile({
      blob: file,
      url,
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      durationSeconds: duration,
    });
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetFile(file);
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSetFile(file);
  }, [validateAndSetFile]);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.pause(); setIsPlaying(false); }
    else { audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false)); }
  };

  const removeFile = () => {
    if (prevUrlRef.current) { URL.revokeObjectURL(prevUrlRef.current); prevUrlRef.current = null; }
    setAudioFile(null);
    setValidationError(null);
    setResult(null);
    setApiError(null);
    setIsPlaying(false);
  };

  const handleAnalyze = async () => {
    if (!audioFile || isAnalyzing) return;
    setIsAnalyzing(true);
    setApiError(null);
    setResult(null);

    abortRef.current = new AbortController();
    try {
      const res = await apiClient.predict(audioFile.blob, audioFile.filename, abortRef.current.signal);
      setResult(res);
      historyService.add({
        id: res.request_id,
        timestamp: Date.now(),
        predicted_emotion: res.predicted_emotion,
        confidence: res.confidence,
        probabilities: res.probabilities,
        model_version: res.model_version,
        audio_duration_seconds: res.audio_duration_seconds,
        processing_time_ms: res.processing_time_ms,
        inputMethod: 'upload',
        filename: audioFile.filename,
      });
    } catch (err) {
      if (err instanceof TimeoutError) setApiError(err.message);
      else if (err instanceof ApiError) setApiError(err.message);
      else if (err instanceof NetworkError) setApiError(err.message);
      else if (err instanceof Error && err.name === 'AbortError') { /* cancelled */ }
      else setApiError('An unexpected error occurred. Please retry.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeAnother = () => {
    removeFile();
  };

  if (result) {
    return <PredictionResult result={result} onAnalyzeAnother={handleAnalyzeAnother} />;
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      {!audioFile && (
        <div
          id="upload-dropzone"
          className={`glass-card p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-200 border-2 border-dashed ${
            isDragging
              ? 'border-violet-400 bg-violet-500/5'
              : 'border-[rgba(139,92,246,0.25)] hover:border-[rgba(139,92,246,0.5)]'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-14 h-14 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
            <Upload size={24} className="text-violet-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-[var(--slate-300)]">
              Drop an audio file here or click to browse
            </p>
            <p className="text-xs text-[var(--slate-400)] mt-1">
              WAV, WebM, OGG, MP3, M4A — up to {MAX_SIZE_MB} MB, max 60 seconds
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={ACCEPTED_EXTS.join(',')}
            onChange={handleFileInput}
          />
        </div>
      )}

      {/* Validation error */}
      {validationError && (
        <div className="alert-error flex items-start gap-2 fade-in">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <p className="text-sm">{validationError}</p>
        </div>
      )}

      {/* Selected file */}
      {audioFile && (
        <div className="glass-card p-5 space-y-4 fade-in">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                <FileAudio size={18} className="text-violet-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--slate-300)] truncate max-w-[200px]">{audioFile.filename}</p>
                <p className="text-xs text-[var(--slate-400)]">
                  {formatBytes(audioFile.sizeBytes)}
                  {audioFile.durationSeconds !== undefined && ` · ${audioFile.durationSeconds.toFixed(1)}s`}
                  {' · '}{audioFile.mimeType}
                </p>
              </div>
            </div>
            <button className="p-1.5 text-[var(--slate-400)] hover:text-rose-400 transition-colors" onClick={removeFile}>
              <X size={16} />
            </button>
          </div>

          {/* Playback */}
          <audio
            ref={audioRef}
            src={audioFile.url}
            preload="metadata"
            className="hidden"
            onEnded={() => setIsPlaying(false)}
          />
          <div className="flex items-center gap-3 p-2 rounded-lg bg-[var(--graphite-700)]">
            <button
              onClick={togglePlayback}
              className="p-1.5 rounded-lg bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 transition-colors"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <span className="text-xs text-[var(--slate-400)]">
              {isPlaying ? 'Playing…' : 'Preview audio before analysis'}
            </span>
          </div>

          {/* Analyze */}
          <div className="flex items-center gap-3">
            <button
              id="btn-analyze-upload"
              className="btn-primary flex-1"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !modelReady}
            >
              {isAnalyzing ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing…
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Zap size={14} />
                  Analyze Emotion
                </span>
              )}
            </button>
            <button className="btn-secondary" onClick={removeFile} disabled={isAnalyzing}>
              <X size={14} />
              Remove
            </button>
          </div>

          {!modelReady && (
            <p className="text-xs text-amber-400">
              Model not trained. Train the model using the ml/ scripts first.
            </p>
          )}
        </div>
      )}

      {/* API error */}
      {apiError && (
        <div className="alert-error flex items-start gap-2 fade-in">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm">{apiError}</p>
            {audioFile && (
              <button className="text-rose-400 text-xs underline mt-1" onClick={handleAnalyze}>
                Retry (file preserved)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
