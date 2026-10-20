// useBackendStatus — polls backend health and model status
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/apiClient';
import type { BackendStatus, ModelStatusResponse } from '../types';

interface BackendStatusResult {
  status: BackendStatus;
  modelStatus: ModelStatusResponse | null;
  lastChecked: Date | null;
  refresh: () => void;
}

export function useBackendStatus(): BackendStatusResult {
  const [status, setStatus] = useState<BackendStatus>('checking');
  const [modelStatus, setModelStatus] = useState<ModelStatusResponse | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const check = useCallback(async () => {
    setStatus('checking');
    try {
      await apiClient.health();
      const ms = await apiClient.modelStatus();
      setModelStatus(ms);
      setStatus('online');
    } catch {
      setStatus('offline');
      setModelStatus(null);
    }
    setLastChecked(new Date());
  }, []);

  useEffect(() => {
    check();
    // Recheck every 30 seconds
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, [check]);

  return { status, modelStatus, lastChecked, refresh: check };
}
