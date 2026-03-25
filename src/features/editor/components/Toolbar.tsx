// ============================================
// Toolbar.tsx - Barra de Ferramentas Premium
// Desktop: Vertical esquerda | Mobile: Horizontal inferior
// ============================================

import React, { useState } from 'react';
import { 
  MousePointer2, 
  Square, 
  Circle, 
  DoorOpen, 
  Square as WindowIcon,
  Armchair,
  Ruler,
  Grid3X3,
  ZoomIn,
  ZoomOut,
  Undo2,
  Redo2,
  Save,
  MoreVertical,
  ChevronUp
} from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';
import { motion, AnimatePresence } from 'framer-motion';

interface ToolbarProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  className?: string;
}

type ToolType = 'select' | 'wall' | 'room' | 'door' | 'window' | 'furniture' | 'measure';

interface ToolButton {
  id: ToolType;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  premium?: boolean;
}

const tools: ToolButton[] = [
  { id: 'select', icon: <MousePointer2 size={20} />, label: 'Selecionar', shortcut: 'V' },
  { id: 'wall', icon: <Square size={20} />, label: 'Parede', shortcut: 'W' },
  { id: 'room', icon: <Grid3X3 size={20} />, label: 'Cômodo', shortcut: 'R' },
  { id: 'door', icon: <DoorOpen size={20} />, label: 'Porta', shortcut: 'D' },
  { id: 'window', icon: <WindowIcon size={20} />, label: 'Janela', shortcut: 'J' },
  { id: 'furniture', icon: <Armchair size={20} />, label: 'Móvel', shortcut: 'F', premium: true },
  { id: 'measure', icon: <Ruler size={20} />, label: 'Medir', shortcut: 'M' },
];

