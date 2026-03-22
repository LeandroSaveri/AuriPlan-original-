// ============================================
// EDITOR STORE - Estado Global do Editor
// ============================================

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools, persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { 
  Project, 
  Scene, 
  Wall, 
  Room, 
  Door, 
  Window, 
  Furniture, 
  Measurement,
  User,
  ViewMode,
  Tool,
  GridSettings,
  SnapSettings,
  CameraState,
  Vec2
} from '@types';

// ============================================
// TYPES
// ============================================
export interface EditorState {
  // Project
  project: Project | null;
  scenes: Scene[];
  currentSceneId: string | null;
  
  // UI State
  viewMode: ViewMode;
  tool: Tool;
  selectedIds: string[];
  hoveredId: string | null;
  
  // Settings
  grid: GridSettings;
  snap: SnapSettings;
  camera: CameraState;
  
  // History
  history: EditorState[];
  historyIndex: number;
  
  // Actions - Project
  createProject: (name: string, owner: User, description?: string) => void;
  saveProject: () => void;
  exportProject: () => string;
  importProject: (data: string) => boolean;
  
  // Actions - Scene
  addScene: (name: string) => void;
  deleteScene: (id: string) => void;
  setCurrentScene: (id: string) => void;
  
  // Actions - Walls
  addWall: (start: Vec2, end: Vec2) => void;
  updateWall: (id: string, updates: Partial<Wall>) => void;
  deleteWall: (id: string) => void;
  
  // Actions - Rooms
  addRoom: (points: Vec2[]) => void;
  updateRoom: (id: string, updates: Partial<Room>) => void;
  deleteRoom: (id: string) => void;
  
  // Actions - Doors
  addDoor: (wallId: string, position: number, width: number) => void;
  updateDoor: (id: string, updates: Partial<Door>) => void;
  deleteDoor: (id: string) => void;
  
  // Actions - Windows
  addWindow: (wallId: string, position: number, width: number) => void;
  updateWindow: (id: string, updates: Partial<Window>) => void;
  deleteWindow: (id: string) => void;
  
  // Actions - Furniture
  addFurniture: (furniture: Omit<Furniture, 'id'>) => void;
  updateFurniture: (id: string, updates: Partial<Furniture>) => void;
  deleteFurniture: (id: string) => void;
  duplicateFurniture: (id: string) => void;
  
  // Actions - Measurements
  addMeasurement: (start: Vec2, end: Vec2) => void;
  deleteMeasurement: (id: string) => void;
  
  // Actions - Selection
  select: (id: string | string[], addToSelection?: boolean) => void;
  deselect: (id: string) => void;
  deselectAll: () => void;
  
  // Actions - UI
  setViewMode: (mode: ViewMode) => void;
  setTool: (tool: Tool) => void;
  toggleGrid: () => void;
  setGrid: (grid: Partial<GridSettings>) => void;
  setSnap: (snap: Partial<SnapSettings>) => void;
  setCamera: (camera: Partial<CameraState>) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  fitToView: () => void;
  
  // Actions - History
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  saveToHistory: () => void;
}

// ============================================
// INITIAL STATE
// ============================================
const initialState: Omit<EditorState, 
  'createProject' | 'saveProject' | 'exportProject' | 'importProject' |
  'addScene' | 'deleteScene' | 'setCurrentScene' |
  'addWall' | 'updateWall' | 'deleteWall' |
  'addRoom' | 'updateRoom' | 'deleteRoom' |
  'addDoor' | 'updateDoor' | 'deleteDoor' |
  'addWindow' | 'updateWindow' | 'deleteWindow' |
  'addFurniture' | 'updateFurniture' | 'deleteFurniture' | 'duplicateFurniture' |
  'addMeasurement' | 'deleteMeasurement' |
  'select' | 'deselect' | 'deselectAll' |
  'setViewMode' | 'setTool' | 'toggleGrid' | 'setGrid' | 'setSnap' | 'setCamera' |
  'zoomIn' | 'zoomOut' | 'fitToView' |
  'undo' | 'redo' | 'canUndo' | 'canRedo' | 'saveToHistory'
