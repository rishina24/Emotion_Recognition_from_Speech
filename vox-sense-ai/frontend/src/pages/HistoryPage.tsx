// HistoryPage — Complete, searchable, filterable history with details modal and export
import { useState, useMemo } from 'react';
import {
  Trash2, Clock, Search, Filter, Calendar, Zap, FileAudio,
  Eye, X, ArrowUpDown, ChevronRight, BarChart2
} from 'lucide-react';
import type { HistoryItem } from '../types';
import {
  getEmotionColor, EMOTION_EMOJI, formatConfidence, formatDuration
} from '../utils/emotionUtils';

interface HistoryPageProps {
  history: HistoryItem[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

const ALL_EMOTIONS = [
  'neutral', 'calm', 'happy', 'sad',
  'angry', 'fearful', 'disgust', 'surprised'
];

export default function HistoryPage({ history, onRemove, onClear }: HistoryPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState<string>('all');
  const [selectedMethod, setSelectedMethod] = useState<'all' | 'recording' | 'upload'>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'conf-desc' | 'conf-asc'>('date-desc');
  const [activeItem, setActiveItem] = useState<HistoryItem | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  // Filter & sort
  const filteredHistory = useMemo(() => {
    return history
      .filter((item) => {
        if (selectedEmotion !== 'all' && item.predicted_emotion !== selectedEmotion) return false;
        if (selectedMethod !== 'all' && item.inputMethod !== selectedMethod) return false;
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const matchesEmotion = item.predicted_emotion.toLowerCase().includes(term);
          const matchesFile = item.filename?.toLowerCase().includes(term);
          const matchesId = item.id.toLowerCase().includes(term);
          if (!matchesEmotion && !matchesFile && !matchesId) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') return b.timestamp - a.timestamp;
        if (sortBy === 'date-asc') return a.timestamp - b.timestamp;
        if (sortBy === 'conf-desc') return b.confidence - a.confidence;
        if (sortBy === 'conf-asc') return a.confidence - b.confidence;
        return 0;
      });
  }, [history, searchTerm, selectedEmotion, selectedMethod, sortBy]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Prediction History</h1>
          <p className="text-sm text-[var(--slate-400)] mt-0.5">
            Audit log of all emotion analysis sessions. Stored securely and privately in your browser.
          </p>
        </div>
        {history.length > 0 && (
          <div className="flex items-center gap-2">
            {confirmClear ? (
              <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 p-1.5 rounded-lg">
                <span className="text-xs text-rose-300 font-medium px-1">Clear all entries?</span>
                <button
                  className="px-2.5 py-1 text-xs bg-rose-500 text-white rounded hover:bg-rose-600 font-medium transition-colors"
                  onClick={() => { onClear(); setConfirmClear(false); }}
                >
                  Yes, Clear
                </button>
                <button
                  className="px-2 py-1 text-xs text-slate-300 hover:text-white transition-colors"
                  onClick={() => setConfirmClear(false)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                className="btn-danger flex items-center gap-1.5 text-xs py-2 px-3"
                onClick={() => setConfirmClear(true)}
              >
                <Trash2 size={13} />
                Clear All History
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by emotion, filename, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[var(--graphite-700)] border border-[rgba(139,92,246,0.15)] rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Emotion Filter */}
          <div className="flex items-center gap-1.5">
            <Filter size={14} className="text-slate-400 flex-shrink-0" />
            <select
              value={selectedEmotion}
              onChange={(e) => setSelectedEmotion(e.target.value)}
              aria-label="Filter by emotion"
              className="text-xs bg-[var(--graphite-700)] border border-[rgba(139,92,246,0.15)] rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-violet-500"
            >
              <option value="all">All Emotions</option>
              {ALL_EMOTIONS.map((em) => (
                <option key={em} value={em} className="capitalize">
                  {em.charAt(0).toUpperCase() + em.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Input Method Filter */}
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value as 'all' | 'recording' | 'upload')}
            aria-label="Filter by input method"
            className="text-xs bg-[var(--graphite-700)] border border-[rgba(139,92,246,0.15)] rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-violet-500"
          >
            <option value="all">All Methods</option>
            <option value="recording">Microphone</option>
            <option value="upload">Upload</option>
          </select>

          {/* Sort By */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown size={14} className="text-slate-400 flex-shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              aria-label="Sort predictions"
              className="text-xs bg-[var(--graphite-700)] border border-[rgba(139,92,246,0.15)] rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-violet-500"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="conf-desc">Highest Confidence</option>
              <option value="conf-asc">Lowest Confidence</option>
            </select>
          </div>
        </div>

        {/* Counter and Active Filter Pill */}
        <div className="flex items-center justify-between text-xs text-[var(--slate-400)] pt-1">
          <span>
            Showing <strong className="text-slate-200">{filteredHistory.length}</strong> of{' '}
            <strong className="text-slate-200">{history.length}</strong> predictions
          </span>
          {(selectedEmotion !== 'all' || selectedMethod !== 'all' || searchTerm) && (
            <button
              onClick={() => { setSelectedEmotion('all'); setSelectedMethod('all'); setSearchTerm(''); }}
              className="text-violet-400 hover:text-violet-300 underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* History List */}
      {filteredHistory.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Clock size={36} className="text-[var(--slate-400)] mx-auto mb-3 opacity-60" />
          <h3 className="text-sm font-semibold text-slate-200">No predictions found</h3>
          <p className="text-xs text-[var(--slate-400)] mt-1 max-w-sm mx-auto">
            {history.length === 0
              ? 'Analyze speech using microphone recording or audio file upload to populate your history.'
              : 'Try adjusting your search query or emotion filter above to view matching results.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredHistory.map((item) => {
            const color = getEmotionColor(item.predicted_emotion);
            return (
              <div
                key={item.id}
                className="glass-card p-4 flex items-center justify-between gap-4 hover:border-violet-500/30 transition-all duration-150 cursor-pointer group"
                onClick={() => setActiveItem(item)}
              >
                {/* Left: Emotion Icon & Primary details */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: `${color.bg}40`, border: `1px solid ${color.border}` }}
                  >
                    {EMOTION_EMOJI[item.predicted_emotion] ?? '🎤'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold capitalize text-white group-hover:text-violet-300 transition-colors">
                        {item.predicted_emotion}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: color.bg, color: color.text, border: `1px solid ${color.border}` }}
                      >
                        {formatConfidence(item.confidence)}
                      </span>
                      <span className="text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 capitalize">
                        {item.inputMethod}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 truncate">
                      {item.filename ? (
                        <span className="flex items-center gap-1 truncate text-slate-300">
                          <FileAudio size={12} className="flex-shrink-0" />
                          <span className="truncate max-w-[200px]">{item.filename}</span>
                        </span>
                      ) : null}
                      <span className="flex items-center gap-1">
                        <Calendar size={12} className="flex-shrink-0" />
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                      <span>· {formatDuration(item.audio_duration_seconds)}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="p-1.5 rounded-lg text-slate-400 hover:text-violet-300 hover:bg-violet-500/10 transition-colors"
                    title="View details & probabilities"
                    onClick={() => setActiveItem(item)}
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete record"
                    onClick={() => onRemove(item.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                  <ChevronRight size={16} className="text-slate-500 group-hover:text-slate-300 transition-colors hidden sm:block" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-card max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 border-violet-500/30">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{EMOTION_EMOJI[activeItem.predicted_emotion] ?? '🎤'}</span>
                <div>
                  <h3 className="text-lg font-bold text-white capitalize">
                    {activeItem.predicted_emotion} Prediction Details
                  </h3>
                  <p className="text-xs text-slate-400">ID: <span className="mono">{activeItem.id}</span></p>
                </div>
              </div>
              <button
                onClick={() => setActiveItem(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-[var(--graphite-700)] p-2.5 rounded-lg">
                <span className="text-slate-400 block mb-0.5">Confidence</span>
                <span className="text-sm font-semibold text-emerald-400">{formatConfidence(activeItem.confidence)}</span>
              </div>
              <div className="bg-[var(--graphite-700)] p-2.5 rounded-lg">
                <span className="text-slate-400 block mb-0.5">Duration</span>
                <span className="text-sm font-semibold text-slate-200">{formatDuration(activeItem.audio_duration_seconds)}</span>
              </div>
              <div className="bg-[var(--graphite-700)] p-2.5 rounded-lg">
                <span className="text-slate-400 block mb-0.5">Inference Time</span>
                <span className="text-sm font-semibold text-cyan-400">{activeItem.processing_time_ms.toFixed(0)} ms</span>
              </div>
            </div>

            {/* Probabilities breakdown */}
            <div>
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BarChart2 size={13} className="text-violet-400" />
                Softmax Probabilities
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {Object.entries(activeItem.probabilities)
                  .sort((a, b) => b[1] - a[1])
                  .map(([emotion, prob]) => {
                    const probPct = (prob * 100).toFixed(1);
                    const isWinner = emotion === activeItem.predicted_emotion;
                    const emColor = getEmotionColor(emotion);
                    return (
                      <div key={emotion} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className={`capitalize ${isWinner ? 'font-bold text-white' : 'text-slate-400'}`}>
                            {EMOTION_EMOJI[emotion] ?? ''} {emotion}
                          </span>
                          <span className={`mono ${isWinner ? 'text-violet-300 font-bold' : 'text-slate-400'}`}>
                            {probPct}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${probPct}%`,
                              backgroundColor: isWinner ? emColor.chart : '#475569'
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-2 border-t border-[rgba(139,92,246,0.15)]">
              <button
                className="btn-secondary text-xs py-1.5 px-4"
                onClick={() => setActiveItem(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