export const Toolbar: React.FC<ToolbarProps> = ({ 
  onToggleSidebar, 
  isSidebarOpen,
  className = '' 
}) => {
  const { tool, setTool, undo, redo, canUndo, canRedo, saveProject } = useEditorStore();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleToolClick = (toolId: ToolType) => {
    setTool(toolId);
    setShowMobileMenu(false);
  };

  return (
    <>
      {/* DESKTOP: Toolbar Vertical Esquerda */}
      <div className={`
        hidden lg:flex flex-col
        fixed left-4 top-1/2 -translate-y-1/2 z-50
        bg-slate-900/95 backdrop-blur-xl
        border border-slate-700/50
        rounded-2xl shadow-2xl shadow-black/50
        transition-all duration-300 ease-out
        ${isExpanded ? 'w-16 py-4' : 'w-12 py-3'}
        ${className}
      `}>
        {/* Toggle Expand */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mx-auto mb-3 p-2 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
        >
          <motion.div
            animate={{ rotate: isExpanded ? 0 : 180 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronUp size={16} />
          </motion.div>
        </button>

        <div className="flex-1 flex flex-col gap-1 px-2">
          {tools.map((t) => (
            <ToolButtonComponent
              key={t.id}
              tool={t}
              isActive={tool === t.id}
              isExpanded={isExpanded}
              onClick={() => handleToolClick(t.id)}
            />
          ))}
        </div>

        <div className="border-t border-slate-700/50 mt-3 pt-3 px-2 flex flex-col gap-1">
          <ActionButton
            icon={<Undo2 size={18} />}
            label="Desfazer"
            onClick={undo}
            disabled={!canUndo}
            isExpanded={isExpanded}
          />
          <ActionButton
            icon={<Redo2 size={18} />}
            label="Refazer"
            onClick={redo}
            disabled={!canRedo}
            isExpanded={isExpanded}
          />
          <ActionButton
            icon={<Save size={18} />}
            label="Salvar"
            onClick={saveProject}
            isExpanded={isExpanded}
            highlight
          />
        </div>
      </div>

      {/* MOBILE: Toolbar Horizontal Inferior */}
      <div className={`
        lg:hidden fixed bottom-0 left-0 right-0 z-50
        bg-slate-900/98 backdrop-blur-2xl
        border-t border-slate-700/50
        safe-area-pb
        ${className}
      `}>
        {/* Menu Expandido */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-full left-0 right-0 bg-slate-900/98 border-t border-slate-700/50 p-4 grid grid-cols-4 gap-3"
            >
              {tools.map((t) => (
                <MobileToolButton
                  key={t.id}
                  tool={t}
                  isActive={tool === t.id}
                  onClick={() => handleToolClick(t.id)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Barra Principal Mobile */}
        <div className="flex items-center justify-between px-4 py-3">
          {/* Ferramenta Ativa */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className={`
              flex items-center gap-3 px-4 py-2 rounded-xl
              ${showMobileMenu ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-200'}
              transition-colors
            `}
          >
            <span className="text-blue-400">
              {tools.find(t => t.id === tool)?.icon}
            </span>
            <span className="font-medium text-sm">
              {tools.find(t => t.id === tool)?.label}
            </span>
            <motion.div
              animate={{ rotate: showMobileMenu ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronUp size={16} />
            </motion.div>
          </button>

          {/* Ações Rápidas */}
          <div className="flex items-center gap-2">
            <MobileActionButton
              icon={<Undo2 size={20} />}
              onClick={undo}
              disabled={!canUndo}
            />
            <MobileActionButton
              icon={<Redo2 size={20} />}
              onClick={redo}
              disabled={!canRedo}
            />
            <MobileActionButton
              icon={<Save size={20} />}
              onClick={saveProject}
              highlight
            />
            <div className="w-px h-8 bg-slate-700 mx-1" />
            <MobileActionButton
              icon={<MoreVertical size={20} />}
              onClick={onToggleSidebar}
              active={isSidebarOpen}
            />
          </div>
        </div>
      </div>

      {/* Zoom Controls - Desktop (canto direito) */}
      <div className="hidden lg:flex fixed right-4 bottom-4 flex-col gap-2 z-50">
        <ZoomButton icon={<ZoomIn size={18} />} onClick={() => {}} label="Aumentar zoom" />
        <ZoomButton icon={<ZoomOut size={18} />} onClick={() => {}} label="Diminuir zoom" />
      </div>

      {/* Zoom Controls - Mobile (canto direito, acima da toolbar) */}
      <div className="lg:hidden fixed right-4 bottom-24 flex flex-col gap-2 z-50">
        <ZoomButton icon={<ZoomIn size={20} />} onClick={() => {}} label="Aumentar zoom" mobile />
        <ZoomButton icon={<ZoomOut size={20} />} onClick={() => {}} label="Diminuir zoom" mobile />
      </div>
    </>
  );
};

// Componentes Auxiliares

interface ToolButtonProps {
  tool: ToolButton;
  isActive: boolean;
  isExpanded: boolean;
  onClick: () => void;
}

const ToolButtonComponent: React.FC<ToolButtonProps> = ({ tool, isActive, isExpanded, onClick }) => (
  <button
    onClick={onClick}
    className={`
      group relative flex items-center justify-center
      ${isExpanded ? 'w-full h-12' : 'w-8 h-8'}
      rounded-xl transition-all duration-200
      ${isActive 
        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }
    `}
  >
    {tool.icon}
    
    {/* Badge Premium */}
    {tool.premium && (
      <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full" />
    )}
    
    {/* Tooltip */}
    {isExpanded && (
      <span className="absolute left-full ml-3 px-2 py-1 bg-slate-800 text-slate-200 text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
        {tool.label}
        {tool.shortcut && <span className="ml-2 text-slate-500">{tool.shortcut}</span>}
      </span>
    )}
  </button>
);

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  isExpanded: boolean;
  highlight?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ 
  icon, label, onClick, disabled, isExpanded, highlight 
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      group relative flex items-center justify-center
      ${isExpanded ? 'w-full h-10' : 'w-8 h-8'}
      rounded-xl transition-all duration-200
      ${disabled 
        ? 'text-slate-600 cursor-not-allowed' 
        : highlight
          ? 'text-emerald-400 hover:bg-emerald-500/10'
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }
    `}
  >
    {icon}
    
    {isExpanded && (
      <span className="absolute left-full ml-3 px-2 py-1 bg-slate-800 text-slate-200 text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
        {label}
      </span>
    )}
  </button>
);

interface MobileToolButtonProps {
  tool: ToolButton;
  isActive: boolean;
  onClick: () => void;
}

const MobileToolButton: React.FC<MobileToolButtonProps> = ({ tool, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`
      flex flex-col items-center gap-2 p-3 rounded-xl transition-all
      ${isActive 
        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
        : 'bg-slate-800 text-slate-400 border border-transparent'
      }
    `}
  >
    {tool.icon}
    <span className="text-xs font-medium">{tool.label}</span>
    {tool.premium && (
      <span className="text-[10px] text-amber-400 font-medium">PRO</span>
    )}
  </button>
);

interface MobileActionButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  highlight?: boolean;
  active?: boolean;
}

const MobileActionButton: React.FC<MobileActionButtonProps> = ({ 
  icon, onClick, disabled, highlight, active 
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      p-2.5 rounded-xl transition-all
      ${disabled 
        ? 'text-slate-600' 
        : active
          ? 'bg-blue-500/20 text-blue-400'
          : highlight
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'text-slate-400 hover:bg-slate-800'
      }
    `}
  >
    {icon}
  </button>
);

interface ZoomButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  label: string;
  mobile?: boolean;
}

const ZoomButton: React.FC<ZoomButtonProps> = ({ icon, onClick, label, mobile }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center justify-center
      ${mobile ? 'w-11 h-11' : 'w-10 h-10'}
      bg-slate-900/95 backdrop-blur-xl
      border border-slate-700/50
      rounded-xl text-slate-400
      hover:bg-slate-800 hover:text-slate-200
      transition-all shadow-lg
    `}
    title={label}
  >
    {icon}
  </button>
);

export default Toolbar;
