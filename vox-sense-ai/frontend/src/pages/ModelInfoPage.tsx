// Model Info page
import { useEffect, useState } from 'react';
import { Brain, Database, Settings, AlertTriangle, Loader } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import type { ModelInfoResponse } from '../types';

export default function ModelInfoPage() {
  const [info, setInfo] = useState<ModelInfoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.modelInfo()
      .then(setInfo)
      .catch(() => setError('Could not load model information. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center gap-2 text-[var(--slate-400)]">
      <Loader size={16} className="animate-spin" />
      <span>Loading model information…</span>
    </div>
  );

  if (error) return <div className="alert-error text-sm">{error}</div>;
  if (!info) return null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Model Information</h1>
        <p className="text-sm text-[var(--slate-400)] mt-1">
          Architecture, dataset, feature configuration, and known limitations.
        </p>
      </div>

      {/* Status banner */}
      <div className={info.training_status === 'ready' ? 'alert-success' : 'alert-warning'}>
        <div className="flex items-center gap-2 text-sm">
          {info.training_status === 'ready' ? (
            <>✓ Model trained and ready · version: <code className="mono text-xs">{info.model_version}</code></>
          ) : (
            <>⚠ Model not yet trained. Train with <code className="mono text-xs">python ml/scripts/train.py</code></>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Architecture */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={16} className="text-violet-400" />
            <h2 className="text-sm font-semibold text-[var(--slate-300)]">Architecture</h2>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--slate-400)]">Model type</dt>
              <dd className="text-[var(--slate-300)] text-right">{info.architecture}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--slate-400)]">Emotion classes</dt>
              <dd className="text-[var(--slate-300)]">{info.n_classes}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--slate-400)]">Supported emotions</dt>
              <dd className="text-[var(--slate-300)] text-right capitalize">
                {info.supported_classes.join(', ')}
              </dd>
            </div>
          </dl>
        </div>

        {/* Dataset */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Database size={16} className="text-cyan-400" />
            <h2 className="text-sm font-semibold text-[var(--slate-300)]">Dataset</h2>
          </div>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-[var(--slate-400)] mb-1">Dataset used</dt>
              <dd className="text-[var(--slate-300)]">{info.dataset}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--slate-400)]">Training status</dt>
              <dd className="text-[var(--slate-300)] capitalize">{info.training_status.replace('_', ' ')}</dd>
            </div>
          </dl>
        </div>

        {/* Feature config */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Settings size={16} className="text-violet-400" />
            <h2 className="text-sm font-semibold text-[var(--slate-300)]">Feature Configuration</h2>
          </div>
          <dl className="space-y-2 text-sm">
            {[
              ['Sample rate', `${info.sample_rate} Hz`],
              ['MFCC coefficients', String(info.n_mfcc)],
              ['MFCC + Δ + ΔΔ', `${info.n_mfcc * 3} features`],
              ['Hop length', String(info.hop_length)],
              ['Window length', String(info.win_length)],
              ['Max duration', `${info.max_duration_seconds}s`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <dt className="text-[var(--slate-400)]">{k}</dt>
                <dd className="text-[var(--slate-300)] mono text-xs">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Limitations */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-amber-400" />
            <h2 className="text-sm font-semibold text-[var(--slate-300)]">Limitations</h2>
          </div>
          <ul className="space-y-2">
            {info.limitations.map((lim, i) => (
              <li key={i} className="flex gap-2 text-xs text-[var(--slate-400)]">
                <span className="text-amber-400 flex-shrink-0 mt-0.5">•</span>
                {lim}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Dataset & Provenance */}
      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold text-[var(--slate-300)] mb-3">Model Provenance & Dataset Reference</h2>
        <div className="text-xs text-[var(--slate-400)] space-y-2 leading-relaxed">
          <p>
            VoxSense AI utilizes deep convolutional recurrent neural networks trained on the <strong className="text-slate-200">Ryerson Audio-Visual Database of Emotional Speech and Song (RAVDESS)</strong>, a rigorously validated perceptual and acoustic research dataset containing speech with professional actors expressing standardized emotions.
          </p>
          <p>
            Audio features are preprocessed with 40-band Mel-Frequency Cepstral Coefficients (MFCCs) augmented by first-order (Δ) and second-order (ΔΔ) temporal derivatives, normalized across 130 acoustic frames to identify pitch modulation, spectral tilt, and vocal tract resonance characteristics.
          </p>
          <p className="text-[11px] text-slate-500 pt-1">
            For model retraining or architectural modifications, consult the internal engineering documentation in <code className="mono text-[11px] bg-[var(--graphite-700)] px-1.5 py-0.5 rounded">docs/DATASET_SETUP.md</code> and <code className="mono text-[11px] bg-[var(--graphite-700)] px-1.5 py-0.5 rounded">docs/ARCHITECTURE.md</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
