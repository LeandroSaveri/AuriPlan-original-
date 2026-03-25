// Canvas2D.tsx - Orquestrador Production-Grade Final
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useEditorStore, selectCurrentScene } from '../../../../store/editorStore';
import { CameraEngine } from '../../../../core/camera/CameraEngine';
import { SnapEngine } from '../../../../core/snap/SnapEngine';
import { GridEngine } from '../../../../core/grid/GridEngine';
import { InteractionEngine } from '../../../../core/interaction/InteractionEngine';
import { WallRenderer } from '../../../../core/wall/WallRenderer';
import { RoomRenderer } from '../../../../core/room/RoomRenderer';
import type { Vec2 } from '../../../../types';

interface Canvas2DProps { className?: string; }

export const Canvas2D: React.FC<Canvas2DProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const isReadyRef = useRef(false);

  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const lastFrameRef = useRef(0);
  const targetFrame = 16.6;

  const gridCacheRef = useRef<HTMLCanvasElement | null>(null);
  const gridCacheCameraRef = useRef<string | null>(null);

  const canvasRectRef = useRef<{width:number,height:number}>({width:0,height:0});

  const camera = useRef(new CameraEngine({ minZoom: 0.1, maxZoom: 10 })).current;
  const snap = useRef(new SnapEngine()).current;
  const grid = useRef(new GridEngine()).current;
  const interaction = useRef(new InteractionEngine()).current;
  const wallRenderer = useRef(new WallRenderer()).current;
  const roomRenderer = useRef(new RoomRenderer()).current;

  const toolRef = useRef(useEditorStore.getState().tool);
  const isDrawingRef = useRef(false);
  const drawStartRef = useRef<Vec2 | null>(null);
  const hoveredIdRef = useRef<string | null>(null);

  const getCurrentScene = (state: any) => state.scenes.find((s: any) => s.id === state.currentSceneId);
  const sceneRef = useRef(getCurrentScene(useEditorStore.getState()));
  const selectedIdsRef = useRef(useEditorStore.getState().selectedIds);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<Vec2 | null>(null);
  const [tool, setTool] = useState(useEditorStore.getState().tool);

  const { grid: gridCfg, snap: snapCfg, addWall, select } = useEditorStore();

  useEffect(() => { toolRef.current = tool; }, [tool]);
  useEffect(() => { isDrawingRef.current = isDrawing; }, [isDrawing]);
  useEffect(() => { drawStartRef.current = drawStart; }, [drawStart]);
  useEffect(() => { hoveredIdRef.current = hoveredId; }, [hoveredId]);

  useEffect(() => {
    const unsub = useEditorStore.subscribe((state) => {
      sceneRef.current = state.scenes.find((s: any) => s.id === state.currentSceneId);
      selectedIdsRef.current = state.selectedIds;
      if (state.tool !== toolRef.current) setTool(state.tool);
    });
    return unsub;
  }, []);

  // screenToWorld otimizado
  const screenToWorld = useCallback((p: any): Vec2 => {
    const r = canvasRectRef.current;
    const st = camera.getState();

    const sx = Array.isArray(p) ? p[0] : p.x;
    const sy = Array.isArray(p) ? p[1] : p.y;

    return [
      (sx - r.width / 2) / (st.zoom * 20) - st.position[0],
      -(sy - r.height / 2) / (st.zoom * 20) - st.position[2]
    ];
  }, []);

  const pointToLineDist = (px: number, py: number, x1: number, y1: number, x2: number, y2: number): number => {
    const A = px - x1, B = py - y1, C = x2 - x1, D = y2 - y1;
    const dot = A * C + B * D, lenSq = C * C + D * D;
    let param = lenSq !== 0 ? dot / lenSq : -1;
    let xx, yy;
    if (param < 0) { xx = x1; yy = y1; }
    else if (param > 1) { xx = x2; yy = y2; }
    else { xx = x1 + param * C; yy = y1 + param * D; }
    return Math.hypot(px - xx, py - yy);
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvasRectRef.current = { width: rect.width, height: rect.height };

    const ctx = canvas.getContext('2d', { alpha: false });
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
    ctxRef.current = ctx;

    camera.setState({ position: [0, 10, 10], target: [0, 0, 0], zoom: 1 });
    interaction.attach(canvas);
    isReadyRef.current = true;

    const onMouseMove = (e: any) => {
      const state = interaction.getState();
      if (state.isDragging && (state.activeButton === 'middle' || state.modifiers.has('shift'))) {
        camera.pan([-(e.delta?.[0] || 0), e.delta?.[1] || 0]);
        gridCacheCameraRef.current = null;
        return false;
      }
      if (!isDrawingRef.current) {
        const worldPos = screenToWorld(e.position);
        const walls = sceneRef.current?.walls || [];
        let found: string | null = null;
        for (const w of walls) {
          if (pointToLineDist(worldPos[0], worldPos[1], w.start[0], w.start[1], w.end[0], w.end[1]) < 0.3) {
            found = w.id; break;
          }
        }
        if (found !== hoveredIdRef.current) {
          hoveredIdRef.current = found;
          setHoveredId(found);
        }
      }
      return true;
    };

    const onWheel = (e: any) => {
      camera.setZoom(camera.getState().zoom * (e.delta && e.delta[1] > 0 ? 0.9 : 1.1));
      gridCacheCameraRef.current = null;
      return false;
    };

    const onClick = (e: any) => {
      if (toolRef.current === 'select') {
        const worldPos = screenToWorld(e.position);
        const walls = sceneRef.current?.walls || [];
        let found: string | null = null;
        for (const w of walls) {
          if (pointToLineDist(worldPos[0], worldPos[1], w.start[0], w.start[1], w.end[0], w.end[1]) < 0.3) {
            found = w.id; break;
          }
        }
        if (found) select(found, interaction.getState().modifiers.has('ctrl'));
        else if (!interaction.getState().modifiers.has('ctrl')) select([]);
      }
      return true;
    };

    const onMouseDown = (e: any) => {
      if (toolRef.current === 'wall' && e.button === 'left' && !interaction.getState().modifiers.has('shift')) {
        const p = snap.snap(screenToWorld(e.position)).point;
        drawStartRef.current = p;
        isDrawingRef.current = true;
        setDrawStart(p);
        setIsDrawing(true);
        snap.setLastPoint?.(p);
      }
      return true;
    };

    const onMouseUp = (e: any) => {
      if (isDrawingRef.current && toolRef.current === 'wall' && drawStartRef.current) {
        const end = snap.snap(screenToWorld(e.position)).point;
        if (Math.hypot(end[0] - drawStartRef.current[0], end[1] - drawStartRef.current[1]) > 0.1) {
          addWall(drawStartRef.current, end);
        }
        isDrawingRef.current = false;
        drawStartRef.current = null;
        setIsDrawing(false);
        setDrawStart(null);
      }
      return true;
    };

    const onKeyDown = (e: any) => {
      if (e.key === 'Escape') {
        isDrawingRef.current = false;
        drawStartRef.current = null;
        setIsDrawing(false);
        setDrawStart(null);
      }
      return true;
    };

    interaction.on('mousemove', onMouseMove);
    interaction.on('wheel', onWheel);
    interaction.on('click', onClick);
    interaction.on('mousedown', onMouseDown);
    interaction.on('mouseup', onMouseUp);
    interaction.on('keydown', onKeyDown);

    const render = () => {
      const now = performance.now();
      if (now - lastFrameRef.current < targetFrame) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }
      lastFrameRef.current = now;

      const ctx = ctxRef.current;
      const canvas = canvasRef.current;
      if (!ctx || !canvas || !isReadyRef.current) { 
        rafRef.current = requestAnimationFrame(render); 
        return; 
      }

      const rect = canvasRectRef.current;
      const state = camera.getState();
      const cx = rect.width / 2, cy = rect.height / 2;

      // Limpa usando tamanho lógico (CSS pixels)
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, rect.width, rect.height);

      ctx.save();

      // Grid cache com chave de câmera
      const camKey = `${state.position[0]}_${state.position[2]}_${state.zoom}`;

      if (gridCacheCameraRef.current !== camKey || !gridCacheRef.current) {
        const off = document.createElement('canvas');
        off.width = canvas.width;
        off.height = canvas.height;

        const offCtx = off.getContext('2d');
        if (offCtx) {
          offCtx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
          offCtx.translate(cx, cy);
          offCtx.scale(state.zoom * 20, -state.zoom * 20);
          offCtx.translate(state.position[0], state.position[2]);

          const vw = rect.width / (state.zoom * 20);
          const vh = rect.height / (state.zoom * 20);

          grid.render(
            offCtx,
            {
              min: [-vw/2-state.position[0], -vh/2-state.position[2]] as Vec2,
              max: [vw/2-state.position[0], vh/2-state.position[2]] as Vec2
            },
            state.zoom,
            [0,0]
          );
        }

        gridCacheRef.current = off;
        gridCacheCameraRef.current = camKey;
      }

      if (gridCacheRef.current) {
        ctx.drawImage(gridCacheRef.current, 0, 0);
      }

      // World space
      ctx.translate(cx, cy);
      ctx.scale(state.zoom * 20, -state.zoom * 20);
      ctx.translate(state.position[0], state.position[2]);

      const currentScene = sceneRef.current;
      if (currentScene) {
        roomRenderer.render(ctx, currentScene.rooms, selectedIdsRef.current);
        wallRenderer.render(ctx, currentScene.walls, selectedIdsRef.current, hoveredIdRef.current);
        currentScene.furniture?.forEach((f: any) => { 
          const [x,,y]=f.position, {width,depth}=f.dimensions, rot=f.rotation[1]; 
          ctx.save(); 
          ctx.translate(x,y); 
          ctx.rotate(-rot); 
          ctx.fillStyle=f.color; 
          ctx.strokeStyle=selectedIdsRef.current.includes(f.id)?'#3b82f6':'#475569'; 
          ctx.lineWidth=selectedIdsRef.current.includes(f.id)?0.03:0.02; 
          ctx.fillRect(-width/2,-depth/2,width,depth); 
          ctx.strokeRect(-width/2,-depth/2,width,depth); 
          ctx.restore(); 
        });
      }

      if (isDrawingRef.current && drawStartRef.current && toolRef.current === 'wall') {
        const mousePos = interaction.getMousePosition();
        const end = snap.snap(screenToWorld(mousePos)).point;
        ctx.strokeStyle='#3b82f6'; 
        ctx.lineWidth=0.02; 
        ctx.setLineDash([0.1,0.1]); 
        ctx.beginPath(); 
        ctx.moveTo(drawStartRef.current[0],drawStartRef.current[1]); 
        ctx.lineTo(end[0],end[1]); 
        ctx.stroke(); 
        ctx.setLineDash([]);
        const dist = Math.hypot(end[0]-drawStartRef.current[0], end[1]-drawStartRef.current[1]);
        ctx.fillStyle='#3b82f6'; 
        ctx.font='0.15px monospace'; 
        ctx.textAlign='center'; 
        ctx.fillText(`${dist.toFixed(2)}m`, (drawStartRef.current[0]+end[0])/2, (drawStartRef.current[1]+end[1])/2+0.2);
      }

      if (toolRef.current !== 'select') {
        const s = snap.snap(screenToWorld(interaction.getMousePosition()));
        if (s.type !== 'none') { 
          ctx.strokeStyle='#22c55e'; 
          ctx.fillStyle='#22c55e'; 
          ctx.lineWidth=0.02; 
          const [x,y]=s.point; 
          if (s.type==='endpoint') ctx.strokeRect(x-0.15,y-0.15,0.3,0.3); 
          else if (s.type==='midpoint') { 
            ctx.beginPath(); 
            ctx.moveTo(x,y-0.2); 
            ctx.lineTo(x+0.17,y+0.1); 
            ctx.lineTo(x-0.17,y+0.1); 
            ctx.closePath(); 
            ctx.stroke(); 
          } else { 
            ctx.beginPath(); 
            ctx.arc(x,y,0.1,0,Math.PI*2); 
            ctx.fill(); 
          } 
        }
      }

      ctx.restore();
      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      interaction.off('mousemove', onMouseMove);
      interaction.off('wheel', onWheel);
      interaction.off('click', onClick);
      interaction.off('mousedown', onMouseDown);
      interaction.off('mouseup', onMouseUp);
      interaction.off('keydown', onKeyDown);
      interaction.detach();
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => { 
    grid.setConfig({ visible: gridCfg.visible, size: gridCfg.size, subdivisions: gridCfg.subdivisions, majorColor: gridCfg.color, opacity: gridCfg.opacity }); 
    gridCacheCameraRef.current = null;
  }, [gridCfg]);

  useEffect(() => { 
    snap.setConfig({ enabled: snapCfg.enabled, snapDistance: snapCfg.distance, angleSnap: snapCfg.angle, gridSize: gridCfg.size }); 
  }, [snapCfg, gridCfg.size]);

  useEffect(() => { 
    const onResize = () => { 
      if (!canvasRef.current || !containerRef.current) return; 
      const c = canvasRef.current, r = containerRef.current.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2); 
      c.width = r.width * dpr; 
      c.height = r.height * dpr; 
      canvasRectRef.current = { width: r.width, height: r.height };
      if (ctxRef.current) {
        ctxRef.current.setTransform(1, 0, 0, 1, 0, 0);
        ctxRef.current.scale(dpr, dpr);
      }
      gridCacheCameraRef.current = null;
    }; 
    window.addEventListener('resize', onResize); 
    return () => window.removeEventListener('resize', onResize); 
  }, []);

  const st = camera.getState();
  return (
    <div ref={containerRef} className={`relative w-full h-full overflow-hidden bg-slate-950 ${className}`}>
      <canvas ref={canvasRef} className="block w-full h-full cursor-crosshair touch-none" style={{ touchAction: 'none' }} />
      <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur text-slate-300 text-xs px-4 py-3 rounded-xl border border-slate-700/50 pointer-events-none">
        <div className="flex items-center gap-4">
          <div><span className="text-slate-500 text-[10px] uppercase">Escala</span><div className="font-mono">1:{(100/st.zoom).toFixed(0)}</div></div>
          <div className="w-px h-8 bg-slate-700" />
          <div><span className="text-slate-500 text-[10px] uppercase">Zoom</span><div className="font-mono">{(st.zoom*100).toFixed(0)}%</div></div>
          <div className="w-px h-8 bg-slate-700" />
          <div><span className="text-slate-500 text-[10px] uppercase">Ferramenta</span><div className="font-medium text-blue-400 capitalize">{tool}</div></div>
        </div>
      </div>
      {tool !== 'select' && <div className="absolute top-4 left-4 bg-green-500/10 text-green-400 text-xs px-3 py-1.5 rounded-full border border-green-500/20 pointer-events-none">Snap Ativo</div>}
    </div>
  );
};

export default Canvas2D;
