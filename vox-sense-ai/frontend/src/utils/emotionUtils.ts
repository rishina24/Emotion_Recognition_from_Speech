// Emotion display utilities
import type { EmotionClass } from '../types';

export const EMOTION_COLORS: Record<string, { bg: string; text: string; border: string; chart: string }> = {
  neutral:   { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.4)', chart: '#94a3b8' },
  calm:      { bg: 'rgba(6, 182, 212, 0.15)',   text: '#22d3ee', border: 'rgba(6, 182, 212, 0.4)',   chart: '#22d3ee' },
  happy:     { bg: 'rgba(251, 191, 36, 0.15)',  text: '#fbbf24', border: 'rgba(251, 191, 36, 0.4)',  chart: '#fbbf24' },
  sad:       { bg: 'rgba(99, 102, 241, 0.15)',  text: '#818cf8', border: 'rgba(99, 102, 241, 0.4)',  chart: '#818cf8' },
  angry:     { bg: 'rgba(239, 68, 68, 0.15)',   text: '#f87171', border: 'rgba(239, 68, 68, 0.4)',   chart: '#f87171' },
  fearful:   { bg: 'rgba(168, 85, 247, 0.15)',  text: '#c084fc', border: 'rgba(168, 85, 247, 0.4)',  chart: '#c084fc' },
  disgust:   { bg: 'rgba(34, 197, 94, 0.15)',   text: '#4ade80', border: 'rgba(34, 197, 94, 0.4)',   chart: '#4ade80' },
  surprised: { bg: 'rgba(249, 115, 22, 0.15)',  text: '#fb923c', border: 'rgba(249, 115, 22, 0.4)',  chart: '#fb923c' },
};

export const EMOTION_EMOJI: Record<string, string> = {
  neutral: '😐', calm: '😌', happy: '😊', sad: '😢',
  angry: '😠', fearful: '😨', disgust: '🤢', surprised: '😲',
};

export const EMOTION_DESCRIPTIONS: Record<string, string> = {
  neutral:   'The vocal patterns suggest a neutral or baseline emotional tone.',
  calm:      'The audio features indicate a calm, relaxed vocal quality.',
  happy:     'Acoustic cues suggest a positive, elevated emotional state.',
  sad:       'Vocal characteristics associated with lower arousal and negative valence.',
  angry:     'High-energy vocal patterns with features typical of anger.',
  fearful:   'Acoustic signatures suggest elevated arousal with negative valence.',
  disgust:   'Vocal patterns with cues associated with aversion or disgust.',
  surprised: 'Distinctive pitch and energy patterns linked to surprise.',
};

export function getEmotionColor(emotion: string) {
  return EMOTION_COLORS[emotion] ?? EMOTION_COLORS['neutral'];
}

export function formatConfidence(confidence: number): string {
  return `${(confidence * 100).toFixed(1)}%`;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  const remaining = Math.floor((ms % 1000) / 100);
  return `${s}.${remaining}s`;
}

export function isLowConfidence(confidence: number): boolean {
  return confidence < 0.4;
}
