// ============================================
// COMPONENTE: Editor
// Tela principal do editor AuriPlan
// ============================================

import React, { useEffect, useCallback } from 'react';
import { useEditor, useEditorTools } from '../../hooks';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { Canvas2D } from './components/Canvas2D';
import { StatusBar } from './components/StatusBar';
import { WallData, RoomData } from '../../types/editor';

// ============================================
// TIPOS
// ============================================

interface EditorProps {
  projectId?: string;
  initialData?: {
    walls: WallData[];
    rooms: RoomData[];
  };
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const Editor: React.FC<EditorProps> = ({ projectId, initialData }) => {
  // --------------------------------------------
  // Hooks do Editor
  // --------------------------------------------
  const {
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
    selectObject,
    clearSelection,
    startDrawing,
    stopDrawing,
    startDrag,
    stopDrag,
    addWall,
    updateWall,
    deleteWall,
    addRoom,
    updateRoom,
    deleteRoom,
    zoomIn,
    zoomOut,
    resetView,
    pan,
    toggleSnap,
    setGridSize,
    toggleGrid,
    undo,
    redo,
    canUndo,
    canRedo,
    clearProject,
    loadProject,
    getSelectedObject
  } = useEditor();

  const { isSelectTool, isWallTool, isRoomTool, isMoveTool } = useEditorTools();

  // --------------------------------------------
  // Inicialização
  // --------------------------------------------

  useEffect(() => {
    if (initialData) {
      loadProject(initialData);
    }
  }, [initialData, loadProject]);

  // --------------------------------------------
  // Handlers de Teclado
  // --------------------------------------------

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Undo/Redo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        redo();
      } else {
        undo();
      }
      return;
    }

    // Ferramentas
    switch (e.key.toLowerCase()) {
      case 'v':
        setTool('select');
        break;
      case 'w':
        setTool('wall');
        break;
      case 'r':
        setTool('room');
        break;
      case 'h':
        setTool('move');
        break;
      case 'delete':
      case 'backspace':
        if (selectedId) {
          const obj = getSelectedObject();
          if (obj.type === 'wall') {
            deleteWall(selectedId);
          } else if (obj.type === 'room') {
            deleteRoom(selectedId);
          }
          clearSelection();
        }
        break;
      case 'escape':
        clearSelection();
        stopDrawing();
        break;
    }
  }, [undo, redo, setTool, selectedId, getSelectedObject, deleteWall, deleteRoom, clearSelection, stopDrawing]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // --------------------------------------------
  // Handlers do Canvas
  // --------------------------------------------

  const handleCanvasClick = useCallback((e: React.MouseEvent, worldPoint: { x: number; y: number }) => {
    if (isWallTool) {
      console.log('Desenhar parede em:', worldPoint);
    } else if (isRoomTool) {
      console.log('Desenhar cômodo em:', worldPoint);
    } else if (isSelectTool) {
      clearSelection();
    }
  }, [isWallTool, isRoomTool, isSelectTool, clearSelection]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (isMoveTool || (isSelectTool && e.button === 1)) {
      startDrag();
    }
  }, [isMoveTool, isSelectTool, startDrag]);

  const handleCanvasMouseUp = useCallback(() => {
    stopDrag();
    stopDrawing();
  }, [stopDrag, stopDrawing]);

  const handleObjectSelect = useCallback((id: string) => {
    selectObject(id);
  }, [selectObject]);

  const handleWallUpdate = useCallback((id: string, updates: Partial<WallData>) => {
    updateWall(id, updates);
  }, [updateWall]);

  const handleRoomUpdate = useCallback((id: string, updates: Partial<RoomData>) => {
    updateRoom(id, updates);
  }, [updateRoom]);

  // --------------------------------------------
  // Render
  // --------------------------------------------

  return (
    <div className="editor-container" style={styles.container}>
      {/* Toolbar Superior */}
      <Toolbar
        currentTool={tool}
        onToolChange={setTool}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onClear={clearProject}
      />

      {/* Área Principal */}
      <div style={styles.mainArea}>
        {/* Sidebar Esquerda */}
        <Sidebar
          currentTool={tool}
          onToolChange={setTool}
          snapEnabled={snapEnabled}
          onToggleSnap={toggleSnap}
          gridSize={gridSize}
          onGridSizeChange={setGridSize}
          showGrid={showGrid}
          onToggleGrid={toggleGrid}
        />

        {/* Canvas Central */}
        <div style={styles.canvasWrapper}>
          <Canvas2D
            walls={walls}
            rooms={rooms}
            selectedId={selectedId}
            scale={scale}
            offset={offset}
            tool={tool}
            snapEnabled={snapEnabled}
            gridSize={gridSize}
            showGrid={showGrid}
            isDragging={isDragging}
            isDrawing={isDrawing}
            onClick={handleCanvasClick}
            onMouseDown={handleCanvasMouseDown}
            onMouseUp={handleCanvasMouseUp}
            onObjectSelect={handleObjectSelect}
            onWallUpdate={handleWallUpdate}
            onRoomUpdate={handleRoomUpdate}
            onPan={pan}
          />

          {/* Controles de Zoom (flutuante) - TEMPORARIAMENTE REMOVIDO */}
          <div style={styles.zoomControls}>
            <button onClick={zoomOut} style={styles.zoomButton}>-</button>
            <span style={styles.zoomText}>{Math.round(scale * 100)}%</span>
            <button onClick={zoomIn} style={styles.zoomButton}>+</button>
            <button onClick={resetView} style={styles.zoomButton}>⟲</button>
          </div>
        </div>
      </div>

      {/* Status Bar Inferior */}
      <StatusBar
        wallCount={walls.length}
        roomCount={rooms.length}
        scale={scale}
        selectedTool={tool}
        snapEnabled={snapEnabled}
        gridSize={gridSize}
      />
    </div>
  );
};

// ============================================
// ESTILOS
// ============================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
    color: '#ffffff',
  },
  mainArea: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  canvasWrapper: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#16213e',
  },
  zoomControls: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    backgroundColor: '#1e1e2e',
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #2d2d3d',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
  zoomButton: {
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#252536',
    border: '1px solid #2d2d3d',
    borderRadius: 6,
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: 16,
    fontWeight: 'bold',
  },
  zoomText: {
    fontSize: 12,
    fontWeight: 600,
    minWidth: 50,
    textAlign: 'center',
    color: '#d1d5db',
  },
};

// ============================================
// EXPORTAÇÕES
// ============================================

export default Editor;
