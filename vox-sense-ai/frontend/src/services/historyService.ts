// History persistence service — uses localStorage
import type { HistoryItem } from '../types';

const STORAGE_KEY = 'voxsense_history';
const MAX_ITEMS = 50;

export const historyService = {
  getAll(): HistoryItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed as HistoryItem[];
    } catch {
      return [];
    }
  },

  add(item: HistoryItem): void {
    try {
      const existing = this.getAll();
      const updated = [item, ...existing].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // localStorage may be unavailable in private browsing
    }
  },

  remove(id: string): void {
    try {
      const updated = this.getAll().filter((item) => item.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  },

  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  },
};
