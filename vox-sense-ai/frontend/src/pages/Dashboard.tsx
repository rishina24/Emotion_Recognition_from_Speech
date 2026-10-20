// Dashboard / Overview page
import { Link } from 'react-router-dom';
import {
  Mic, Activity, Brain, Clock, ArrowRight, AlertTriangle,
  CheckCircle, XCircle, Loader, BarChart3, TrendingUp, Sparkles
} from 'lucide-react';
import type { BackendStatus, ModelStatusResponse, HistoryItem } from '../types';
import { getEmotionColor, EMOTION_EMOJI, formatConfidence, formatDuration } from '../utils/emotionUtils';

interface DashboardProps {
  backendStatus: BackendStatus;
  modelStatus: ModelStatusResponse | null;
  history: HistoryItem[];
  lastChecked: Date | null;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="glass-card p-5 relative overflow-hidden group hover:border-violet-500/30 transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[var(--slate-400)] uppercase tracking-wider font-semibold mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold tracking-tight" style={{ color }}>
            {value}
          </p>
          {sub && <p className="text-xs text-[var(--slate-400)] mt-1">{sub}</p>}
        </div>
        <div className="p-2.5 rounded-xl transition-transform group-hover:scale-105" style={{ background: `${color}18` }}>
          <Icon size={20} style={{ color }} />
        </div>
      </div>
      <div
        className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full blur-xl opacity-15 pointer-events-none"
        style={{ background: color }}
      />
    </div>
  );
}

function BackendStatusBanner({
  status,
  lastChecked,
}: {
  status: BackendStatus;
  lastChecked: Date | null;
}) {
  if (status === 'checking') {
    return (
      <div className="alert-info flex items-center gap-2">
        <Loader size={15} className="animate-spin text-cyan-400" />
        <span className="text-sm">Connecting to backend health endpoint...</span>
      </div>
    );
  }
  if (status === 'online') {
    return (
      <div className="alert-success flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CheckCircle size={15} className="text-emerald-400" />
          <span className="text-sm font-medium text-emerald-300">
            Backend online and responsive
          </span>
        </div>
        {lastChecked && (
          <span className="text-xs text-emerald-400/80 mono">
            Checked at {lastChecked.toLocaleTimeString()}
          </span>
        )}
      </div>
    );
  }
  return (
    <div className="alert-error flex items-start gap-2.5">
      <XCircle size={16} className="flex-shrink-0 mt-0.5 text-rose-400" />
      <div className="text-sm">
        <strong className="text-rose-300">Backend connection error:</strong> The server is offline or unreachable at the configured API base URL.
        Verify that the backend process is running on port 8000.
      </div>
    </div>
  );
}

