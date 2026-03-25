// ============================================
// HOOK: useEditor
// Gerenciamento centralizado do estado do editor
// ============================================

import { useCallback } from 'react';
import { useEditorStore } from '../../store/editorStore';
import type { EditorState } from '../../store/editorStore';
import type { Wall, Room } from '../../types';

// ============================================
// TIPOS AUXILIARES
// ============================================

export interface WallData {
  id: string;
  start: [number, number];
  end: [number, number];
  thickness?: number;
  height?: number;
  color?: string;
}

export interface RoomData {
  id: string;
  name: string;
  points: [number, number][];
  area?: number;
  perimeter?: number;
}

export type Tool = 'select' | 'wall' | 'room' | 'move';

// ============================================
// HOOK PRINCIPAL
// ============================================

export function useEditor() {
  const store = useEditorStore();

  // --------------------------------------------
  // ESTADO DERIVADO
  // --------------------------------------------

  const currentScene = store.scenes.find(s => s.id === store.currentSceneId);

  const walls: WallData[] = currentScene?.walls.map(w => ({
    id: w.id,
    start: w.start,
    end: w.end,
    thickness: w.thickness,
    height: w.height,
    color: w.color,
  })) || [];

  const rooms: RoomData[] = currentScene?.rooms.map(r => ({
    id: r.id,
    name: r.name,
    points: r.points,
    area: r.area,
    perimeter: r.perimeter,
  })) || [];

  const selectedId = store.selectedIds[0] || null;
  const tool = store.tool as Tool;
  const scale = store.camera.zoom;
  const offset = { x: store.camera.position[0], y: store.camera.position[1] };
  const isDragging = false;
  const isDrawing = false;
  const snapEnabled = store.snap.enabled;
  const gridSize = store.grid.size;
  const showGrid = store.grid.visible;

  // --------------------------------------------
  // AÇÕES DE FERRAMENTA
  // --------------------------------------------

  const setTool = useCallback((newTool: Tool) => {
    store.setTool(newTool as any);
  }, [store]);

  // --------------------------------------------
  // AÇÕES DE CÂMERA
  // --------------------------------------------

  const setScale = useCallback((newScale: number) => {
    store.setCamera({ zoom: Math.max(0.1, Math.min(5, newScale)) });
  }, [store]);

  const setOffset = useCallback((newOffset: { x: number; y: number }) => {
    store.setCamera({ position: [newOffset.x, newOffset.y, store.camera.position[2]] });
  }, [store]);

  const zoomIn = useCallback(() => {
    store.zoomIn();
  }, [store]);

  const zoomOut = useCallback(() => {
    store.zoomOut();
  }, [store]);

  const resetView = useCallback(() => {
    store.fitToView();
  }, [store]);

  const pan = useCallback((deltaX: number, deltaY: number) => {
    store.setCamera({
      position: [
        store.camera.position[0] + deltaX,
        store.camera.position[1] + deltaY,
        store.camera.position[2]
      ]
    });
  }, [store]);

  // --------------------------------------------
  // AÇÕES DE PAREDE
  // --------------------------------------------

  const addWall = useCallback((wall: Omit<WallData, 'id'>): string => {
    store.addWall(wall.start, wall.end);
    const scene = store.scenes.find(s => s.id === store.currentSceneId);
    const lastWall = scene?.walls[scene.walls.length - 1];
    return lastWall?.id || '';
  }, [store]);

  const updateWall = useCallback((id: string, updates: Partial<WallData>) => {
    const updatePayload: Partial<Wall> = {};
    if (updates.start) updatePayload.start = updates.start;
    if (updates.end) updatePayload.end = updates.end;
    if (updates.thickness) updatePayload.thickness = updates.thickness;
    if (updates.height) updatePayload.height = updates.height;
    if (updates.color) updatePayload.color = updates.color;

    store.updateWall(id, updatePayload);
  }, [store]);

  const deleteWall = useCallback((id: string) => {
    store.deleteWall(id);
  }, [store]);

  // --------------------------------------------
  // AÇÕES DE CÔMODO
  // --------------------------------------------

  const addRoom = useCallback((room: Omit<RoomData, 'id'>): string => {
    store.addRoom(room.points);
    const scene = store.scenes.find(s => s.id === store.currentSceneId);
    const lastRoom = scene?.rooms[scene.rooms.length - 1];
    return lastRoom?.id || '';
  }, [store]);

  const updateRoom = useCallback((id: string, updates: Partial<RoomData>) => {
    const updatePayload: Partial<Room> = {};
    if (updates.name) updatePayload.name = updates.name;
    if (updates.points) updatePayload.points = updates.points;

    store.updateRoom(id, updatePayload);
  }, [store]);

  const deleteRoom = useCallback((id: string) => {
    store.deleteRoom(id);
  }, [store]);

  // --------------------------------------------
  // AÇÕES DE SELEÇÃO
  // --------------------------------------------

  const selectObject = useCallback((id: string | null) => {
    if (id) {
      store.select(id);
    } else {
      store.deselectAll();
    }
  }, [store]);

  const clearSelection = useCallback(() => {
    store.deselectAll();
  }, [store]);

  // --------------------------------------------
  // AÇÕES DE DESENHO/DRAG
  // --------------------------------------------

  const startDrawing = useCallback(() => {}, []);
  const stopDrawing = useCallback(() => {}, []);
  const startDrag = useCallback(() => {}, []);
  const stopDrag = useCallback(() => {}, []);

  // --------------------------------------------
  // AÇÕES DE SNAP/GRID
  // --------------------------------------------

  const toggleSnap = useCallback(() => {
    store.setSnap({ enabled: !store.snap.enabled });
  }, [store]);

  const setGridSize = useCallback((size: number) => {
    store.setGrid({ size: Math.max(1, Math.min(100, size)) });
  }, [store]);

  const toggleGrid = useCallback(() => {
    store.toggleGrid();
  }, [store]);

  // --------------------------------------------
  // AÇÕES DE HISTÓRICO
  // --------------------------------------------

  const undo = useCallback(() => {
    store.undo();
  }, [store]);

  const redo = useCallback(() => {
    store.redo();
  }, [store]);

  const canUndo = store.canUndo();
  const canRedo = store.canRedo();

  // --------------------------------------------
  // AÇÕES DE PROJETO
  // --------------------------------------------

  const clearProject = useCallback(() => {
    store.deselectAll();
  }, [store]);

  const loadProject = useCallback((data: { walls: WallData[]; rooms: RoomData[] }) => {
    console.log('Load project:', data);
  }, []);

  // --------------------------------------------
  // HELPERS
  // --------------------------------------------

  const getWallById = useCallback((id: string): WallData | undefined => {
    return walls.find(w => w.id === id);
  }, [walls]);

  const getRoomById = useCallback((id: string): RoomData | undefined => {
    return rooms.find(r => r.id === id);
  }, [rooms]);

  const getSelectedObject = useCallback((): { 
    type: 'wall' | 'room' | null; 
    data: WallData | RoomData | null 
  } => {
    if (!selectedId) return { type: null, data: null };

    const wall = walls.find(w => w.id === selectedId);
    if (wall) return { type: 'wall', data: wall };

    const room = rooms.find(r => r.id === selectedId);
    if (room) return { type: 'room', data: room };

    return { type: null, data: null };
  }, [walls, rooms, selectedId]);

  // --------------------------------------------
  // RETORNO
  // --------------------------------------------

  return {
    walls,
    rooms,
    selectedId,
    tool,
    scale,
    offset,
    isDragging,
    isDrawing,
    snapEnabled,
    gridSize,
    showGrid,
    setTool,
    setScale,
    setOffset,
    zoomIn,
    zoomOut,
    resetView,
    pan,
    addWall,
    updateWall,
    deleteWall,
    addRoom,
    updateRoom,
    deleteRoom,
    selectObject,
    clearSelection,
    startDrawing,
    stopDrawing,
    startDrag,
    stopDrag,
    toggleSnap,
    setGridSize,
    toggleGrid,
    undo,
    redo,
    canUndo,
    canRedo,
    clearProject,
    loadProject,
    getWallById,
    getRoomById,
    getSelectedObject
  };
}

