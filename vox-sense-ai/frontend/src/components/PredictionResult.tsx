// Prediction Results display component
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, CheckCircle, Clock, Zap, Download } from 'lucide-react';
import type { PredictionResponse } from '../types';
import {
  getEmotionColor, EMOTION_EMOJI, EMOTION_DESCRIPTIONS,
  formatConfidence, formatDuration, isLowConfidence,
} from '../utils/emotionUtils';

interface PredictionResultProps {
  result: PredictionResponse;
  onAnalyzeAnother: () => void;
}

// Sort probabilities descending
function sortedProbs(probs: Record<string, number>) {
  return Object.entries(probs)
    .map(([emotion, prob]) => ({ emotion, prob }))
    .sort((a, b) => b.prob - a.prob);
}

export default function PredictionResult({ result, onAnalyzeAnother }: PredictionResultProps) {
  const { predicted_emotion, confidence, probabilities, model_version, audio_duration_seconds, processing_time_ms } = result;
  const color = getEmotionColor(predicted_emotion);
  const lowConf = isLowConfidence(confidence);
  const chartData = sortedProbs(probabilities);

  const handleDownload = () => {
    const report = {
      timestamp: new Date().toISOString(),
      predicted_emotion,
      confidence,
      probabilities,
      model_version,
      audio_duration_seconds,
      processing_time_ms,
      note: 'This is a probabilistic interpretation of vocal patterns, not a definitive psychological assessment.',
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voxsense-result-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 fade-in">
      {/* Primary result card */}
      <div
        className="glass-card p-6"
        style={{ borderColor: color.border, boxShadow: `0 0 20px ${color.bg}` }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-[var(--slate-400)] uppercase tracking-wider mb-1">
              Detected Emotion
            </p>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{EMOTION_EMOJI[predicted_emotion] ?? '🎤'}</span>
              <div>
                <h2 className="text-2xl font-bold capitalize" style={{ color: color.text }}>
                  {predicted_emotion}
                </h2>
                <p className="text-sm text-[var(--slate-400)] mt-0.5">
                  Model confidence: <strong style={{ color: color.text }}>{formatConfidence(confidence)}</strong>
                </p>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 text-right space-y-1">
            <div className="text-xs text-[var(--slate-400)]">
              <Clock size={12} className="inline mr-1" />
              {formatDuration(audio_duration_seconds)} audio
            </div>
            <div className="text-xs text-[var(--slate-400)]">
              <Zap size={12} className="inline mr-1" />
              {processing_time_ms.toFixed(0)} ms
            </div>
            <div className="text-xs text-[var(--slate-400)] mono">{model_version}</div>
          </div>
        </div>

        {/* Description */}
        <p className="mt-4 text-sm text-[var(--slate-400)] leading-relaxed">
          {EMOTION_DESCRIPTIONS[predicted_emotion] ?? 'Vocal pattern analysis complete.'}
        </p>
      </div>

      {/* Low confidence warning */}
      {lowConf && (
        <div className="alert-warning flex items-start gap-2 fade-in">
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
          <p className="text-sm">
            <strong>Low confidence ({formatConfidence(confidence)}):</strong> The model is uncertain about this prediction.
            Try a longer recording with clearer speech in a quiet environment.
          </p>
        </div>
      )}

      {/* Probability chart */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-[var(--slate-300)] mb-4">
          Probability Distribution
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24, top: 0, bottom: 0 }}>
            <XAxis
              type="number"
              domain={[0, 1]}
              tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(148,163,184,0.2)' }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="emotion"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={72}
            />
            <Tooltip
              formatter={(value: number) => [`${(value * 100).toFixed(2)}%`, 'Probability']}
              contentStyle={{
                background: 'var(--navy-800)',
                border: '1px solid rgba(139,92,246,0.3)',
                borderRadius: 8,
                color: 'var(--slate-300)',
                fontSize: 12,
              }}
            />
            <Bar dataKey="prob" radius={[0, 4, 4, 0]}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.emotion}
                  fill={getEmotionColor(entry.emotion).chart}
                  opacity={entry.emotion === predicted_emotion ? 1 : 0.45}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-[var(--slate-400)] mt-2 text-center">
          Values represent softmax probabilities across all emotion classes
        </p>
      </div>

      {/* Disclaimer */}
      <div className="alert-info text-xs">
        <CheckCircle size={12} className="inline mr-1.5" />
        <strong>Research tool disclaimer:</strong> These results are probabilistic interpretations of vocal patterns
        in acted speech data. They do not constitute a medical diagnosis, psychological assessment, or definitive
        measurement of a person's emotional state.
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button className="btn-primary flex-1" onClick={onAnalyzeAnother}>
          <Zap size={14} />
          Analyze Another
        </button>
        <button className="btn-secondary" onClick={handleDownload} title="Download result as JSON">
          <Download size={14} />
          Export
        </button>
      </div>
    </div>
  );
}
