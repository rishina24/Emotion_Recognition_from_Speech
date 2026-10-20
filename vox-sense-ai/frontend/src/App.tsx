import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Menu, Zap } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import AnalyzePage from './pages/AnalyzePage';
import HistoryPage from './pages/HistoryPage';
import ModelInfoPage from './pages/ModelInfoPage';
import SettingsPage from './pages/SettingsPage';
import { useBackendStatus } from './hooks/useBackendStatus';
import { historyService } from './services/historyService';
import type { HistoryItem } from './types';

export default function App() {
  const { status, modelStatus, lastChecked, refresh } = useBackendStatus();
  const [history, setHistory] = useState<HistoryItem[]>(() => historyService.getAll());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync history when storage changes (other tabs, etc.)
  useEffect(() => {
    const handler = () => setHistory(historyService.getAll());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const handleRemoveHistory = (id: string) => {
    historyService.remove(id);
    setHistory(historyService.getAll());
  };

  const handleClearHistory = () => {
    historyService.clear();
    setHistory([]);
  };

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-[var(--navy-950)] text-slate-200">
        <Sidebar
          backendStatus={status}
          modelLoaded={!!modelStatus?.model_loaded}
          isOpen={mobileMenuOpen}
          onToggle={() => setMobileMenuOpen((prev) => !prev)}
          onClose={() => setMobileMenuOpen(false)}
        />

        <div className="flex-1 flex flex-col md:ml-60 min-w-0">
          {/* Mobile Top Bar */}
          <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[var(--navy-900)] border-b border-[rgba(139,92,246,0.12)] sticky top-0 z-30">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 to-cyan-400 flex items-center justify-center">
                <Zap size={14} className="text-white" />
              </div>
              <span className="text-sm font-bold text-white">VoxSense AI</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-slate-300 hover:text-white rounded-lg bg-[var(--graphite-700)]"
              aria-label="Open navigation menu"
            >
              <Menu size={18} />
            </button>
          </header>

          {/* Main Content Viewport */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto">
            <Routes>
              <Route
                path="/"
                element={
                  <Dashboard
                    backendStatus={status}
                    modelStatus={modelStatus}
                    history={history}
                    lastChecked={lastChecked}
                  />
                }
              />
              <Route
                path="/analyze"
                element={
                  <AnalyzePage
                    modelStatus={modelStatus}
                    backendOnline={status === 'online'}
                  />
                }
              />
              <Route
                path="/history"
                element={
                  <HistoryPage
                    history={history}
                    onRemove={handleRemoveHistory}
                    onClear={handleClearHistory}
                  />
                }
              />
              <Route path="/model" element={<ModelInfoPage />} />
              <Route
                path="/settings"
                element={
                  <SettingsPage
                    backendStatus={status}
                    modelStatus={modelStatus}
                    onRefresh={refresh}
                    onClearHistory={handleClearHistory}
                  />
                }
              />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
