// ============================================
// StatusBar.tsx - Barra de Status Premium
// Desktop: Bottom fixo | Mobile: Compacta ou oculta
// ============================================

import React from 'react';
import { 
  Wifi, 
  WifiOff, 
  Users, 
  Save, 
  Clock,
  MousePointer2,
  Maximize2
} from 'lucide-react';
import { useEditorStore, selectCurrentScene } from '@/store/editorStore';
import { useEditor } from '@/hooks/useEditor';

interface StatusBarProps {
  className?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({ className = '' }) => {
  const currentScene = useEditorStore(selectCurrentScene);
  const { camera, grid, isOnline, isSaving, collaborators } = useEditor();
  
  // Calcular estatísticas
  const stats = {
    walls: currentScene?.walls?.length || 0,
    rooms: currentScene?.rooms?.length || 0,
    furniture: currentScene?.furniture?.length || 0,
    area: currentScene?.rooms?.reduce((acc: number, room: any) => acc + (room.area || 0), 0) || 0
  };

  return (
    <>
      {/* DESKTOP: Status Bar Completa */}
      <div className={`
        hidden lg:flex
        fixed bottom-0 left-0 right-0
        h-8 bg-slate-900/95 backdrop-blur-xl
        border-t border-slate-700/50
        items-center justify-between px-4
        text-xs z-40
        ${className}
      `}>
        {/* Left: Grid & Zoom Info */}
        <div className="flex items-center gap-4">
          <StatusItem 
            icon={<Maximize2 size={12} />}
            label="Grade"
            value={`${grid.size}m`}
          />
          <StatusDivider />
          <StatusItem 
            label="Zoom"
            value={`${(camera.zoom * 100).toFixed(0)}%`}
          />
          <StatusDivider />
          <StatusItem 
            icon={<MousePointer2 size={12} />}
            label="Posição"
            value={`X: ${camera.position[0].toFixed(2)} Y: ${camera.position[2].toFixed(2)}`}
          />
        </div>

        {/* Center: Selection Stats */}
        <div className="flex items-center gap-4">
          <StatusBadge 
            label="Área"
            value={`${stats.area.toFixed(1)}m²`}
            color="blue"
          />
          <StatusBadge 
            label="Cômodos"
            value={stats.rooms}
            color="emerald"
          />
          <StatusBadge 
            label="Paredes"
            value={stats.walls}
            color="amber"
          />
          <StatusBadge 
            label="Móveis"
            value={stats.furniture}
            color="purple"
          />
        </div>

        {/* Right: System Status */}
        <div className="flex items-center gap-3">
          {/* Save Status */}
          <div className={`
            flex items-center gap-1.5 px-2 py-1 rounded-md
            ${isSaving ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}
          `}>
            <Save size={12} className={isSaving ? 'animate-pulse' : ''} />
            <span className="font-medium">
              {isSaving ? 'Salvando...' : 'Salvo'}
            </span>
          </div>

          <StatusDivider />

          {/* Connection */}
          <div className={`
            flex items-center gap-1.5
            ${isOnline ? 'text-emerald-400' : 'text-red-400'}
          `}>
            {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          <StatusDivider />

          {/* Collaborators */}
          <div className="flex items-center gap-1.5 text-slate-400">
            <Users size={12} />
            <span>{collaborators}</span>
          </div>
        </div>
      </div>

      {/* MOBILE: Status Bar Compacta (apenas essencial) */}
      <div className={`
        lg:hidden
        fixed top-0 left-0 right-0
        h-10 bg-slate-900/98 backdrop-blur-xl
        border-b border-slate-700/50
        flex items-center justify-between px-3
        text-xs z-50
        ${className}
      `}>
        {/* Left: Save Status */}
        <div className={`
          flex items-center gap-1.5 px-2 py-1 rounded-md
          ${isSaving ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}
        `}>
          <Save size={12} className={isSaving ? 'animate-pulse' : ''} />
          <span className="font-medium text-[10px]">
            {isSaving ? '...' : '✓'}
          </span>
        </div>

        {/* Center: Quick Stats */}
        <div className="flex items-center gap-3 text-slate-400">
          <span className="text-[10px]">
            <span className="text-slate-500">Área:</span> {stats.area.toFixed(0)}m²
          </span>
          <span className="text-[10px]">
            <span className="text-slate-500">Zoom:</span> {(camera.zoom * 100).toFixed(0)}%
          </span>
        </div>

        {/* Right: Connection */}
        <div className={`
          flex items-center gap-1
          ${isOnline ? 'text-emerald-400' : 'text-red-400'}
        `}>
          {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
        </div>
      </div>
    </>
  );
};

// Componentes Auxiliares

interface StatusItemProps {
  icon?: React.ReactNode;
  label: string;
  value: string;
}

const StatusItem: React.FC<StatusItemProps> = ({ icon, label, value }) => (
  <div className="flex items-center gap-1.5 text-slate-400">
    {icon && <span className="text-slate-500">{icon}</span>}
    <span className="text-slate-500">{label}:</span>
    <span className="text-slate-300 font-mono">{value}</span>
  </div>
);

const StatusDivider = () => (
  <div className="w-px h-4 bg-slate-700" />
);

interface StatusBadgeProps {
  label: string;
  value: string | number;
  color: 'blue' | 'emerald' | 'amber' | 'purple' | 'red';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ label, value, color }) => {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  return (
    <div className={`
      flex items-center gap-1.5 px-2 py-0.5 rounded-md border
      ${colors[color]}
    `}>
      <span className="text-slate-500">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
};

export default StatusBar;
