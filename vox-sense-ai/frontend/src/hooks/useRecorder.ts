import { useState, useRef, useCallback, useEffect } from 'react';
import type { RecordingState, AudioFile } from '../types';
import { convertBlobToWav } from '../utils/wavEncoder';

const MAX_DURATION_MS = 60_000; // 60 seconds

// Preferred recording formats in priority order
const CANDIDATE_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/ogg',
  'audio/mp4',
];

function selectMimeType(): string | null {
  if (typeof MediaRecorder === 'undefined') return null;
  for (const type of CANDIDATE_TYPES) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return null; // Browser will choose its default
}

interface UseRecorderResult {
  state: RecordingState;
  audioFile: AudioFile | null;
  elapsedMs: number;
  audioLevel: number;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  cancelRecording: () => void;
  resetRecording: () => void;
}

export function useRecorder(): UseRecorderResult {
  const [state, setState] = useState<RecordingState>('idle');
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, []);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  const startRecording = useCallback(async () => {
    if (state === 'recording' || state === 'requesting_permission') return;

    // Clear previous state
    cleanup();
    if (!isMountedRef.current) return;
    setState('requesting_permission');
    setError(null);
    setElapsedMs(0);
    setAudioLevel(0);

    // Check browser support
    if (!navigator.mediaDevices?.getUserMedia) {
      setState('error');
      setError(
        'Microphone access is unavailable. This feature requires HTTPS or localhost, ' +
          'and a browser that supports the MediaRecorder API.',
      );
      return;
    }

    if (typeof MediaRecorder === 'undefined') {
      setState('error');
      setError(
        'This browser cannot record audio. Try another supported browser or upload an audio file.',
      );
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      const domErr = err as DOMException;
      if (domErr.name === 'NotAllowedError' || domErr.name === 'PermissionDeniedError') {
        setState('error');
        setError(
          'Microphone access was denied. Allow microphone access in your browser settings and try again.',
        );
      } else if (domErr.name === 'NotFoundError' || domErr.name === 'DevicesNotFoundError') {
        setState('error');
        setError(
          'No microphone was detected. Connect or enable a microphone, or upload an audio file instead.',
        );
      } else if (domErr.name === 'NotReadableError' || domErr.name === 'TrackStartError') {
        setState('error');
        setError(
          'The microphone is busy or could not be accessed. Close other applications using the microphone.',
        );
      } else {
        setState('error');
        setError(`Microphone error: ${domErr.message || String(err)}`);
      }
      return;
    }

    if (!isMountedRef.current) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }

    streamRef.current = stream;

    // Set up Web Audio AnalyserNode for live visualizer
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        if (!isMountedRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } catch (e) {
      console.warn('Web Audio Analyser not available:', e);
    }

    const mimeType = selectMimeType();
    const mrOptions: MediaRecorderOptions = mimeType ? { mimeType } : {};

    let mr: MediaRecorder;
    try {
      mr = new MediaRecorder(stream, mrOptions);
    } catch (err) {
      cleanup();
      setState('error');
      setError('This browser cannot record in the required audio format. Try another browser.');
      return;
    }

    mediaRecorderRef.current = mr;
    chunksRef.current = [];

    mr.ondataavailable = (ev: BlobEvent) => {
      if (ev.data && ev.data.size > 0) {
        chunksRef.current.push(ev.data);
      }
    };

    mr.onstop = () => {
      if (!isMountedRef.current) return;

      const chunks = chunksRef.current;
      if (chunks.length === 0) {
        setState('error');
        setError(
          'No usable audio was captured. Record again and speak clearly for a few seconds.',
        );
        return;
      }

      const actualMime = mr.mimeType || 'audio/webm';
      const rawBlob = new Blob(chunks, { type: actualMime });

      if (rawBlob.size < 500) {
        setState('error');
        setError(
          'The recording is too short or empty. Record again and speak clearly for at least a second.',
        );
        return;
      }

      // Convert recorded browser audio (WebM/OGG) to standard 16-bit PCM WAV (22050 Hz)
      // for 100% reliable backend model inference across all operating systems.
      convertBlobToWav(rawBlob, 22050)
        .then((wavBlob) => {
          if (!isMountedRef.current) return;
          if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
          const url = URL.createObjectURL(wavBlob);
          audioUrlRef.current = url;

          setAudioFile({
            blob: wavBlob,
            url,
            filename: 'recording.wav',
            mimeType: 'audio/wav',
            sizeBytes: wavBlob.size,
            durationSeconds: Math.max(0.5, elapsedMs / 1000),
          });
          setState('ready');
        })
        .catch((convErr) => {
          loggerFallback(convErr, rawBlob, actualMime);
        });
    };

    const loggerFallback = (convErr: unknown, rawBlob: Blob, actualMime: string) => {
      console.warn('WAV conversion fallback:', convErr);
      if (!isMountedRef.current) return;
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      const url = URL.createObjectURL(rawBlob);
      audioUrlRef.current = url;
      const ext = actualMime.includes('ogg') ? 'ogg' : actualMime.includes('mp4') ? 'm4a' : 'webm';
      setAudioFile({
        blob: rawBlob,
        url,
        filename: `recording.${ext}`,
        mimeType: actualMime,
        sizeBytes: rawBlob.size,
        durationSeconds: Math.max(0.5, elapsedMs / 1000),
      });
      setState('ready');
    };

    mr.onerror = () => {
      if (!isMountedRef.current) return;
      setState('error');
      setError('A recording error occurred. Please try again.');
    };

    mr.start(250); // collect data every 250ms
    setState('recording');
    startTimeRef.current = Date.now();

    // Elapsed timer
    timerRef.current = setInterval(() => {
      if (!isMountedRef.current) return;
      setElapsedMs(Date.now() - startTimeRef.current);
    }, 200);

    // Auto-stop at max duration
    maxTimerRef.current = setTimeout(() => {
      if (mediaRecorderRef.current?.state === 'recording') {
        stopRecording();
      }
    }, MAX_DURATION_MS);
  }, [state]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (maxTimerRef.current) clearTimeout(maxTimerRef.current);

    const mr = mediaRecorderRef.current;
    if (!mr || mr.state === 'inactive') return;

    setState('stopping');
    // Request any remaining data before stop
    if (mr.state === 'recording') mr.requestData();
    mr.stop();

    // Stop tracks
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const cancelRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (maxTimerRef.current) clearTimeout(maxTimerRef.current);

    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== 'inactive') {
      mr.ondataavailable = null;
      mr.onstop = null;
      mr.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    chunksRef.current = [];
    setState('idle');
    setElapsedMs(0);
    setError(null);
  }, []);

  const resetRecording = useCallback(() => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setAudioFile(null);
    setState('idle');
    setElapsedMs(0);
    setError(null);
  }, []);

  return {
    state,
    audioFile,
    elapsedMs,
    audioLevel,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
    resetRecording,
  };
}
