// ============================================
// CANVAS 2D - Editor de Planta Baixa
// ============================================

import { useRef, useEffect, useState, useCallback } from 'react';
import { useEditorStore, selectCurrentScene } from '@store/editorStore';
import { SnapSystem } from '@core/snap/SnapSystem';
import type { Vec2 } from '@types';

interface Point {
  x: number;
  y: number;
}

export function Canvas2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [scale, setScale] = useState(20);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<Point | null>(null);
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const {
    tool,
    selectedIds,
    select,
    grid,
    snap: snapConfig,
    addWall,
    addDoor,
    addWindow,
  } = useEditorStore();

  const currentScene = useEditorStore(selectCurrentScene);
  const snapSystem = useRef(new SnapSystem(snapConfig));

  useEffect(() => {
    snapSystem.current.setConfig(snapConfig);
    if (currentScene) {
      snapSystem.current.setWalls(currentScene.walls);
      snapSystem.current.setRooms(currentScene.rooms);
      snapSystem.current.setFurniture(currentScene.furniture);
    }
  }, [snapConfig, currentScene]);

  const screenToWorld = useCallback((screenX: number, screenY: number): Vec2 => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return [0, 0];
    
    return [
      (screenX - rect.left - offset.x - rect.width / 2) / scale,
      -(screenY - rect.top - offset.y - rect.height / 2) / scale,
    ];
  }, [scale, offset]);

  const worldToScreen = useCallback((worldX: number, worldY: number): Point => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    
    return {
      x: worldX * scale + offset.x + rect.width / 2,
      y: -worldY * scale + offset.y + rect.height / 2,
    };
  }, [scale, offset]);

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!grid.visible) return;

    const gridSpacing = scale * grid.size;
    const startX = offset.x % gridSpacing;
    const startY = offset.y % gridSpacing;

    ctx.strokeStyle = grid.color;
    ctx.globalAlpha = grid.opacity;
    ctx.lineWidth = 1;

    ctx.beginPath();
    for (let x = startX; x < width; x += gridSpacing) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = startY; y < height; y += gridSpacing) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    const centerX = width / 2 + offset.x;
    const centerY = height / 2 + offset.y;

    ctx.strokeStyle = '#3b82f6';
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    ctx.globalAlpha = 1;
  };

  const drawWalls = (ctx: CanvasRenderingContext2D) => {
    if (!currentScene) return;

    currentScene.walls.forEach((wall) => {
      const start = worldToScreen(wall.start[0], wall.start[1]);
      const end = worldToScreen(wall.end[0], wall.end[1]);

      const isSelected = selectedIds.includes(wall.id);
      const isHovered = hoveredId === wall.id;

      const thickness = Math.max(2, wall.thickness * scale);

      ctx.strokeStyle = isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : wall.color;
      ctx.lineWidth = thickness;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      if (isSelected || isHovered) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.fillStyle = isSelected ? '#3b82f6' : '#64748b';
      ctx.beginPath();
      ctx.arc(start.x, start.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(end.x, end.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawDoors = (ctx: CanvasRenderingContext2D) => {
    if (!currentScene) return;

    currentScene.doors.forEach((door) => {
      const wall = currentScene.walls.find(w => w.id === door.wallId);
      if (!wall) return;

      const wallStart = worldToScreen(wall.start[0], wall.start[1]);
      const wallEnd = worldToScreen(wall.end[0], wall.end[1]);

      const wallLength = Math.sqrt(
        Math.pow(wall.end[0] - wall.start[0], 2) +
        Math.pow(wall.end[1] - wall.start[1], 2)
      );

      const doorStart = {
        x: wallStart.x + (wallEnd.x - wallStart.x) * (door.position / wallLength),
        y: wallStart.y + (wallEnd.y - wallStart.y) * (door.position / wallLength),
      };

      const doorEnd = {
        x: wallStart.x + (wallEnd.x - wallStart.x) * ((door.position + door.width) / wallLength),
        y: wallStart.y + (wallEnd.y - wallStart.y) * ((door.position + door.width) / wallLength),
      };

      ctx.strokeStyle = '#8B4513';
      ctx.fillStyle = '#D2691E';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(doorStart.x, doorStart.y);
      ctx.lineTo(doorEnd.x, doorEnd.y);
      ctx.stroke();

      const isSelected = selectedIds.includes(door.id);
      if (isSelected) {
        ctx.strokeStyle = '#3b82f6';
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(
          Math.min(doorStart.x, doorEnd.x) - 5,
          Math.min(doorStart.y, doorEnd.y) - 5,
          Math.abs(doorEnd.x - doorStart.x) + 10,
          Math.abs(doorEnd.y - doorStart.y) + 10
        );
        ctx.setLineDash([]);
      }
    });
  };

  const drawWindows = (ctx: CanvasRenderingContext2D) => {
    if (!currentScene) return;

    currentScene.windows.forEach((window) => {
      const wall = currentScene.walls.find(w => w.id === window.wallId);
      if (!wall) return;

      const wallStart = worldToScreen(wall.start[0], wall.start[1]);
      const wallEnd = worldToScreen(wall.end[0], wall.end[1]);

      const wallLength = Math.sqrt(
        Math.pow(wall.end[0] - wall.start[0], 2) +
        Math.pow(wall.end[1] - wall.start[1], 2)
      );

      const windowStart = {
        x: wallStart.x + (wallEnd.x - wallStart.x) * (window.position / wallLength),
        y: wallStart.y + (wallEnd.y - wallStart.y) * (window.position / wallLength),
      };

      const windowEnd = {
        x: wallStart.x + (wallEnd.x - wallStart.x) * ((window.position + window.width) / wallLength),
        y: wallStart.y + (wallEnd.y - wallStart.y) * ((window.position + window.width) / wallLength),
      };

      ctx.strokeStyle = '#87CEEB';
      ctx.fillStyle = '#E0F6FF';
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.moveTo(windowStart.x, windowStart.y);
      ctx.lineTo(windowEnd.x, windowEnd.y);
      ctx.stroke();

      ctx.fillStyle = 'rgba(135, 206, 235, 0.3)';
      ctx.fillRect(
        Math.min(windowStart.x, windowEnd.x) - 2,
        Math.min(windowStart.y, windowEnd.y) - 2,
        Math.abs(windowEnd.x - windowStart.x) + 4,
        Math.abs(windowEnd.y - windowStart.y) + 4
      );

      const isSelected = selectedIds.includes(window.id);
      if (isSelected) {
        ctx.strokeStyle = '#3b82f6';
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(
          Math.min(windowStart.x, windowEnd.x) - 8,
          Math.min(windowStart.y, windowEnd.y) - 8,
          Math.abs(windowEnd.x - windowStart.x) + 16,
          Math.abs(windowEnd.y - windowStart.y) + 16
        );
        ctx.setLineDash([]);
      }
    });
  };

  const drawRooms = (ctx: CanvasRenderingContext2D) => {
    if (!currentScene) return;

    currentScene.rooms.forEach((room) => {
      if (room.points.length < 3) return;

      ctx.fillStyle = room.floorColor + '40';
      ctx.strokeStyle = room.wallColor;
      ctx.lineWidth = 2;

      ctx.beginPath();
      const firstPoint = worldToScreen(room.points[0][0], room.points[0][1]);
      ctx.moveTo(firstPoint.x, firstPoint.y);

      for (let i = 1; i < room.points.length; i++) {
        const point = worldToScreen(room.points[i][0], room.points[i][1]);
        ctx.lineTo(point.x, point.y);
      }

      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      const center = room.points.reduce(
        (acc, point) => ({ x: acc.x + point[0], y: acc.y + point[1] }),
        { x: 0, y: 0 }
      );
      center.x /= room.points.length;
      center.y /= room.points.length;

      const screenCenter = worldToScreen(center.x, center.y);
      ctx.fillStyle = '#64748b';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(room.name, screenCenter.x, screenCenter.y);

      if (room.area > 0) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px Inter, sans-serif';
        ctx.fillText(`${room.area.toFixed(1)}m²`, screenCenter.x, screenCenter.y + 14);
      }
    });
  };

  const drawFurniture = (ctx: CanvasRenderingContext2D) => {
    if (!currentScene) return;

    currentScene.furniture.forEach((item) => {
      const pos = worldToScreen(item.position[0], item.position[2]);
      const width = item.dimensions.width * scale;
      const depth = item.dimensions.depth * scale;

      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(-item.rotation[1]);

      const isSelected = selectedIds.includes(item.id);

      ctx.fillStyle = item.color;
      ctx.strokeStyle = isSelected ? '#3b82f6' : '#475569';
      ctx.lineWidth = isSelected ? 3 : 1;

      ctx.fillRect(-width / 2, -depth / 2, width, depth);
      ctx.strokeRect(-width / 2, -depth / 2, width, depth);

      if (isSelected) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(-width / 2 - 5, -depth / 2 - 5, width + 10, depth + 10);
        ctx.setLineDash([]);
      }

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, -depth / 2 + 5);
      ctx.lineTo(-5, -depth / 2 + 15);
      ctx.lineTo(5, -depth / 2 + 15);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    });
  };

  const drawMeasurements = (ctx: CanvasRenderingContext2D) => {
    if (!currentScene) return;

    currentScene.measurements.forEach((measurement) => {
      const start = worldToScreen(measurement.start[0], measurement.start[1]);
      const end = worldToScreen(measurement.end[0], measurement.end[1]);

      ctx.strokeStyle = '#22c55e';
      ctx.fillStyle = '#22c55e';
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(start.x, start.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(end.x, end.y, 3, 0, Math.PI * 2);
      ctx.fill();

      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;

      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${measurement.value.toFixed(2)}${measurement.unit}`, midX, midY - 5);
    });
  };

  const drawCurrentLine = (ctx: CanvasRenderingContext2D) => {
    if (!isDrawing || !drawStart) return;

    const start = worldToScreen(drawStart.x, drawStart.y);
    const end = worldToScreen(mousePos.x, mousePos.y);

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    ctx.setLineDash([]);

    const distance = Math.sqrt(
      Math.pow(mousePos.x - drawStart.x, 2) +
      Math.pow(mousePos.y - drawStart.y, 2)
    );

    ctx.fillStyle = '#3b82f6';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `${distance.toFixed(2)}m`,
      (start.x + end.x) / 2,
      (start.y + end.y) / 2 - 10
    );
  };

  const drawSnapIndicator = (ctx: CanvasRenderingContext2D) => {
    if (tool !== 'wall' && tool !== 'room' && tool !== 'door' && tool !== 'window') return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const worldPos = screenToWorld(
      (canvasRef.current?.width || 0) / 2 + offset.x + mousePos.x * scale,
      (canvasRef.current?.height || 0) / 2 + offset.y - mousePos.y * scale
    );

    const snapResult = snapSystem.current.snap(worldPos);
    
    if (snapResult.type !== 'none') {
      const screenPos = worldToScreen(snapResult.point[0], snapResult.point[1]);
      
      ctx.strokeStyle = '#22c55e';
      ctx.fillStyle = '#22c55e';
      ctx.lineWidth = 2;

      switch (snapResult.type) {
        case 'endpoint':
          ctx.strokeRect(screenPos.x - 6, screenPos.y - 6, 12, 12);
          break;
        case 'midpoint':
          ctx.beginPath();
          ctx.moveTo(screenPos.x, screenPos.y - 8);
          ctx.lineTo(screenPos.x + 7, screenPos.y + 4);
          ctx.lineTo(screenPos.x - 7, screenPos.y + 4);
          ctx.closePath();
          ctx.stroke();
          break;
        case 'center':
          ctx.beginPath();
          ctx.arc(screenPos.x, screenPos.y, 8, 0, Math.PI * 2);
          ctx.stroke();
          break;
        default:
          ctx.beginPath();
          ctx.arc(screenPos.x, screenPos.y, 4, 0, Math.PI * 2);
          ctx.fill();
      }
    }
  };

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawGrid(ctx, canvas.width, canvas.height);
    drawRooms(ctx);
    drawWalls(ctx);
    drawDoors(ctx);
    drawWindows(ctx);
    drawFurniture(ctx);
    drawMeasurements(ctx);
    drawCurrentLine(ctx);
    drawSnapIndicator(ctx);
  }, [drawGrid, drawRooms, drawWalls, drawDoors, drawWindows, drawFurniture, drawMeasurements, drawCurrentLine, drawSnapIndicator]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      render();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [render]);

  useEffect(() => {
    let animationId: number;
    
    const animate = () => {
      render();
      animationId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationId);
  }, [render]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
      return;
    }

    if ((tool === 'wall' || tool === 'door' || tool === 'window') && e.button === 0) {
      const worldPos = screenToWorld(x, y);
      const snapResult = snapSystem.current.snap(worldPos);
      
      setIsDrawing(true);
      setDrawStart({ x: snapResult.point[0], y: snapResult.point[1] });
      setMousePos({ x: snapResult.point[0], y: snapResult.point[1] });
    }

    if (tool === 'select' && e.button === 0) {
      const worldPos = screenToWorld(x, y);
      
      let foundId: string | null = null;
      const clickRadius = 10 / scale;

      currentScene?.walls.forEach(wall => {
        const dist = pointToLineDistance(
          worldPos[0], worldPos[1],
          wall.start[0], wall.start[1],
          wall.end[0], wall.end[1]
        );
        if (dist < clickRadius) {
          foundId = wall.id;
        }
      });

      if (foundId) {
        select(foundId, e.ctrlKey || e.metaKey);
      } else if (!e.ctrlKey && !e.metaKey) {
        select([]);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isPanning) {
      setOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (isDrawing && drawStart) {
      const worldPos = screenToWorld(x, y);
      const snapResult = snapSystem.current.snap(worldPos);
      setMousePos({ x: snapResult.point[0], y: snapResult.point[1] });
    }

    const worldPos = screenToWorld(x, y);
    let foundHover: string | null = null;
    const hoverRadius = 8 / scale;

    currentScene?.walls.forEach(wall => {
      const dist = pointToLineDistance(
        worldPos[0], worldPos[1],
        wall.start[0], wall.start[1],
        wall.end[0], wall.end[1]
      );
      if (dist < hoverRadius) {
        foundHover = wall.id;
      }
    });

    setHoveredId(foundHover);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isDrawing && drawStart) {
      const distance = Math.sqrt(
        Math.pow(mousePos.x - drawStart.x, 2) +
        Math.pow(mousePos.y - drawStart.y, 2)
      );

      if (distance > 0.1) {
        if (tool === 'wall') {
          addWall(
            [drawStart.x, drawStart.y],
            [mousePos.x, mousePos.y]
          );
        }
      }

      setIsDrawing(false);
      setDrawStart(null);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(5, Math.min(100, prev * zoomFactor)));
  };

  const pointToLineDistance = (px: number, py: number, x1: number, y1: number, x2: number, y2: number): number => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;

    return Math.sqrt(dx * dx + dy * dy);
  };

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        className={`w-full h-full ${isPanning ? 'cursor-grabbing' : 'cursor-crosshair'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setIsPanning(false)}
        onWheel={handleWheel}
      />
      
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => setScale(s => Math.min(100, s * 1.2))}
          className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-slate-300 shadow-lg"
        >
          +
        </button>
        <button
          onClick={() => setScale(s => Math.max(5, s / 1.2))}
          className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-slate-300 shadow-lg"
        >
          -
        </button>
        <button
          onClick={() => { setScale(20); setOffset({ x: 0, y: 0 }); }}
          className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-slate-300 shadow-lg"
        >
          ⌖
        </button>
      </div>

      <div className="absolute bottom-4 left-4 bg-slate-800 px-3 py-1.5 rounded-lg text-xs text-slate-300 shadow-lg">
        Escala: 1:{(100 / scale).toFixed(0)} | {scale.toFixed(0)} px/m
      </div>
    </div>
  );
}
