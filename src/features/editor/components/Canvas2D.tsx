// Canvas2D.tsx - Orquestrador Enxuto
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useEditorStore, selectCurrentScene } from '../../../store/editorStore';
import { CameraEngine } from '../../../core/camera/CameraEngine';
import { SnapEngine } from '../../../core/snap/SnapEngine';
import { GridEngine } from '../../../core/grid/GridEngine';
import { InteractionEngine } from '../../../core/interaction/InteractionEngine';
import { WallRenderer } from '../../../core/wall/WallRenderer';
import { RoomRenderer } from '../../../core/room/RoomRenderer';
import type { Vec2 } from '../../../types';

interface Canvas2DProps { className?: string; }

export const Canvas2D: React.FC<Canvas2DProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const isReadyRef = useRef(false);

  const camera = useRef(new CameraEngine({ minZoom: 0.1, maxZoom: 10 })).current;
  const snap = useRef(new SnapEngine()).current;
  const grid = useRef(new GridEngine()).current;
  const interaction = useRef(new InteractionEngine()).current;
  const wallRenderer = useRef(new WallRenderer()).current;
  const roomRenderer = useRef(new RoomRenderer()).current;

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<Vec2 | null>(null);

  const { tool, selectedIds, select, grid: gridCfg, snap: snapCfg, addWall } = useEditorStore();
  const scene = useEditorStore(selectCurrentScene);

  // Init
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.getContext('2d')?.scale(dpr, dpr);
    camera.setState({ position: [0, 10, 10], target: [0, 0, 0], zoom: 1 });
    interaction.attach(canvas);
    isReadyRef.current = true;

    const render = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx || !isReadyRef.current) { rafRef.current = requestAnimationFrame(render); return; }
      const rect = canvas.getBoundingClientRect();
      const state = camera.getState();
      const cx = rect.width / 2, cy = rect.height / 2;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(state.zoom * 20, -state.zoom * 20);
      ctx.translate(state.position[0], state.position[2]);
      const vw = rect.width / (state.zoom * 20), vh = rect.height / (state.zoom * 20);
      grid.render(ctx, { min: [-vw/2-state.position[0], -vh/2-state.position[2]] as Vec2, max: [vw/2-state.position[0], vh/2-state.position[2]] as Vec2 }, state.zoom, [0,0]);
      if (scene) {
        roomRenderer.render(ctx, scene.rooms, selectedIds);
        wallRenderer.render(ctx, scene.walls, selectedIds, hoveredId);
        scene.furniture?.forEach((f: any) => { const [x,,y]=f.position, {width,depth}=f.dimensions, rot=f.rotation[1]; ctx.save(); ctx.translate(x,y); ctx.rotate(-rot); ctx.fillStyle=f.color; ctx.strokeStyle=selectedIds.includes(f.id)?'#3b82f6':'#475569'; ctx.lineWidth=selectedIds.includes(f.id)?0.03:0.02; ctx.fillRect(-width/2,-depth/2,width,depth); ctx.strokeRect(-width/2,-depth/2,width,depth); ctx.restore(); });
      }
      if (isDrawing && drawStart && tool === 'wall') {
        const mousePos = interaction.getMousePosition();
        const end = snap.snap(screenToWorld(mousePos)).point;
        ctx.strokeStyle='#3b82f6'; ctx.lineWidth=0.02; ctx.setLineDash([0.1,0.1]); ctx.beginPath(); ctx.moveTo(drawStart[0],drawStart[1]); ctx.lineTo(end[0],end[1]); ctx.stroke(); ctx.setLineDash([]);
        const dist = Math.hypot(end[0]-drawStart[0], end[1]-drawStart[1]);
        ctx.fillStyle='#3b82f6'; ctx.font='0.15px monospace'; ctx.textAlign='center'; ctx.fillText(`${dist.toFixed(2)}m`, (drawStart[0]+end[0])/2, (drawStart[1]+end[1])/2+0.2);
      }
      if (tool !== 'select') {
        const s = snap.snap(screenToWorld(interaction.getMousePosition()));
        if (s.type !== 'none') { ctx.strokeStyle='#22c55e'; ctx.fillStyle='#22c55e'; ctx.lineWidth=0.02; const [x,y]=s.point; if (s.type==='endpoint') ctx.strokeRect(x-0.15,y-0.15,0.3,0.3); else if (s.type==='midpoint') { ctx.beginPath(); ctx.moveTo(x,y-0.2); ctx.lineTo(x+0.17,y+0.1); ctx.lineTo(x-0.17,y+0.1); ctx.closePath(); ctx.stroke(); } else { ctx.beginPath(); ctx.arc(x,y,0.1,0,Math.PI*2); ctx.fill(); } }
      }
      ctx.restore();
      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);
    return () => { interaction.detach(); cancelAnimationFrame(rafRef.current); };
  }, []);

  // Configs
  useEffect(() => { grid.setConfig({ visible: gridCfg.visible, size: gridCfg.size, subdivisions: gridCfg.subdivisions, majorColor: gridCfg.color, opacity: gridCfg.opacity }); }, [gridCfg]);
  useEffect(() => { snap.setConfig({ enabled: snapCfg.enabled, snapDistance: snapCfg.distance, angleSnap: snapCfg.angle, gridSize: gridCfg.size }); }, [snapCfg, gridCfg.size]);
  useEffect(() => { if (scene) { snap.setWalls(scene.walls); snap.setRooms(scene.rooms); snap.setFurniture(scene.furniture); } }, [scene]);

  // Interactions
  useEffect(() => {
    interaction.on('mousemove', (e) => { const state = interaction.getState(); if (state.isDragging && (state.activeButton==='middle' || state.modifiers.has('shift'))) { camera.pan([-(e.delta?.[0]||0), e.delta?.[1]||0]); return false; } if (!isDrawing) updateHover(e.position); return true; });
    interaction.on('wheel', (e) => { camera.setZoom(camera.getState().zoom * (e.delta && e.delta[1] > 0 ? 0.9 : 1.1)); return false; });
    interaction.on('click', (e) => { if (tool === 'select') handleSelection(e.position, interaction.getState().modifiers.has('ctrl')); return true; });
    interaction.on('mousedown', (e) => { if (tool === 'wall' && e.button === 'left' && !interaction.getState().modifiers.has('shift')) { const p = snap.snap(screenToWorld(e.position)).point; setDrawStart(p); setIsDrawing(true); snap.setLastPoint?.(p); } return true; });
    interaction.on('mouseup', (e) => { if (isDrawing && tool === 'wall' && drawStart) { const end = snap.snap(screenToWorld(e.position)).point; if (Math.hypot(end[0]-drawStart[0], end[1]-drawStart[1]) > 0.1) { const w = wallRenderer.createWall?.(drawStart, end, { thickness: 0.2, height: 2.8, color: '#475569' }); if (w) addWall(w); } setIsDrawing(false); setDrawStart(null); } return true; });
    interaction.on('keydown', (e) => { if (e.key === 'Escape') { setIsDrawing(false); setDrawStart(null); } return true; });
  }, [tool, isDrawing, drawStart]);

  const screenToWorld = useCallback((s: Vec2): Vec2 => {
    const c = canvasRef.current; if (!c) return [0,0]; const r = c.getBoundingClientRect(), st = camera.getState();
    const x = s[0] - r.left, y = s[1] - r.top;
    return [(x - r.width/2)/(st.zoom*20) - st.position[0], -(y - r.height/2)/(st.zoom*20) - st.position[2]];
  }, []);

  const updateHover = useCallback((s: Vec2) => { const p = screenToWorld(s); for (const w of scene?.walls||[]) { if (pointToLineDist(p[0],p[1],w.start[0],w.start[1],w.end[0],w.end[1])<0.3) { setHoveredId(w.id); return; } } setHoveredId(null); }, [scene]);
  const handleSelection = useCallback((s: Vec2, m: boolean) => { const p = screenToWorld(s); for (const w of scene?.walls||[]) { if (pointToLineDist(p[0],p[1],w.start[0],w.start[1],w.end[0],w.end[1])<0.3) { select(w.id, m); return; } } if (!m) select([]); }, [scene, select]);
  const pointToLineDist = (px: number, py: number, x1: number, y1: number, x2: number, y2: number): number => { const A=px-x1,B=py-y1,C=x2-x1,D=y2-y1,dot=A*C+B*D,lenSq=C*C+D*D; let param=lenSq!==0?dot/lenSq:-1; let xx,yy; if(param<0){xx=x1;yy=y1;}else if(param>1){xx=x2;yy=y2;}else{xx=x1+param*C;yy=y1+param*D;} return Math.hypot(px-xx,py-yy); };

  useEffect(() => { const onResize = () => { if (!canvasRef.current || !containerRef.current) return; const c = canvasRef.current, r = containerRef.current.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2); c.width = r.width * dpr; c.height = r.height * dpr; c.getContext('2d')?.scale(dpr, dpr); }; window.addEventListener('resize', onResize); return () => window.removeEventListener('resize', onResize); }, []);

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
