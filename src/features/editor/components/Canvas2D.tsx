// ============================================
// Canvas2D.tsx - Orquestrador Enxuto Premium
// Responsabilidade: Coordenar engines, não implementar lógica
// Suporte: Mouse + Touch (Mobile)
// ============================================

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useEditorStore, selectCurrentScene } from '@/store/editorStore';
import { CameraEngine } from '@core/camera/CameraEngine';
import { SnapEngine } from '@core/snap/SnapEngine';
import { GridEngine } from '@core/grid/GridEngine';
import { InteractionEngine } from '@core/interaction/InteractionEngine';
import { WallEngine } from '@core/wall/WallEngine';
import { RoomEngine } from '@core/room/RoomEngine';
import type { Vec2 } from '@types';

interface Canvas2DProps {
  className?: string;
}

interface TouchState {
  startDistance: number;
  startZoom: number;
  lastTouch: Vec2 | null;
  isPinching: boolean;
}

export const Canvas2D: React.FC<Canvas2DProps> = ({ className = '' }) => {
  // Refs DOM
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  
  // Engines - cada um com sua responsabilidade única
  const cameraRef = useRef<CameraEngine>(new CameraEngine({
    minZoom: 0.1,
    maxZoom: 10,
    zoomStep: 1.2
  }));
  const snapRef = useRef<SnapEngine>(new SnapEngine());
  const gridRef = useRef<GridEngine>(new GridEngine());
  const interactionRef = useRef<InteractionEngine>(new InteractionEngine());
  const wallRef = useRef<WallEngine>(new WallEngine());
  const roomRef = useRef<RoomEngine>(new RoomEngine());
  
  // Estado local mínimo - apenas UI e interação temporária
  const [isReady, setIsReady] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<Vec2 | null>(null);
  
  // Touch state para mobile
  const touchStateRef = useRef<TouchState>({
    startDistance: 0,
    startZoom: 1,
    lastTouch: null,
    isPinching: false
  });
  
  // Store
  const { 
    tool, 
    selectedIds, 
    select, 
    grid: gridConfig,
    snap: snapConfig,
    addWall,
    viewMode 
  } = useEditorStore();
  
  const currentScene = useEditorStore(selectCurrentScene);
  
  // ============================================
  // INICIALIZAÇÃO
  // ============================================
  
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    
    const canvas = canvasRef.current;
    const container = containerRef.current;
    
    // Setup canvas size com DPR para retina
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);
    
    // Configurar engines com dados do store
    cameraRef.current.setState({
      position: [0, 10, 10],
      target: [0, 0, 0],
      zoom: 1
    });
    
    gridRef.current.setConfig({
      visible: gridConfig.visible,
      size: gridConfig.size,
      subdivisions: gridConfig.subdivisions,
      majorColor: gridConfig.color,
      opacity: gridConfig.opacity
    });
    
    snapRef.current.setConfig({
      enabled: snapConfig.enabled,
      gridSize: snapConfig.gridSize,
      snapDistance: snapConfig.snapDistance,
      angleSnap: snapConfig.angleSnap
    });
    
    // Atualizar dados do snap engine
    if (currentScene) {
      snapRef.current.setWalls(currentScene.walls);
      snapRef.current.setRooms(currentScene.rooms);
      snapRef.current.setFurniture(currentScene.furniture);
    }
    
    // Attach interaction engine ao canvas
    interactionRef.current.attach(canvas);
    setupInteractionHandlers();
    
    setIsReady(true);
    
    return () => {
      interactionRef.current.detach();
      cancelAnimationFrame(animationRef.current);
    };
  }, []);
  
  // Atualizar configurações quando mudam no store
  useEffect(() => {
    gridRef.current.setConfig({
      visible: gridConfig.visible,
      size: gridConfig.size,
      subdivisions: gridConfig.subdivisions,
      majorColor: gridConfig.color,
      opacity: gridConfig.opacity
    });
  }, [gridConfig]);
  
  useEffect(() => {
    snapRef.current.setConfig({
      enabled: snapConfig.enabled,
      gridSize: snapConfig.gridSize,
      snapDistance: snapConfig.snapDistance,
      angleSnap: snapConfig.angleSnap
    });
  }, [snapConfig]);
  
  useEffect(() => {
    if (currentScene) {
      snapRef.current.setWalls(currentScene.walls);
      snapRef.current.setRooms(currentScene.rooms);
      snapRef.current.setFurniture(currentScene.furniture);
    }
  }, [currentScene]);
  
  // ============================================
  // HANDLERS DE INTERAÇÃO (Mouse + Touch)
  // ============================================
  
  const setupInteractionHandlers = useCallback(() => {
    const interaction = interactionRef.current;
    
    // PAN - Mouse move com middle button ou shift+left
    interaction.on('mousemove', (event) => {
      const state = interaction.getState();
      
      if (state.isDragging && (state.activeButton === 'middle' || state.modifiers.has('shift'))) {
        const delta: Vec2 = [-(event.delta?.[0] || 0), event.delta?.[1] || 0];
        cameraRef.current.pan(delta);
        return false;
      }
      
      // Hover detection apenas se não estiver desenhando
      if (!isDrawing) {
        updateHover(event.position);
      }
      
      // Atualizar posição do mouse para desenho
      if (isDrawing && drawStart) {
        const worldPos = screenToWorld(event.position[0], event.position[1]);
        const snapResult = snapRef.current.snap(worldPos);
        // Trigger re-render para mostrar linha preview
      }
      
      return true;
    });
    
    // WHEEL - Zoom com centro no mouse
    interaction.on('wheel', (event) => {
      const zoomFactor = event.delta && event.delta[1] > 0 ? 0.9 : 1.1;
      const currentZoom = cameraRef.current.getState().zoom;
      cameraRef.current.setZoom(currentZoom * zoomFactor);
      return false;
    });
    
    // CLICK - Seleção ou início de ferramenta
    interaction.on('click', (event) => {
      if (tool === 'select') {
        handleSelection(event.position, interaction.getState().modifiers.has('ctrl'));
      }
      return true;
    });
    
    // MOUSE DOWN - Início de desenho ou pan
    interaction.on('mousedown', (event) => {
      if (tool === 'wall' && event.button === 'left' && !interaction.getState().modifiers.has('shift')) {
        const worldPos = screenToWorld(event.position[0], event.position[1]);
        const snapResult = snapRef.current.snap(worldPos);
        setDrawStart(snapResult.point);
        setIsDrawing(true);
        snapRef.current.setLastPoint(snapResult.point);
      }
      return true;
    });
    
    // MOUSE UP - Finalização de desenho
    interaction.on('mouseup', (event) => {
      if (isDrawing && tool === 'wall' && drawStart) {
        const worldPos = screenToWorld(event.position[0], event.position[1]);
        const snapResult = snapRef.current.snap(worldPos);
        
        // Verificar distância mínima
        const dist = Math.sqrt(
          Math.pow(snapResult.point[0] - drawStart[0], 2) +
          Math.pow(snapResult.point[1] - drawStart[1], 2)
        );
        
        if (dist > 0.1) {
          // Criar parede via engine
          const wall = wallRef.current.createWall(drawStart, snapResult.point, {
            thickness: 0.2,
            height: 2.8,
            color: '#475569'
          });
          
          if (wall) {
            addWall(wall);
          }
        }
        
        setIsDrawing(false);
        setDrawStart(null);
      }
      return true;
    });
    
    // KEYBOARD - Atalhos
    interaction.on('keydown', (event) => {
      switch (event.key) {
        case 'Delete':
        case 'Backspace':
          // Deletar seleção
          break;
        case 'Escape':
          setIsDrawing(false);
          setDrawStart(null);
          break;
      }
      return true;
    });
  }, [tool, isDrawing, drawStart]);
  
  // ============================================
  // FUNÇÕES AUXILIARES
  // ============================================
  
  const screenToWorld = useCallback((screenX: number, screenY: number): Vec2 => {
    const canvas = canvasRef.current;
    if (!canvas) return [0, 0];
    
    const rect = canvas.getBoundingClientRect();
    const camera = cameraRef.current;
    const state = camera.getState();
    
    // Ajustar para coordenadas relativas ao canvas
    const x = screenX - rect.left;
    const y = screenY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Converter para mundo (inverter Y para coordenadas CAD)
    const worldX = (x - centerX) / (state.zoom * 20) - state.position[0];
    const worldY = -(y - centerY) / (state.zoom * 20) - state.position[2];
    
    return [worldX, worldY];
  }, []);
  
  const worldToScreen = useCallback((worldX: number, worldY: number): Vec2 => {
    const canvas = canvasRef.current;
    if (!canvas) return [0, 0];
    
    const rect = canvas.getBoundingClientRect();
    const camera = cameraRef.current;
    const state = camera.getState();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const screenX = (worldX + state.position[0]) * state.zoom * 20 + centerX;
    const screenY = -(worldY + state.position[2]) * state.zoom * 20 + centerY;
    
    return [screenX, screenY];
  }, []);
  
  const updateHover = useCallback((screenPos: Vec2) => {
    const worldPos = screenToWorld(screenPos[0], screenPos[1]);
    
    // Hit test usando wall engine
    const walls = currentScene?.walls || [];
    let foundId: string | null = null;
    const threshold = 0.3; // 30cm
    
    for (const wall of walls) {
      const dist = pointToLineDistance(
        worldPos[0], worldPos[1],
        wall.start[0], wall.start[1],
        wall.end[0], wall.end[1]
      );
      if (dist < threshold) {
        foundId = wall.id;
        break;
      }
    }
    
    setHoveredId(foundId);
  }, [currentScene, screenToWorld]);
  
  const handleSelection = useCallback((screenPos: Vec2, multiSelect: boolean) => {
    const worldPos = screenToWorld(screenPos[0], screenPos[1]);
    
    const walls = currentScene?.walls || [];
    let foundId: string | null = null;
    const threshold = 0.3;
    
    for (const wall of walls) {
      const dist = pointToLineDistance(
        worldPos[0], worldPos[1],
        wall.start[0], wall.start[1],
        wall.end[0], wall.end[1]
      );
      if (dist < threshold) {
        foundId = wall.id;
        break;
      }
    }
    
    if (foundId) {
      select(foundId, multiSelect);
    } else if (!multiSelect) {
      select([]);
    }
  }, [currentScene, select, screenToWorld]);
  
  // ============================================
  // TOUCH EVENTS (Mobile Premium)
  // ============================================
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 1) {
      // Single touch - tratado como mouse
      const touch = e.touches[0];
      touchStateRef.current.lastTouch = [touch.clientX, touch.clientY];
      
      // Simular mousedown
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        button: 0
      });
      canvasRef.current?.dispatchEvent(mouseEvent);
      
    } else if (e.touches.length === 2) {
      // Pinch zoom start
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      touchStateRef.current.isPinching = true;
      touchStateRef.current.startDistance = distance;
      touchStateRef.current.startZoom = cameraRef.current.getState().zoom;
    }
  }, []);
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 1 && !touchStateRef.current.isPinching) {
      // Pan ou draw
      const touch = e.touches[0];
      
      if (touchStateRef.current.lastTouch) {
        const deltaX = touch.clientX - touchStateRef.current.lastTouch[0];
        const deltaY = touch.clientY - touchStateRef.current.lastTouch[1];
        
        // Se estiver desenhando, simular mousemove
        if (isDrawing) {
          const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
          });
          canvasRef.current?.dispatchEvent(mouseEvent);
        } else {
          // Pan com dois dedos ou modo pan ativo
          cameraRef.current.pan([-deltaX, deltaY]);
        }
      }
      
      touchStateRef.current.lastTouch = [touch.clientX, touch.clientY];
      
    } else if (e.touches.length === 2 && touchStateRef.current.isPinching) {
      // Pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const scale = distance / touchStateRef.current.startDistance;
      const newZoom = touchStateRef.current.startZoom * scale;
      cameraRef.current.setZoom(newZoom);
    }
  }, [isDrawing]);
  
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    if (touchStateRef.current.isPinching && e.touches.length < 2) {
      touchStateRef.current.isPinching = false;
    }
    
    if (e.touches.length === 0) {
      // Simular mouseup
      const mouseEvent = new MouseEvent('mouseup', { button: 0 });
      canvasRef.current?.dispatchEvent(mouseEvent);
      touchStateRef.current.lastTouch = null;
    }
  }, []);
  
  // ============================================
  // RENDER LOOP
  // ============================================
  
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !isReady) return;
    
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Clear
    ctx.clearRect(0, 0, rect.width * dpr, rect.height * dpr);
    
    const cameraState = cameraRef.current.getState();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Calcular bounds visíveis para o grid
    const visibleWidth = rect.width / (cameraState.zoom * 20);
    const visibleHeight = rect.height / (cameraState.zoom * 20);
    const viewBounds = {
      min: [-visibleWidth / 2 - cameraState.position[0], -visibleHeight / 2 - cameraState.position[2]] as Vec2,
      max: [visibleWidth / 2 - cameraState.position[0], visibleHeight / 2 - cameraState.position[2]] as Vec2
    };
    
    ctx.save();
    
    // Render grid (delegado para GridEngine)
    ctx.translate(centerX, centerY);
    ctx.scale(cameraState.zoom * 20, -cameraState.zoom * 20); // Y invertido para CAD
    ctx.translate(cameraState.position[0], cameraState.position[2]);
    
    gridRef.current.render(ctx, viewBounds, cameraState.zoom, [0, 0]);
    
    ctx.restore();
    
    // Render cena
    if (currentScene) {
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(cameraState.zoom * 20, -cameraState.zoom * 20);
      ctx.translate(cameraState.position[0], cameraState.position[2]);
      
      // Render rooms (delegado para RoomEngine)
      roomRef.current.render(ctx, currentScene.rooms, selectedIds);
      
      // Render walls (delegado para WallEngine)
      wallRef.current.render(ctx, currentScene.walls, selectedIds, hoveredId);
      
      // Render doors
      currentScene.doors?.forEach(door => {
        const wall = currentScene.walls.find(w => w.id === door.wallId);
        if (wall) renderDoor(ctx, door, wall);
      });
      
      // Render windows
      currentScene.windows?.forEach(window => {
        const wall = currentScene.walls.find(w => w.id === window.wallId);
        if (wall) renderWindow(ctx, window, wall);
      });
      
      // Render furniture
      currentScene.furniture?.forEach(item => {
        renderFurniture(ctx, item, selectedIds.includes(item.id));
      });
      
      ctx.restore();
    }
    
    // Render preview de desenho (wall sendo desenhada)
    if (isDrawing && drawStart && tool === 'wall') {
      const mousePos = interactionRef.current.getMousePosition();
      const currentWorld = screenToWorld(mousePos[0], mousePos[1]);
      const snapResult = snapRef.current.snap(currentWorld);
      
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(cameraState.zoom * 20, -cameraState.zoom * 20);
      ctx.translate(cameraState.position[0], cameraState.position[2]);
      
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 0.02;
      ctx.setLineDash([0.1, 0.1]);
      ctx.beginPath();
      ctx.moveTo(drawStart[0], drawStart[1]);
      ctx.lineTo(snapResult.point[0], snapResult.point[1]);
      ctx.stroke();
      
      // Mostrar distância
      const dist = Math.sqrt(
        Math.pow(snapResult.point[0] - drawStart[0], 2) +
        Math.pow(snapResult.point[1] - drawStart[1], 2)
      );
      
      ctx.fillStyle = '#3b82f6';
      ctx.font = '0.15px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${dist.toFixed(2)}m`,
        (drawStart[0] + snapResult.point[0]) / 2,
        (drawStart[1] + snapResult.point[1]) / 2 + 0.2
      );
      
      ctx.restore();
    }
    
    // Render snap indicator
    if (tool !== 'select') {
      const mousePos = interactionRef.current.getMousePosition();
      const worldPos = screenToWorld(mousePos[0], mousePos[1]);
      const snapResult = snapRef.current.snap(worldPos);
      
      if (snapResult.type !== 'none') {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(cameraState.zoom * 20, -cameraState.zoom * 20);
        ctx.translate(cameraState.position[0], cameraState.position[2]);
        
        renderSnapIndicator(ctx, snapResult);
        
        ctx.restore();
      }
    }
    
    animationRef.current = requestAnimationFrame(render);
  }, [isReady, currentScene, selectedIds, hoveredId, tool, isDrawing, drawStart, screenToWorld]);
  
  useEffect(() => {
    if (isReady) {
      animationRef.current = requestAnimationFrame(render);
    }
    return () => cancelAnimationFrame(animationRef.current);
  }, [isReady, render]);
  
  // ============================================
  // FUNÇÕES DE RENDER AUXILIARES
  // ============================================
  
  const renderDoor = (ctx: CanvasRenderingContext2D, door: any, wall: any) => {
    const wallDir = [wall.end[0] - wall.start[0], wall.end[1] - wall.start[1]];
    const wallLen = Math.sqrt(wallDir[0] * wallDir[0] + wallDir[1] * wallDir[1]);
    const wallUnit = [wallDir[0] / wallLen, wallDir[1] / wallLen];
    
    const doorStart = [
      wall.start[0] + wallUnit[0] * door.position,
      wall.start[1] + wallUnit[1] * door.position
    ];
    const doorEnd = [
      doorStart[0] + wallUnit[0] * door.width,
      doorStart[1] + wallUnit[1] * door.width
    ];
    
    ctx.strokeStyle = '#8B4513';
    ctx.fillStyle = '#D2691E';
    ctx.lineWidth = 0.05;
    
    ctx.beginPath();
    ctx.moveTo(doorStart[0], doorStart[1]);
    ctx.lineTo(doorEnd[0], doorEnd[1]);
    ctx.stroke();
    
    // Arco de abertura
    ctx.beginPath();
    ctx.arc(doorStart[0], doorStart[1], door.width, 
      Math.atan2(wallUnit[1], wallUnit[0]), 
      Math.atan2(wallUnit[1], wallUnit[0]) + Math.PI / 2
    );
    ctx.stroke();
  };
  
  const renderWindow = (ctx: CanvasRenderingContext2D, window: any, wall: any) => {
    const wallDir = [wall.end[0] - wall.start[0], wall.end[1] - wall.start[1]];
    const wallLen = Math.sqrt(wallDir[0] * wallDir[0] + wallDir[1] * wallDir[1]);
    const wallUnit = [wallDir[0] / wallLen, wallDir[1] / wallLen];
    
    const winStart = [
      wall.start[0] + wallUnit[0] * window.position,
      wall.start[1] + wallUnit[1] * window.position
    ];
    const winEnd = [
      winStart[0] + wallUnit[0] * window.width,
      winStart[1] + wallUnit[1] * window.width
    ];
    
    ctx.strokeStyle = '#87CEEB';
    ctx.fillStyle = 'rgba(135, 206, 235, 0.3)';
    ctx.lineWidth = 0.08;
    
    ctx.beginPath();
    ctx.moveTo(winStart[0], winStart[1]);
    ctx.lineTo(winEnd[0], winEnd[1]);
    ctx.stroke();
    
    // Linhas de vidro
    ctx.lineWidth = 0.02;
    ctx.setLineDash([0.05, 0.05]);
    ctx.stroke();
    ctx.setLineDash([]);
  };
  
  const renderFurniture = (ctx: CanvasRenderingContext2D, item: any, isSelected: boolean) => {
    const x = item.position[0];
    const y = item.position[2];
    const width = item.dimensions.width;
    const depth = item.dimensions.depth;
    const rotation = item.rotation[1];
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-rotation);
    
    ctx.fillStyle = item.color;
    ctx.strokeStyle = isSelected ? '#3b82f6' : '#475569';
    ctx.lineWidth = isSelected ? 0.03 : 0.02;
    
    ctx.fillRect(-width / 2, -depth / 2, width, depth);
    ctx.strokeRect(-width / 2, -depth / 2, width, depth);
    
    // Indicador de frente
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -depth / 2 + 0.05);
    ctx.lineTo(-0.05, -depth / 2 + 0.15);
    ctx.lineTo(0.05, -depth / 2 + 0.15);
    ctx.closePath();
    ctx.fill();
    
    if (isSelected) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 0.02;
      ctx.setLineDash([0.05, 0.05]);
      ctx.strokeRect(-width / 2 - 0.05, -depth / 2 - 0.05, width + 0.1, depth + 0.1);
      ctx.setLineDash([]);
    }
    
    ctx.restore();
  };
  
  const renderSnapIndicator = (ctx: CanvasRenderingContext2D, snapResult: any) => {
    ctx.strokeStyle = '#22c55e';
    ctx.fillStyle = '#22c55e';
    ctx.lineWidth = 0.02;
    
    const pos = snapResult.point;
    
    switch (snapResult.type) {
      case 'endpoint':
        ctx.strokeRect(pos[0] - 0.15, pos[1] - 0.15, 0.3, 0.3);
        break;
      case 'midpoint':
        ctx.beginPath();
        ctx.moveTo(pos[0], pos[1] - 0.2);
        ctx.lineTo(pos[0] + 0.17, pos[1] + 0.1);
        ctx.lineTo(pos[0] - 0.17, pos[1] + 0.1);
        ctx.closePath();
        ctx.stroke();
        break;
      case 'center':
        ctx.beginPath();
        ctx.arc(pos[0], pos[1], 0.2, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case 'grid':
        ctx.beginPath();
        ctx.arc(pos[0], pos[1], 0.1, 0, Math.PI * 2);
        ctx.fill();
        break;
      default:
        ctx.beginPath();
        ctx.arc(pos[0], pos[1], 0.08, 0, Math.PI * 2);
        ctx.fill();
    }
  };
  
  // ============================================
  // UTILS
  // ============================================
  
  const pointToLineDistance = (px: number, py: number, x1: number, y1: number, x2: number, y2: number): number => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) param = dot / lenSq;
    
    let xx, yy;
    if (param < 0) { xx = x1; yy = y1; }
    else if (param > 1) { xx = x2; yy = y2; }
    else { xx = x1 + param * C; yy = y1 + param * D; }
    
    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };
  
  // ============================================
  // RESIZE HANDLER
  // ============================================
  
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current) return;
      
      const canvas = canvasRef.current;
      const container = containerRef.current;
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const cameraState = cameraRef.current?.getState();
  
  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden bg-slate-950 ${className}`}
      style={{ touchAction: 'none' }}
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-crosshair touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{ touchAction: 'none' }}
      />
      
      {/* Info Overlay - Premium */}
      <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md text-slate-300 text-xs px-4 py-3 rounded-xl border border-slate-700/50 pointer-events-none select-none shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-slate-500 text-[10px] uppercase tracking-wider">Escala</span>
            <span className="font-mono text-slate-200">1:{(100 / (cameraState?.zoom || 1)).toFixed(0)}</span>
          </div>
          <div className="w-px h-8 bg-slate-700" />
          <div className="flex flex-col">
            <span className="text-slate-500 text-[10px] uppercase tracking-wider">Zoom</span>
            <span className="font-mono text-slate-200">{((cameraState?.zoom || 1) * 100).toFixed(0)}%</span>
          </div>
          <div className="w-px h-8 bg-slate-700" />
          <div className="flex flex-col">
            <span className="text-slate-500 text-[10px] uppercase tracking-wider">Ferramenta</span>
            <span className="font-medium text-blue-400 capitalize">{tool}</span>
          </div>
        </div>
      </div>
      
      {/* Snap Indicator Badge */}
      {tool !== 'select' && (
        <div className="absolute top-4 left-4 bg-green-500/10 backdrop-blur-sm text-green-400 text-xs px-3 py-1.5 rounded-full border border-green-500/20 pointer-events-none">
          Snap Ativo
        </div>
      )}
    </div>
  );
};

export default Canvas2D;
