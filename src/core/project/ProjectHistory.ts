// ============================================
// ProjectHistory.ts - Browser-compatible
// ============================================

import type { ProjectState } from './ProjectManager';

export interface HistoryEntry {
  id: string;
  timestamp: number;
  state: ProjectState;
  description: string;
}

type HistoryEvent = 'stateSaved' | 'stateRestored' | 'undo' | 'redo' | 'historyChanged' | 'historyCleared';

export class ProjectHistory {
  private history: HistoryEntry[] = [];
  private currentIndex = -1;
  private maxSize = 100;
  private listeners: Map<HistoryEvent, Set<(data: any) => void>> = new Map();

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  on(event: HistoryEvent, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  private emit(event: HistoryEvent, data: any): void {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }

  saveState(state: ProjectState, description = 'Change'): void {
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    this.history.push({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      state: JSON.parse(JSON.stringify(state)),
      description,
    });

    if (this.history.length > this.maxSize) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }

    this.emit('stateSaved', {});
    this.emit('historyChanged', { canUndo: this.canUndo(), canRedo: this.canRedo() });
  }

  undo(): boolean {
    if (!this.canUndo()) return false;
    this.currentIndex--;
    this.emit('stateRestored', this.history[this.currentIndex].state);
    this.emit('undo', {});
    this.emit('historyChanged', { canUndo: this.canUndo(), canRedo: this.canRedo() });
    return true;
  }

  redo(): boolean {
    if (!this.canRedo()) return false;
    this.currentIndex++;
    this.emit('stateRestored', this.history[this.currentIndex].state);
    this.emit('redo', {});
    this.emit('historyChanged', { canUndo: this.canUndo(), canRedo: this.canRedo() });
    return true;
  }

  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  clear(): void {
    this.history = [];
    this.currentIndex = -1;
    this.emit('historyCleared', {});
    this.emit('historyChanged', { canUndo: false, canRedo: false });
  }

  dispose(): void {
    this.clear();
    this.listeners.clear();
  }

  // Compatibilidade com código antigo
  removeAllListeners(): void {
    this.listeners.clear();
  }
}
