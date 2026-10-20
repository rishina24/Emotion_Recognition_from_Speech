// Settings & Diagnostics page
import { useState } from 'react';
import { RefreshCw, Trash2, CheckCircle, XCircle, AlertTriangle, Loader } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { historyService } from '../services/historyService';
import type { BackendStatus, ModelStatusResponse } from '../types';

interface SettingsPageProps {
  backendStatus: BackendStatus;
  modelStatus: ModelStatusResponse | null;
  onRefresh: () => void;
  onClearHistory: () => void;
}

export default function SettingsPage({ backendStatus, modelStatus, onRefresh, onClearHistory }: SettingsPageProps) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const testHealth = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const h = await apiClient.health();
      setTestResult(`✓ Backend responded: status="${h.status}", version="${h.api_version}"`);
    } catch (err) {
      setTestResult(`✗ ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setTesting(false);
    }
  };

  const StatusIcon = () => {
    if (backendStatus === 'checking') return <Loader size={14} className="animate-spin text-amber-400" />;
    if (backendStatus === 'online') return <CheckCircle size={14} className="text-emerald-400" />;
    return <XCircle size={14} className="text-rose-500" />;
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings & Diagnostics</h1>
        <p className="text-sm text-[var(--slate-400)] mt-1">Backend configuration, connection status, and cache management.</p>
      </div>

      {/* Backend status */}
      <div className="glass-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[var(--slate-300)]">Backend Connection</h2>
        <div className="flex items-center gap-3">
          <StatusIcon />
          <span className="text-sm text-[var(--slate-300)] capitalize">{backendStatus}</span>
          <button className="btn-secondary ml-auto" onClick={onRefresh}>
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-[var(--slate-400)]">API base URL</span>
            <span className="mono text-xs text-[var(--slate-300)]">
              {typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:8000` : 'localhost:8000'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--slate-400)]">Model loaded</span>
            <span className="text-sm">{modelStatus?.model_loaded ? '✓ Yes' : '✗ No'}</span>
          </div>
          {modelStatus?.model_version && (
            <div className="flex justify-between">
              <span className="text-[var(--slate-400)]">Model version</span>
              <span className="mono text-xs text-[var(--slate-300)]">{modelStatus.model_version}</span>
            </div>
          )}
        </div>

        <button className="btn-secondary" onClick={testHealth} disabled={testing}>
          {testing ? <Loader size={14} className="animate-spin" /> : <CheckCircle size={14} />}
          Test Health Endpoint
        </button>
        {testResult && (
          <div className={testResult.startsWith('✓') ? 'alert-success' : 'alert-error'}>
            <p className="text-sm mono">{testResult}</p>
          </div>
        )}
      </div>

      {/* Audio format support */}
      <div className="glass-card p-5 space-y-3">
        <h2 className="text-sm font-semibold text-[var(--slate-300)]">Audio Format Support</h2>
        {[
          ['WAV (PCM)', 'audio/wav'],
          ['WebM/Opus', 'audio/webm;codecs=opus'],
          ['OGG/Opus', 'audio/ogg;codecs=opus'],
          ['MP4/AAC', 'audio/mp4'],
          ['MP3', 'audio/mpeg'],
        ].map(([label, type]) => {
          const supported = typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type);
          return (
            <div key={type} className="flex items-center justify-between text-sm">
              <span className="text-[var(--slate-400)]">{label}</span>
              <span className={`text-xs font-medium ${supported ? 'text-emerald-400' : 'text-[var(--slate-400)]'}`}>
                {supported ? '✓ Supported' : '— Browser varies'}
              </span>
            </div>
          );
        })}
        <p className="text-xs text-[var(--slate-400)] mt-2">
          Recording format support varies by browser. The backend can decode WAV, OGG, WebM, MP3, and M4A
          when the corresponding system codecs are available.
        </p>
      </div>

      {/* Clear history */}
      <div className="glass-card p-5 space-y-3">
        <h2 className="text-sm font-semibold text-[var(--slate-300)]">Data & Cache</h2>
        <p className="text-xs text-[var(--slate-400)]">
          Analysis history is stored in browser local storage. Raw audio is never saved automatically.
          Clearing history removes all prediction metadata from this browser.
        </p>
        <button className="btn-danger" onClick={onClearHistory}>
          <Trash2 size={14} />
          Clear Analysis History
        </button>
      </div>

      {/* Privacy note */}
      <div className="alert-info text-xs space-y-1">
        <p><strong>Privacy:</strong> Audio is processed locally by the backend running on this machine.</p>
        <p>No audio data is sent to external services. No personal data is collected or stored.</p>
        <p>VoxSense AI is a research/educational tool and must not be used for medical diagnosis, identity recognition, or psychological assessment.</p>
      </div>
    </div>
  );
}