export default function Dashboard({
  backendStatus,
  modelStatus,
  history,
  lastChecked,
}: DashboardProps) {
  const recentHistory = history.slice(0, 5);

  // Compute actual emotion breakdown from saved history (no fake stats)
  const emotionCounts = history.reduce((acc, item) => {
    acc[item.predicted_emotion] = (acc[item.predicted_emotion] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20 mb-2">
            <Sparkles size={12} />
            <span>AI Speech Acoustic Intelligence</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            VoxSense AI <span className="gradient-text">Overview</span>
          </h1>
          <p className="text-sm text-[var(--slate-400)] mt-1">
            Real-time vocal emotion recognition & spectral acoustic analysis.
          </p>
        </div>

        <Link
          to="/analyze"
          className="btn-primary self-start sm:self-auto shadow-lg shadow-violet-500/20"
        >
          <Mic size={15} />
          <span>New Analysis</span>
        </Link>
      </div>

      {/* Backend & Model Status Alerts */}
      <BackendStatusBanner status={backendStatus} lastChecked={lastChecked} />

      {backendStatus === 'online' && modelStatus && !modelStatus.model_loaded && (
        <div className="alert-warning flex items-start gap-2.5">
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong className="text-amber-300">Model not ready:</strong> {modelStatus.message}
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Activity}
          label="Backend"
          value={
            backendStatus === 'online'
              ? 'Online'
              : backendStatus === 'checking'
              ? 'Checking'
              : 'Offline'
          }
          sub={backendStatus === 'online' ? 'FastAPI 1.0.0' : 'Connection failed'}
          color={
            backendStatus === 'online'
              ? 'var(--emerald-400)'
              : backendStatus === 'checking'
              ? 'var(--amber-400)'
              : 'var(--rose-500)'
          }
        />
        <StatCard
          icon={Brain}
          label="Model State"
          value={modelStatus?.model_loaded ? 'Ready' : 'Not Loaded'}
          sub={modelStatus?.model_version ? `v${modelStatus.model_version}` : 'Awaiting weights'}
          color={modelStatus?.model_loaded ? 'var(--violet-400)' : 'var(--amber-400)'}
        />
        <StatCard
          icon={Clock}
          label="Total Analyses"
          value={String(history.length)}
          sub={history.length === 1 ? '1 recorded session' : `${history.length} saved records`}
          color="var(--cyan-400)"
        />
        <StatCard
          icon={TrendingUp}
          label="Top Detected"
          value={topEmotion ? topEmotion[0].charAt(0).toUpperCase() + topEmotion[0].slice(1) : '—'}
          sub={topEmotion ? `${topEmotion[1]} occurrences` : 'No data yet'}
          color={topEmotion ? getEmotionColor(topEmotion[0]).text : 'var(--slate-400)'}
        />
      </div>

      {/* Primary Action Hero */}
      <div className="glass-card p-6 bg-gradient-to-r from-violet-950/30 via-slate-900/60 to-cyan-950/20 border-violet-500/20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Mic size={17} className="text-violet-400" />
              Analyze Speech & Detect Emotions
            </h2>
            <p className="text-xs text-[var(--slate-400)] max-w-xl leading-relaxed">
              Record spoken audio with live waveform visualizer or upload an audio file to classify emotional state into 8 acoustic classes.
            </p>
          </div>
          <Link
            to="/analyze"
            className="btn-primary whitespace-nowrap text-xs font-semibold py-2.5 px-4"
          >
            Launch Studio <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Emotion Distribution Summary (If history exists) */}
      {history.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-[var(--slate-300)] uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 size={14} className="text-violet-400" />
              Historical Emotion Distribution
            </h3>
            <span className="text-xs text-[var(--slate-400)]">Based on real predictions</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(emotionCounts).map(([emotion, count]) => {
              const color = getEmotionColor(emotion);
              const percentage = ((count / history.length) * 100).toFixed(0);
              return (
                <div
                  key={emotion}
                  className="p-3 rounded-lg bg-[var(--graphite-700)]/80 border border-[rgba(139,92,246,0.1)] flex items-center gap-3"
                >
                  <span className="text-2xl">{EMOTION_EMOJI[emotion] ?? '🎤'}</span>
                  <div>
                    <span className="text-xs font-bold capitalize text-white block">
                      {emotion}
                    </span>
                    <span className="text-xs text-slate-400">
                      {count} ({percentage}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Analyses Activity */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-[var(--slate-300)] uppercase tracking-wider">
            Recent Analysis Activity
          </h3>
          {history.length > 0 && (
            <Link
              to="/history"
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium"
            >
              View all ({history.length}) →
            </Link>
          )}
        </div>

        {recentHistory.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-3 text-violet-400">
              <Mic size={20} />
            </div>
            <h4 className="text-sm font-semibold text-slate-200">No predictions recorded yet</h4>
            <p className="text-xs text-[var(--slate-400)] mt-1 max-w-sm mx-auto">
              Start by recording your voice or uploading an audio file in the Emotion Analysis Studio.
            </p>
            <Link to="/analyze" className="btn-secondary mt-4 text-xs">
              Go to Analyze Studio
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentHistory.map((item) => {
              const color = getEmotionColor(item.predicted_emotion);
              return (
                <div
                  key={item.id}
                  className="glass-card p-3.5 flex items-center gap-3.5 hover:border-violet-500/30 transition-all"
                >
                  <span className="text-2xl flex-shrink-0">{EMOTION_EMOJI[item.predicted_emotion] ?? '🎤'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold capitalize text-white">
                        {item.predicted_emotion}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{
                          background: color.bg,
                          color: color.text,
                          border: `1px solid ${color.border}`,
                        }}
                      >
                        {formatConfidence(item.confidence)}
                      </span>
                      <span className="text-[11px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded capitalize">
                        {item.inputMethod}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--slate-400)] mt-0.5 truncate">
                      {new Date(item.timestamp).toLocaleString()} · {formatDuration(item.audio_duration_seconds)} duration
                    </p>
                  </div>
                  <Link
                    to="/history"
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors flex-shrink-0"
                    title="View in History"
                  >
                    <ArrowRight size={14} />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
