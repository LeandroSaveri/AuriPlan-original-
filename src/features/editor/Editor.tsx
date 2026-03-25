// ============================================
// COMPONENTE: Editor
// Tela principal do editor AuriPlan
// ============================================

import React, { useEffect, useCallback } from 'react';
import { useEditor, useEditorTools, useEditorHistory } from '../../../hooks';
import { Toolbar } from './Toolbar';
import { Sidebar } from './Sidebar';
import { Canvas2D } from './Canvas2D';
import { StatusBar } from './StatusBar';
import { PropertyPanel } from './PropertyPanel';
import { ZoomControls } from './ZoomControls';
import { editorActions } from '../../../store/editorActions';
import { WallData, RoomData } from '../../../types/editor';

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
      // Lógica de desenho de parede
      console.log('Desenhar parede em:', worldPoint);
    } else if (isRoomTool) {
      // Lógica de desenho de cômodo
      console.log('Desenhar cômodo em:', worldPoint);
    } else if (isSelectTool) {
      // Limpar seleção se clicar no vazio
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

          {/* Controles de Zoom (flutuante) */}
          <ZoomControls
            scale={scale}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onReset={resetView}
          />
        </div>

        {/* Painel de Propriedades Direita */}
        <PropertyPanel
          selectedObject={getSelectedObject()}
          onWallUpdate={handleWallUpdate}
          onRoomUpdate={handleRoomUpdate}
          onDeleteWall={deleteWall}
          onDeleteRoom={deleteRoom}
        />
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
};

// ============================================
// EXPORTAÇÕES
// ============================================

export default Editor;
