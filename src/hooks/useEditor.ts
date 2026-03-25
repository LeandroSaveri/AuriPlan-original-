// ============================================
// HOOK: useEditor
// Gerenciamento centralizado do estado do editor
// ============================================

import { useCallback, useEffect, useRef } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { editorActions } from '../../store/editorActions';
import { Point2D, WallData, RoomData } from '../../types/editor';
import { snapToGrid } from '../../utils/numeric';

// ============================================
// TIPOS
// ============================================

interface UseEditorReturn {
  // Estado
  walls: WallData[];
  rooms: RoomData[];
  selectedId: string | null;
  tool: 'select' | 'wall' | 'room' | 'move';
  scale: number;
  offset: { x: number; y: number };
  isDragging: boolean;
  isDrawing: boolean;
  snapEnabled: boolean;
  gridSize: number;
  showGrid: boolean;

  // Ações de ferramenta
  setTool: (tool: 'select' | 'wall' | 'room' | 'move') => void;

  // Ações de câmera
  setScale: (scale: number) => void;
  setOffset: (offset: { x: number; y: number }) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  pan: (deltaX: number, deltaY: number) => void;

  // Ações de parede
  addWall: (wall: Omit<WallData, 'id'>) => string;
  updateWall: (id: string, updates: Partial<WallData>) => void;
  deleteWall: (id: string) => void;

  // Ações de cômodo
  addRoom: (room: Omit<RoomData, 'id'>) => string;
  updateRoom: (id: string, updates: Partial<RoomData>) => void;
  deleteRoom: (id: string) => void;

  // Ações de seleção
  selectObject: (id: string | null) => void;
  clearSelection: () => void;

  // Ações de desenho
  startDrawing: () => void;
  stopDrawing: () => void;

  // Ações de drag
  startDrag: () => void;
  stopDrag: () => void;

  // Snap
  toggleSnap: () => void;
  setGridSize: (size: number) => void;
  toggleGrid: () => void;
  snapPoint: (point: Point2D) => Point2D;

  // Histórico
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // Projeto
  clearProject: () => void;
  loadProject: (data: { walls: WallData[]; rooms: RoomData[] }) => void;

  // Helpers
  getWallById: (id: string) => WallData | undefined;
  getRoomById: (id: string) => RoomData | undefined;
  getSelectedObject: () => { type: 'wall' | 'room' | null; data: WallData | RoomData | null };
}

// ============================================
// HOOK PRINCIPAL
// ============================================

export function useEditor(): UseEditorReturn {
  const store = useEditorStore();
  const actionsRef = useRef(editorActions);

  // ============================================
  // MEMORIZAÇÃO DE ESTADO
  // ============================================

  const walls = store.walls;
  const rooms = store.rooms;
  const selectedId = store.selectedId;
  const tool = store.tool;
  const scale = store.scale;
  const offset = store.offset;
  const isDragging = store.isDragging;
  const isDrawing = store.isDrawing;
  const snapEnabled = store.snapEnabled ?? true;
  const gridSize = store.gridSize ?? 10;
  const showGrid = store.showGrid ?? true;
  const history = store.history;

  // ============================================
  // AÇÕES DE FERRAMENTA
  // ============================================

  const setTool = useCallback((newTool: 'select' | 'wall' | 'room' | 'move') => {
    actionsRef.current.setTool(newTool);
  }, []);

  // ============================================
  // AÇÕES DE CÂMERA
  // ============================================

  const setScale = useCallback((newScale: number) => {
    actionsRef.current.setScale(Math.max(0.1, Math.min(5, newScale)));
  }, []);

  const setOffset = useCallback((newOffset: { x: number; y: number }) => {
    actionsRef.current.setOffset(newOffset);
  }, []);

  const zoomIn = useCallback(() => {
    actionsRef.current.setScale(Math.min(5, scale * 1.2));
  }, [scale]);

  const zoomOut = useCallback(() => {
    actionsRef.current.setScale(Math.max(0.1, scale / 1.2));
  }, [scale]);

  const resetView = useCallback(() => {
    actionsRef.current.setScale(1);
    actionsRef.current.setOffset({ x: 0, y: 0 });
  }, []);

  const pan = useCallback((deltaX: number, deltaY: number) => {
    actionsRef.current.setOffset({
      x: offset.x + deltaX,
      y: offset.y + deltaY
    });
  }, [offset]);

  // ============================================
  // AÇÕES DE PAREDE
  // ============================================

  const addWall = useCallback((wall: Omit<WallData, 'id'>): string => {
    return actionsRef.current.addWall(wall);
  }, []);

  const updateWall = useCallback((id: string, updates: Partial<WallData>) => {
    actionsRef.current.updateWall(id, updates);
  }, []);

  const deleteWall = useCallback((id: string) => {
    actionsRef.current.deleteWall(id);
  }, []);

  // ============================================
  // AÇÕES DE CÔMODO
  // ============================================

  const addRoom = useCallback((room: Omit<RoomData, 'id'>): string => {
    return actionsRef.current.addRoom(room);
  }, []);

  const updateRoom = useCallback((id: string, updates: Partial<RoomData>) => {
    actionsRef.current.updateRoom(id, updates);
  }, []);

  const deleteRoom = useCallback((id: string) => {
    actionsRef.current.deleteRoom(id);
  }, []);

  // ============================================
  // AÇÕES DE SELEÇÃO
  // ============================================

  const selectObject = useCallback((id: string | null) => {
    actionsRef.current.selectObject(id);
  }, []);

  const clearSelection = useCallback(() => {
    actionsRef.current.selectObject(null);
  }, []);

  // ============================================
  // AÇÕES DE DESENHO
  // ============================================

  const startDrawing = useCallback(() => {
    store.setIsDrawing(true);
  }, [store]);

  const stopDrawing = useCallback(() => {
    store.setIsDrawing(false);
  }, [store]);

  // ============================================
  // AÇÕES DE DRAG
  // ============================================

  const startDrag = useCallback(() => {
    store.setIsDragging(true);
  }, [store]);

  const stopDrag = useCallback(() => {
    store.setIsDragging(false);
  }, [store]);

  // ============================================
  // AÇÕES DE SNAP
  // ============================================

  const toggleSnap = useCallback(() => {
    store.setSnapEnabled(!snapEnabled);
  }, [store, snapEnabled]);

  const setGridSize = useCallback((size: number) => {
    store.setGridSize(Math.max(1, Math.min(100, size)));
  }, [store]);

  const toggleGrid = useCallback(() => {
    store.setShowGrid(!showGrid);
  }, [store, showGrid]);

  const snapPoint = useCallback((point: Point2D): Point2D => {
    if (!snapEnabled) return point;
    return {
      x: snapToGrid(point.x, gridSize),
      y: snapToGrid(point.y, gridSize)
    };
  }, [snapEnabled, gridSize]);

  // ============================================
  // AÇÕES DE HISTÓRICO
  // ============================================

  const undo = useCallback(() => {
    actionsRef.current.undo();
  }, []);

  const redo = useCallback(() => {
    actionsRef.current.redo();
  }, []);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  // ============================================
  // AÇÕES DE PROJETO
  // ============================================

  const clearProject = useCallback(() => {
    actionsRef.current.clearProject();
  }, []);

  const loadProject = useCallback((data: { walls: WallData[]; rooms: RoomData[] }) => {
    actionsRef.current.loadProject(data);
  }, []);

  // ============================================
  // HELPERS
  // ============================================

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

  // ============================================
  // RETORNO
  // ============================================

  return {
    // Estado
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

    // Ações
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
    snapPoint,
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