// ============================================
// HOOKS ESPECIALIZADOS
// ============================================

export function useEditorSelection() {
  const { selectedId, selectObject, clearSelection, getSelectedObject } = useEditor();

  return {
    selectedId,
    selectedObject: getSelectedObject(),
    select: selectObject,
    clear: clearSelection,
    hasSelection: selectedId !== null
  };
}

export function useEditorCamera() {
  const { scale, offset, zoomIn, zoomOut, resetView, pan, setScale, setOffset } = useEditor();

  return {
    scale,
    offset,
    zoomIn,
    zoomOut,
    resetView,
    pan,
    setScale,
    setOffset,
    zoomPercent: Math.round(scale * 100)
  };
}

export function useEditorTools() {
  const { tool, setTool, snapEnabled, toggleSnap, gridSize, setGridSize, showGrid, toggleGrid } = useEditor();

  return {
    tool,
    setTool,
    snapEnabled,
    toggleSnap,
    gridSize,
    setGridSize,
    showGrid,
    toggleGrid,
    isSelectTool: tool === 'select',
    isWallTool: tool === 'wall',
    isRoomTool: tool === 'room',
    isMoveTool: tool === 'move'
  };
}

export function useEditorHistory() {
  const { undo, redo, canUndo, canRedo } = useEditor();

  return {
    undo,
    redo,
    canUndo,
    canRedo
  };
}

export default useEditor;
