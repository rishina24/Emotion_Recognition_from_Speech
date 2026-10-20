// Analyze page — emotion analysis studio
import { useState } from 'react';
import { Mic, Upload } from 'lucide-react';
import RecordTab from '../components/RecordTab';
import UploadTab from '../components/UploadTab';
import type { ModelStatusResponse } from '../types';

interface AnalyzePageProps {
  modelStatus: ModelStatusResponse | null;
  backendOnline: boolean;
}

export default function AnalyzePage({ modelStatus, backendOnline }: AnalyzePageProps) {
  const [activeTab, setActiveTab] = useState<'record' | 'upload'>('record');
  const modelReady = !!modelStatus?.model_loaded;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Emotion Analysis Studio</h1>
        <p className="text-sm text-[var(--slate-400)] mt-1">
          Record audio or upload a file to run emotion recognition analysis.
        </p>
      </div>

      {!backendOnline && (
        <div className="alert-error text-sm">
          Backend is offline. Analysis is unavailable. Start the backend server first.
        </div>
      )}

      {/* Tab selector */}
      <div className="flex border-b border-[rgba(139,92,246,0.15)]">
        <button
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === 'record' ? 'tab-active' : 'tab-inactive hover:text-slate-300'
          }`}
          onClick={() => setActiveTab('record')}
        >
          <Mic size={14} />
          Record Audio
        </button>
        <button
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === 'upload' ? 'tab-active' : 'tab-inactive hover:text-slate-300'
          }`}
          onClick={() => setActiveTab('upload')}
        >
          <Upload size={14} />
          Upload File
        </button>
      </div>

      {/* Tab content */}
      <div className="fade-in">
        {activeTab === 'record' ? (
          <RecordTab modelReady={modelReady} />
        ) : (
          <UploadTab modelReady={modelReady} />
        )}
      </div>
    </div>
  );
}
