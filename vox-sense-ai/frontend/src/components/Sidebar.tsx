// Navigation sidebar component with responsive collapsible drawer
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Mic, Clock, Info, Settings, Zap,
  Menu, X
} from 'lucide-react';
import type { BackendStatus } from '../types';

interface SidebarProps {
  backendStatus: BackendStatus;
  modelLoaded: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const NAV_ITEMS = [
  { to: '/',         icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/analyze',  icon: Mic,             label: 'Analyze Audio' },
  { to: '/history',  icon: Clock,           label: 'Prediction History' },
  { to: '/model',    icon: Info,            label: 'Model Info' },
  { to: '/settings', icon: Settings,        label: 'Settings' },
];

function StatusBadge({
  status,
  modelLoaded,
}: {
  status: BackendStatus;
  modelLoaded: boolean;
}) {
  const statusConfig = {
    checking: { dot: 'bg-amber-400 animate-pulse', label: 'Connecting...', border: 'border-amber-500/20' },
    online:   { dot: 'bg-emerald-400', label: 'Backend Online', border: 'border-emerald-500/20' },
    offline:  { dot: 'bg-rose-500', label: 'Backend Offline', border: 'border-rose-500/20' },
    error:    { dot: 'bg-rose-500', label: 'Connection Error', border: 'border-rose-500/20' },
  };

  const curr = statusConfig[status];

  return (
    <div className="space-y-1.5 pt-2 border-t border-[rgba(139,92,246,0.12)]">
      <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[var(--graphite-700)]/80 border ${curr.border}`}>
        <div className="relative flex-shrink-0">
          <span className={`block w-2 h-2 rounded-full ${curr.dot}`} />
        </div>
        <span className="text-[11px] font-medium text-slate-300 truncate">{curr.label}</span>
      </div>

      {status === 'online' && (
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[var(--graphite-700)]/50 border border-[rgba(139,92,246,0.08)]">
          <span
            className={`block w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              modelLoaded ? 'bg-violet-400' : 'bg-amber-400'
            }`}
          />
          <span className="text-[11px] text-slate-400 truncate">
            {modelLoaded ? 'Model Ready' : 'Model Not Ready'}
          </span>
        </div>
      )}
    </div>
  );
}

export default function Sidebar({
  backendStatus,
  modelLoaded,
  isOpen,
  onClose,
}: SidebarProps) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`flex flex-col w-60 min-h-screen bg-[var(--navy-900)] border-r border-[rgba(139,92,246,0.12)] fixed left-0 top-0 z-50 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="px-5 py-4 border-b border-[rgba(139,92,246,0.12)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 flex items-center justify-center flex-shrink-0 shadow-md shadow-violet-500/20">
              <Zap size={16} className="text-white" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-white tracking-tight leading-none block">
                VoxSense AI
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Acoustic Emotion AI</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg md:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-150 ${
                  isActive
                    ? 'bg-violet-600/15 text-violet-300 border border-violet-500/30 shadow-xs'
                    : 'text-slate-400 hover:bg-[var(--graphite-700)] hover:text-slate-200'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Live Connectivity Footer */}
        <div className="p-3">
          <StatusBadge status={backendStatus} modelLoaded={modelLoaded} />
        </div>
      </aside>
    </>
  );
}
