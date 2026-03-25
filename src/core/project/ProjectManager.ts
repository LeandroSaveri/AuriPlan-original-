// ============================================
// ProjectManager.ts - Browser-compatible
// ============================================

import type { FloorPlan, Project, ProjectMetadata } from '@/types';
import { ProjectSerializer } from './ProjectSerializer';
import { ProjectLoader } from './ProjectLoader';
import { ProjectHistory } from './ProjectHistory';

export interface ProjectSettings {
  name: string;
  description: string;
  units: 'metric' | 'imperial';
  precision: number;
  gridSize: number;
  snapToGrid: boolean;
  autoSave: boolean;
  autoSaveInterval: number;
}

export interface ProjectState {
  floorPlan: FloorPlan;
  settings: ProjectSettings;
  metadata: ProjectMetadata;
}

type ProjectEvent = 
  | 'projectCreated' | 'projectLoaded' | 'projectSaved' | 'projectExported'
  | 'projectChanged' | 'floorPlanChanged' | 'settingsChanged' | 'metadataChanged'
  | 'projectDeleted' | 'undo' | 'redo' | 'error';

export class ProjectManager {
  private currentProject: Project | null = null;
  private serializer: ProjectSerializer;
  private loader: ProjectLoader;
  private history: ProjectHistory;
  private settings: ProjectSettings;
  private autoSaveInterval: number | null = null;
  private isDirty = false;
  private listeners: Map<ProjectEvent, Set<(data: any) => void>> = new Map();
  
  private static readonly DEFAULT_SETTINGS: ProjectSettings = {
    name: 'Untitled Project',
    description: '',
    units: 'metric',
    precision: 2,
    gridSize: 0.1,
    snapToGrid: true,
    autoSave: true,
    autoSaveInterval: 60000,
  };

  constructor() {
    this.serializer = new ProjectSerializer();
    this.loader = new ProjectLoader();
    this.history = new ProjectHistory();
    this.settings = { ...ProjectManager.DEFAULT_SETTINGS };
    this.setupHistoryListeners();
  }

  on(event: ProjectEvent, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  off(event: ProjectEvent, callback: (data: any) => void): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: ProjectEvent, data: any): void {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }

  private setupHistoryListeners(): void {
    this.history.on('stateRestored', (state: ProjectState) => {
      if (this.currentProject) {
        this.currentProject.floorPlan = state.floorPlan;
        this.settings = state.settings;
        this.emit('projectChanged', this.currentProject);
      }
    });
  }

  createProject(name?: string, description?: string): Project {
    const now = new Date().toISOString();
    
    this.currentProject = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name ?? ProjectManager.DEFAULT_SETTINGS.name,
      description: description ?? ProjectManager.DEFAULT_SETTINGS.description,
      createdAt: now,
      updatedAt: now,
      floorPlan: { walls: [], rooms: [], furniture: [], dimensions: [] },
      metadata: { version: '1.0.0', author: '', tags: [], thumbnail: '' },
    } as Project;
    
    this.settings = { ...ProjectManager.DEFAULT_SETTINGS, name: this.currentProject.name, description: this.currentProject.description };
    this.history.clear();
    this.saveToHistory();
    this.isDirty = false;
    this.startAutoSave();
    this.emit('projectCreated', this.currentProject);
    
    return this.currentProject;
  }

  async loadProject(source: string | File | Project): Promise<Project> {
    try {
      let project: Project;
      if (typeof source === 'string') {
        project = source.startsWith('http') 
          ? await this.loader.loadFromURL(source)
          : await this.loader.loadFromStorage(source);
      } else if (source instanceof File) {
        project = await this.loader.loadFromFile(source);
      } else {
        project = source;
      }
      
      this.currentProject = project;
      this.settings.name = project.name;
      this.settings.description = project.description;
      this.history.clear();
      this.saveToHistory();
      this.isDirty = false;
      this.startAutoSave();
      this.emit('projectLoaded', this.currentProject);
      
      return this.currentProject;
    } catch (error) {
      this.emit('error', { type: 'load', error });
      throw error;
    }
  }

  async saveProject(): Promise<string> {
    if (!this.currentProject) throw new Error('No project to save');
    
    try {
      this.currentProject.updatedAt = new Date().toISOString();
      const serialized = this.serializer.serialize(this.currentProject);
      const key = `auriplan-project-${this.currentProject.id}`;
      await this.loader.saveToStorage(key, serialized);
      this.isDirty = false;
      this.emit('projectSaved', this.currentProject);
      return key;
    } catch (error) {
      this.emit('error', { type: 'save', error });
      throw error;
    }
  }

  updateFloorPlan(floorPlan: FloorPlan): void {
    if (!this.currentProject) throw new Error('No project loaded');
    this.currentProject.floorPlan = floorPlan;
    this.currentProject.updatedAt = new Date().toISOString();
    this.isDirty = true;
    this.saveToHistory();
    this.emit('floorPlanChanged', floorPlan);
  }

  getFloorPlan(): FloorPlan | null {
    return this.currentProject?.floorPlan ?? null;
  }

  undo(): boolean {
    const result = this.history.undo();
    if (result) {
      this.isDirty = true;
      this.emit('undo', {});
    }
    return result;
  }

  redo(): boolean {
    const result = this.history.redo();
    if (result) {
      this.isDirty = true;
      this.emit('redo', {});
    }
    return result;
  }

  canUndo(): boolean { return this.history.canUndo(); }
  canRedo(): boolean { return this.history.canRedo(); }

  private saveToHistory(): void {
    if (!this.currentProject) return;
    this.history.saveState({
      floorPlan: JSON.parse(JSON.stringify(this.currentProject.floorPlan)),
      settings: { ...this.settings },
      metadata: { ...this.currentProject.metadata },
    });
  }

  private startAutoSave(): void {
    this.stopAutoSave();
    if (this.settings.autoSave) {
      this.autoSaveInterval = window.setInterval(() => {
        if (this.isDirty) this.saveProject().catch(console.error);
      }, this.settings.autoSaveInterval);
    }
  }

  private stopAutoSave(): void {
    if (this.autoSaveInterval !== null) {
      window.clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  getCurrentProject(): Project | null { return this.currentProject; }
  isProjectDirty(): boolean { return this.isDirty; }
  hasProject(): boolean { return this.currentProject !== null; }

  dispose(): void {
    this.stopAutoSave();
    this.history.dispose();
    this.listeners.clear();
    this.currentProject = null;
  }

  // Compatibilidade com código antigo
  removeAllListeners(): void {
    this.listeners.clear();
  }
}
