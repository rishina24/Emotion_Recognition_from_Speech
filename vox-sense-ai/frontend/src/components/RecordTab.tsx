// RecordTab — microphone recording interface
import { useState, useRef, useEffect } from 'react';
import { Mic, Square, X, RefreshCw, Play, Pause, AlertCircle, CheckCircle } from 'lucide-react';
import { useRecorder } from '../hooks/useRecorder';
import { apiClient, ApiError, NetworkError, TimeoutError } from '../services/apiClient';
import { historyService } from '../services/historyService';
import PredictionResult from './PredictionResult';
import type { PredictionResponse } from '../types';
import { formatElapsed, formatBytes } from '../utils/emotionUtils';

interface RecordTabProps {
  modelReady: boolean;
}

export default function RecordTab({ modelReady }: RecordTabProps) {
  const {
    state, audioFile, elapsedMs, audioLevel, error: recError,
    startRecording, stopRecording, cancelRecording, resetRecording,
  } = useRecorder();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Sync playing state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnd = () => setIsPlaying(false);
    audio.addEventListener('ended', onEnd);
    return () => audio.removeEventListener('ended', onEnd);
  }, [audioFile]);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.pause(); setIsPlaying(false); }
    else { audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false)); }
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
      // Save to history
      historyService.add({
        id: res.request_id,
        timestamp: Date.now(),
        predicted_emotion: res.predicted_emotion,
        confidence: res.confidence,
        probabilities: res.probabilities,
        model_version: res.model_version,
        audio_duration_seconds: res.audio_duration_seconds,
        processing_time_ms: res.processing_time_ms,
        inputMethod: 'recording',
      });
    } catch (err) {
      if (err instanceof TimeoutError) setApiError(err.message);
      else if (err instanceof ApiError) setApiError(err.message);
      else if (err instanceof NetworkError) setApiError(err.message);
      else if (err instanceof Error && err.name === 'AbortError') { /* user cancelled */ }
      else setApiError('An unexpected error occurred. Please retry.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeAnother = () => {
    resetRecording();
    setResult(null);
    setApiError(null);
  };

  const isRecording = state === 'recording';
  const isStopping = state === 'stopping';
  const isReady = state === 'ready';
  const isIdle = state === 'idle';
  const isRequestingPerm = state === 'requesting_permission';
  const isError = state === 'error';

  if (result) {
    return <PredictionResult result={result} onAnalyzeAnother={handleAnalyzeAnother} />;
  }

  return (
    <div className="space-y-4">
      {/* Recording area */}
      <div className="glass-card p-6 flex flex-col items-center gap-5">
        {/* Animated mic/waveform */}
        <div className="flex flex-col items-center gap-3">
          {isRecording ? (
            <>
              <div
                className="relative w-16 h-16 flex items-center justify-center rounded-full bg-rose-500/20 border-2 border-rose-500/50 transition-transform duration-75"
                style={{ transform: `scale(${1 + (audioLevel / 100) * 0.25})` }}
              >
                <div
                  className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping"
                  style={{ animationDuration: `${Math.max(0.6, 2 - (audioLevel / 100) * 1.5)}s` }}
                />
                <Mic size={28} className="text-rose-400" />
              </div>
              <div className="flex items-end gap-1.5 h-10 px-4 py-1 rounded-xl bg-slate-900/60 border border-rose-500/20">
                {[0.4, 0.7, 1.0, 0.8, 0.5, 0.9, 0.6].map((multiplier, i) => {
                  const barHeight = Math.max(15, Math.min(100, (audioLevel * multiplier) + 12));
                  return (
                    <div
                      key={i}
                      className="w-1.5 rounded-full bg-gradient-to-t from-rose-500 to-rose-300 transition-all duration-75"
                      style={{ height: `${barHeight}%` }}
                    />
                  );
                })}
              </div>
              <div className="text-rose-400 font-mono text-xl font-bold tracking-tight">
                {formatElapsed(elapsedMs)}
              </div>
              <p className="text-xs text-rose-300/80 font-medium">Recording speech · Speak clearly into your mic</p>
            </>
          ) : isReady ? (
            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-violet-500/20 border-2 border-violet-500/50">
              <CheckCircle size={28} className="text-violet-400" />
            </div>
          ) : isError ? (
            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-rose-500/20 border-2 border-rose-500/30">
              <AlertCircle size={28} className="text-rose-400" />
            </div>
          ) : (
            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-[var(--graphite-600)] border-2 border-[rgba(139,92,246,0.2)]">
              <Mic size={28} className="text-[var(--slate-400)]" />
            </div>
          )}
        </div>

        {/* Status text */}
        {isIdle && (
          <p className="text-sm text-[var(--slate-400)] text-center">
            Click <strong className="text-[var(--slate-300)]">Start Recording</strong> to begin.<br />
            <span className="text-xs">Microphone access will be requested when you click.</span>
          </p>
        )}
        {isRequestingPerm && (
          <p className="text-sm text-amber-400 animate-pulse">Requesting microphone permission…</p>
        )}
        {isStopping && (
          <p className="text-sm text-[var(--slate-400)] animate-pulse">Finalizing recording…</p>
        )}

        {/* Error */}
        {isError && recError && (
          <div className="alert-error w-full flex items-start gap-2">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <p className="text-sm">{recError}</p>
          </div>
        )}

        {/* Ready: audio info + playback */}
        {isReady && audioFile && (
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between text-xs text-[var(--slate-400)]">
              <span>{audioFile.mimeType}</span>
              <span>{formatBytes(audioFile.sizeBytes)}</span>
              {audioFile.durationSeconds && <span>{formatElapsed(audioFile.durationSeconds * 1000)}</span>}
            </div>
            <audio ref={audioRef} src={audioFile.url} preload="metadata" className="hidden" />
            <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--graphite-700)]">
              <button
                onClick={togglePlayback}
                className="p-1.5 rounded-lg bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 transition-colors"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <div className="flex-1 h-1 bg-[var(--graphite-500)] rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full" />
              </div>
              <span className="text-xs mono text-[var(--slate-400)]">
                {audioFile.durationSeconds ? formatElapsed(audioFile.durationSeconds * 1000) : '—'}
              </span>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {(isIdle || isError) && (
            <button
              id="btn-start-recording"
              className="btn-primary"
              onClick={startRecording}
              disabled={isRequestingPerm}
            >
              <Mic size={14} />
              Start Recording
            </button>
          )}
          {isRecording && (
            <>
              <button className="btn-danger" onClick={stopRecording}>
                <Square size={14} />
                Stop
              </button>
              <button className="btn-secondary" onClick={cancelRecording}>
                <X size={14} />
                Cancel
              </button>
            </>
          )}
          {isReady && (
            <>
              <button
                id="btn-analyze-recording"
                className="btn-primary"
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
                    <Mic size={14} />
                    Analyze Emotion
                  </span>
                )}
              </button>
              <button className="btn-secondary" onClick={resetRecording} disabled={isAnalyzing}>
                <RefreshCw size={14} />
                Re-record
              </button>
            </>
          )}
        </div>

        {!modelReady && isReady && (
          <p className="text-xs text-amber-400 text-center">
            Model not trained. Train the model first using the ml/ scripts.
          </p>
        )}
      </div>

      {/* API error */}
      {apiError && (
        <div className="alert-error flex items-start gap-2 fade-in">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm">{apiError}</p>
            {audioFile && (
              <button className="text-rose-400 text-xs underline mt-1" onClick={handleAnalyze}>
                Retry analysis (audio preserved)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