> = {
  project: null,
  scenes: [],
  currentSceneId: null,
  viewMode: '2d',
  tool: 'select',
  selectedIds: [],
  hoveredId: null,
  grid: {
    visible: true,
    size: 0.5,
    color: '#475569',
    opacity: 0.3,
  },
  snap: {
    enabled: true,
    grid: true,
    endpoints: true,
    midpoints: true,
    edges: true,
    centers: true,
    perpendicular: true,
    angle: true,
    distance: 0.3,
  },
  camera: {
    position: [0, 0, 10],
    target: [0, 0, 0],
    zoom: 1,
    rotation: 0,
  },
  history: [],
  historyIndex: -1,
};

// ============================================
// STORE
// ============================================
export const useEditorStore = create<EditorState>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      // ============================================
      // PROJECT ACTIONS
      // ============================================
      createProject: (name, owner, description = '') => {
        const sceneId = uuidv4();
        const newScene: Scene = {
          id: sceneId,
          name: 'Planta Baixa',
          level: 0,
          height: 2.8,
          walls: [],
          rooms: [],
          doors: [],
          windows: [],
          furniture: [],
          measurements: [],
        };

        const newProject: Project = {
          id: uuidv4(),
          name,
          description,
          owner,
          collaborators: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          settings: {
            units: 'metric',
            currency: 'BRL',
          },
        };

        set((state) => {
          state.project = newProject;
          state.scenes = [newScene];
          state.currentSceneId = sceneId;
          state.selectedIds = [];
        });

        get().saveToHistory();
      },

      saveProject: () => {
        const { project, scenes } = get();
        if (!project) return;

        const data = JSON.stringify({ project, scenes });
        localStorage.setItem(`project_${project.id}`, data);
        
        set((state) => {
          if (state.project) {
            state.project.updatedAt = new Date().toISOString();
          }
        });
      },

      exportProject: () => {
        const { project, scenes } = get();
        return JSON.stringify({ project, scenes }, null, 2);
      },

      importProject: (data) => {
        try {
          const parsed = JSON.parse(data);
          set((state) => {
            state.project = parsed.project;
            state.scenes = parsed.scenes;
            state.currentSceneId = parsed.scenes[0]?.id || null;
          });
          get().saveToHistory();
          return true;
        } catch {
          return false;
        }
      },

      // ============================================
      // SCENE ACTIONS
      // ============================================
      addScene: (name) => {
        const newScene: Scene = {
          id: uuidv4(),
          name,
          level: get().scenes.length,
          height: 2.8,
          walls: [],
          rooms: [],
          doors: [],
          windows: [],
          furniture: [],
          measurements: [],
        };

        set((state) => {
          state.scenes.push(newScene);
        });

        get().saveToHistory();
      },

      deleteScene: (id) => {
        set((state) => {
          state.scenes = state.scenes.filter(s => s.id !== id);
          if (state.currentSceneId === id) {
            state.currentSceneId = state.scenes[0]?.id || null;
          }
        });

        get().saveToHistory();
      },

      setCurrentScene: (id) => {
        set((state) => {
          state.currentSceneId = id;
        });
      },

      // ============================================
      // WALL ACTIONS
      // ============================================
      addWall: (start, end) => {
        const scene = get().scenes.find(s => s.id === get().currentSceneId);
        if (!scene) return;

        const newWall: Wall = {
          id: uuidv4(),
          start,
          end,
          thickness: 0.15,
          height: 2.8,
          color: '#8B4513',
          visible: true,
          locked: false,
          metadata: {},
        };

        set((state) => {
          const scene = state.scenes.find(s => s.id === state.currentSceneId);
          if (scene) {
            scene.walls.push(newWall);
          }
        });

        get().saveToHistory();
      },

      updateWall: (id, updates) => {
        set((state) => {
          const scene = state.scenes.find(s => s.id === state.currentSceneId);
          const wall = scene?.walls.find(w => w.id === id);
          if (wall) {
            Object.assign(wall, updates);
          }
        });

        get().saveToHistory();
      },

      deleteWall: (id) => {
        set((state) => {
          const scene = state.scenes.find(s => s.id === state.currentSceneId);
          if (scene) {
            scene.walls = scene.walls.filter(w => w.id !== id);
          }
        });

        get().saveToHistory();
      },

      // ============================================
      // ROOM ACTIONS
      // ============================================
      addRoom: (points) => {
        const scene = get().scenes.find(s => s.id === get().currentSceneId);
        if (!scene) return;

        // Calculate area
        let area = 0;
        for (let i = 0; i < points.length; i++) {
          const j = (i + 1) % points.length;
          area += points[i][0] * points[j][1];
          area -= points[j][0] * points[i][1];
        }
        area = Math.abs(area) / 2;

        // Calculate perimeter
        let perimeter = 0;
        for (let i = 0; i < points.length; i++) {
          const j = (i + 1) % points.length;
          const dx = points[j][0] - points[i][0];
          const dy = points[j][1] - points[i][1];
          perimeter += Math.sqrt(dx * dx + dy * dy);
        }

        const newRoom: Room = {
          id: uuidv4(),
          name: 'Novo Cômodo',
          type: 'custom',
          points,
          wallColor: '#F5F5DC',
          floorColor: '#D2691E',
          ceilingColor: '#FFFFFF',
          height: 2.8,
          area,
          perimeter,
          visible: true,
          locked: false,
          metadata: {},
        };

        set((state) => {
          const scene = state.scenes.find(s => s.id === state.currentSceneId);
          if (scene) {
            scene.rooms.push(newRoom);
          }
        });

        get().saveToHistory();
      },

      updateRoom: (id, updates) => {
        set((state) => {
          const scene = state.scenes.find(s => s.id === state.currentSceneId);
          const room = scene?.rooms.find(r => r.id === id);
          if (room) {
            Object.assign(room, updates);
          }
        });

        get().saveToHistory();
      },

      deleteRoom: (id) => {
        set((state) => {
          const scene = state.scenes.find(s => s.id === state.currentSceneId);
          if (scene) {
            scene.rooms = scene.rooms.filter(r => r.id !== id);
          }
        });

        get().saveToHistory();
      },

      // ============================================
      // DOOR ACTIONS
      // ============================================
      addDoor: (wallId, position, width) => {
        const scene = get().scenes.find(s => s.id === get().currentSceneId);
        if (!scene) return;

        const newDoor: Door = {
          id: uuidv4(),
          wallId,
          position,
          width,
          height: 2.1,
          depth: 0.05,
          swing: 'left',
          style: 'panel',
          panelColor: '#8B4513',
          frameColor: '#654321',
          visible: true,
          locked: false,
          metadata: {},
        };

        set((state) => {
          const scene = state.scenes.find(s => s.id === state.currentSceneId);
          if (scene) {
            scene.doors.push(newDoor);
          }
        });

        get().saveToHistory();
      },

      updateDoor: (id, updates) => {
        set((state) => {
          const scene = state.scenes.find(s => s.id === state.currentSceneId);
          const door = scene?.doors.find(d => d.id === id);
          if (door) {
            Object.assign(door, updates);
          }
        });

        get().saveToHistory();
      },

      deleteDoor: (id) => {
        set((state) => {
          const scene = state.scenes.find(s => s.id === state.currentSceneId);
          if (scene) {
            scene.doors = scene.doors.filter(d => d.id !== id);
          }
        });

        get().saveToHistory();
      },

      // ============================================
      // WINDOW ACTIONS
      // ============================================
      addWindow: (wallId, position, width) => {
        const scene = get().scenes.find(s => s.id === get().currentSceneId);
        if (!scene) return;

        const newWindow: Window = {
          id: uuidv4(),
          wallId,
          position,
          width,
          height: 1.2,
          sillHeight: 0.9,
          depth: 0.08,
          style: 'single-hung',
          frameColor: '#FFFFFF',
          visible: true,
          locked: false,
          metadata: {},
        };

        set((state) => {
          const scene = state.scenes.find(s => s.id === state.currentSceneId);
          if (scene) {
            scene.windows.push(newWindow);
          }
        });

        get().saveToHistory();
      },

      updateWindow: (id, updates) => {
        set((state) => {
          const scene = state.scenes.find(s => s.id === state.currentSceneId);
          const window = scene?.windows.find(w => w.id === id);
          if (window) {
            Object.assign(window, updates);
          }
        });

        get().saveToHistory();
      },

      deleteWindow: (id) => {
        set((state) => {
          const scene = state.scenes.find(s => s.id === state.currentSceneId);
          if (scene) {
            scene.windows = scene.windows.filter(w => w.id !== id);
          }
        });

        get().saveToHistory();
      },

      // ============================================
      // FURNITURE ACTIONS
      // ============================================
      addFurniture: (furniture) => {
        const scene = get().scenes.find(s => s.id === get().currentSceneId);
        if (!scene) return;

        const newFurniture: Furniture = {
          ...furniture,
          id: uuidv4(),
        };

        set((state) => {
          const scene = state.scenes.find(s => s.id === state.currentSceneId);
          if (scene) {
            scene.furniture.push(newFurniture);
          }
        });

        get().saveToHistory();
      },

      updateFurniture: (id, updates) => {
        set((state) => {
          const scene = state.scenes.find(s => s.id === state.currentSceneId);
          const item = scene?.furniture.find(f => f.id === id);
          if (item) {
            Object.assign(item, updates);
          }
        });

        get().saveToHistory();
      },

      deleteFurniture: (id) => {
        set((state) => {
          const scene = state.scenes.find(s => s.id === state.currentSceneId);
          if (scene) {
            scene.furniture = scene.furniture.filter(f => f.id !== id);
          }
        });

        get().saveToHistory();
      },

      duplicateFurniture: (id) => {
        const scene = get().scenes.find(s => s.id === get().currentSceneId);
        const item = scene?.furniture.find(f => f.id === id);
        if (!item) return;

        const duplicated: Furniture = {
          ...item,
          id: uuidv4(),
          position: [item.position[0] + 0.5, item.position[1], item.position[2] + 0.5],
        };

        set((state) => {
          const scene = state.scenes.find(s => s.id === state.currentSceneId);
          if (scene) {
            scene.furniture.push(duplicated);
          }
        });

        get().saveToHistory();
      },

      // ============================================
      // MEASUREMENT ACTIONS
      // ============================================
      addMeasurement: (start, end) => {
        const scene = get().scenes.find(s => s.id === get().currentSceneId);
        if (!scene) return;

        const dx = end[0] - start[0];
        const dy = end[1] - start[1];
        const value = Math.sqrt(dx * dx + dy * dy);

        const newMeasurement: Measurement = {
          id: uuidv4(),
          start,
          end,
          value,
          unit: 'm',
          visible: true,
        };

        set((state) => {
          const scene = state.scenes.find(s => s.id === state.currentSceneId);
          if (scene) {
            scene.measurements.push(newMeasurement);
          }
        });

        get().saveToHistory();
      },

      deleteMeasurement: (id) => {
        set((state) => {
          const scene = state.scenes.find(s => s.id === state.currentSceneId);
          if (scene) {
            scene.measurements = scene.measurements.filter(m => m.id !== id);
          }
        });

        get().saveToHistory();
      },

      // ============================================
      // SELECTION ACTIONS
      // ============================================
      select: (id, addToSelection = false) => {
        set((state) => {
          if (Array.isArray(id)) {
            state.selectedIds = id;
          } else if (addToSelection) {
            if (!state.selectedIds.includes(id)) {
              state.selectedIds.push(id);
            }
          } else {
            state.selectedIds = [id];
          }
        });
      },

      deselect: (id) => {
        set((state) => {
          state.selectedIds = state.selectedIds.filter(sid => sid !== id);
        });
      },

      deselectAll: () => {
        set((state) => {
          state.selectedIds = [];
        });
      },

      // ============================================
      // UI ACTIONS
      // ============================================
      setViewMode: (mode) => {
        set((state) => {
          state.viewMode = mode;
        });
      },

      setTool: (tool) => {
        set((state) => {
          state.tool = tool;
        });
      },

      toggleGrid: () => {
        set((state) => {
          state.grid.visible = !state.grid.visible;
        });
      },

      setGrid: (grid) => {
        set((state) => {
          state.grid = { ...state.grid, ...grid };
        });
      },

      setSnap: (snap) => {
        set((state) => {
          state.snap = { ...state.snap, ...snap };
        });
      },

      setCamera: (camera) => {
        set((state) => {
          state.camera = { ...state.camera, ...camera };
        });
      },

      zoomIn: () => {
        set((state) => {
          state.camera.zoom = Math.min(state.camera.zoom * 1.2, 10);
        });
      },

      zoomOut: () => {
        set((state) => {
          state.camera.zoom = Math.max(state.camera.zoom / 1.2, 0.1);
        });
      },

      fitToView: () => {
        set((state) => {
          state.camera.position = [0, 0, 10];
          state.camera.target = [0, 0, 0];
          state.camera.zoom = 1;
          state.camera.rotation = 0;
        });
      },

      // ============================================
      // HISTORY ACTIONS
      // ============================================
      saveToHistory: () => {
        set((state) => {
          const currentState = JSON.parse(JSON.stringify({
            scenes: state.scenes,
            currentSceneId: state.currentSceneId,
          }));

          // Remove future history if we're not at the end
          if (state.historyIndex < state.history.length - 1) {
            state.history = state.history.slice(0, state.historyIndex + 1);
          }

          // Add new state
          state.history.push(currentState);
          state.historyIndex++;

          // Limit history size
          if (state.history.length > 50) {
            state.history.shift();
            state.historyIndex--;
          }
        });
      },

      undo: () => {
        const { historyIndex, history } = get();
        if (historyIndex <= 0) return;

        const newIndex = historyIndex - 1;
        const state = history[newIndex];

        set((s) => {
          s.scenes = state.scenes;
          s.currentSceneId = state.currentSceneId;
          s.historyIndex = newIndex;
          s.selectedIds = [];
        });
      },

      redo: () => {
        const { historyIndex, history } = get();
        if (historyIndex >= history.length - 1) return;

        const newIndex = historyIndex + 1;
        const state = history[newIndex];

        set((s) => {
          s.scenes = state.scenes;
          s.currentSceneId = state.currentSceneId;
          s.historyIndex = newIndex;
          s.selectedIds = [];
        });
      },

      canUndo: () => {
        return get().historyIndex > 0;
      },

      canRedo: () => {
        return get().historyIndex < get().history.length - 1;
      },
    })),
    { name: 'EditorStore' }
  )
);

// ============================================
// SELECTORS
// ============================================
export const selectCurrentScene = (state: EditorState): Scene | undefined => {
  return state.scenes.find(s => s.id === state.currentSceneId);
};

export const selectSelectedItems = (state: EditorState): (Wall | Room | Door | Window | Furniture)[] => {
  const scene = selectCurrentScene(state);
  if (!scene) return [];

  const items: (Wall | Room | Door | Window | Furniture)[] = [];

  state.selectedIds.forEach(id => {
    const wall = scene.walls.find(w => w.id === id);
    if (wall) items.push(wall);

    const room = scene.rooms.find(r => r.id === id);
    if (room) items.push(room);

    const door = scene.doors.find(d => d.id === id);
    if (door) items.push(door);

    const window = scene.windows.find(w => w.id === id);
    if (window) items.push(window);

    const furniture = scene.furniture.find(f => f.id === id);
    if (furniture) items.push(furniture);
  });

  return items;
};

export const selectProjectStats = (state: EditorState) => {
  const scene = selectCurrentScene(state);
  if (!scene) return { walls: 0, rooms: 0, doors: 0, windows: 0, furniture: 0, area: 0 };

  const area = scene.rooms.reduce((acc, room) => acc + room.area, 0);

  return {
    walls: scene.walls.length,
    rooms: scene.rooms.length,
    doors: scene.doors.length,
    windows: scene.windows.length,
    furniture: scene.furniture.length,
    area,
  };
};
