// ============================================
// TOOLBAR - Barra de Ferramentas Premium
// ============================================

import { 
  MousePointer2, 
  Move, 
  Hand,
  ZoomIn, 
  Square as Wall,
  Square, 
  Box,
  DoorOpen,
  AppWindow,
  Ruler,
  Type,
  Eraser,
  Grid3X3,
  Maximize2,
  Eye,
  EyeOff,
  Undo,
  Redo,
  Save,
  Download,
  Settings,
  Menu,
  ChevronDown,
  Layers,
  Box as Cube,
  Split,
  FileImage,
  Share2,
  Printer,
  Camera,
  Video,
  RotateCcw,
  Focus,
  Minus,
  Plus
} from 'lucide-react';
import { useEditorStore } from '@store/editorStore';
import type { ViewMode, Tool } from '@types';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  tool: Tool;
  onToolChange: (tool: Tool) => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const tools = [
  { id: 'select' as Tool, icon: MousePointer2, label: 'Selecionar', shortcut: 'V' },
  { id: 'pan' as Tool, icon: Hand, label: 'Mover Vista', shortcut: 'H' },
  { id: 'wall' as Tool, icon: Wall, label: 'Parede', shortcut: 'W' },
  { id: 'room' as Tool, icon: Square, label: 'Cômodo', shortcut: 'R' },
  { id: 'door' as Tool, icon: DoorOpen, label: 'Porta', shortcut: 'D' },
  { id: 'window' as Tool, icon: AppWindow, label: 'Janela', shortcut: 'J' },
  { id: 'furniture' as Tool, icon: Box, label: 'Móvel', shortcut: 'F' },
  { id: 'measure' as Tool, icon: Ruler, label: 'Medir', shortcut: 'M' },
  { id: 'text' as Tool, icon: Type, label: 'Texto', shortcut: 'T' },
  { id: 'eraser' as Tool, icon: Eraser, label: 'Apagar', shortcut: 'E' },
];

export function Toolbar({ 
  viewMode, 
  onViewModeChange, 
  tool, 
  onToolChange,
  onToggleSidebar,
  isSidebarOpen 
}: ToolbarProps) {
  const { 
    grid, 
    toggleGrid, 
    canUndo, 
    canRedo, 
    undo, 
    redo, 
    saveProject,
    project,
    zoomIn,
    zoomOut,
    fitToView,
    camera,
    setCamera,
  } = useEditorStore();

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);

  const handleExport = (format: string) => {
    const data = useEditorStore.getState().exportProject();
    
    switch (format) {
      case 'json':
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project?.name || 'project'}.json`;
        a.click();
        break;
      case 'png':
        // Export as PNG would require canvas capture
        break;
      case 'pdf':
        // Export as PDF
        break;
    }
    setShowExportMenu(false);
  };

  return (
    <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center px-2 gap-1">
      {/* Menu Toggle */}
      <button
        onClick={onToggleSidebar}
        className={`p-2 rounded-lg transition-colors ${
          isSidebarOpen ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
        }`}
        title="Toggle Sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="w-px h-6 bg-slate-700 mx-1" />

      {/* View Mode */}
      <div className="flex bg-slate-800 rounded-lg p-1">
        <button
          onClick={() => onViewModeChange('2d')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
            viewMode === '2d' 
              ? 'bg-blue-500 text-white' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          2D
        </button>
        <button
          onClick={() => onViewModeChange('3d')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
            viewMode === '3d' 
              ? 'bg-blue-500 text-white' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cube className="w-4 h-4" />
          3D
        </button>
        <button
          onClick={() => onViewModeChange('split')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
            viewMode === 'split' 
              ? 'bg-blue-500 text-white' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Split className="w-4 h-4" />
          Split
        </button>
      </div>

      <div className="w-px h-6 bg-slate-700 mx-1" />

      {/* Tools */}
      <div className="flex gap-0.5">
        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => onToolChange(t.id)}
            className={`p-2 rounded-lg transition-colors relative group ${
              tool === t.id 
                ? 'bg-blue-500 text-white' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title={`${t.label} (${t.shortcut})`}
          >
            <t.icon className="w-5 h-5" />
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
              {t.label}
            </span>
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {/* Right Side */}
      <div className="flex items-center gap-1">
        {/* Zoom Controls */}
        <div className="flex items-center bg-slate-800 rounded-lg p-1">
          <button
            onClick={zoomOut}
            className="p-1.5 rounded text-slate-400 hover:text-slate-200"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-400 px-2 min-w-[50px] text-center">
            {(camera.zoom * 100).toFixed(0)}%
          </span>
          <button
            onClick={zoomIn}
            className="p-1.5 rounded text-slate-400 hover:text-slate-200"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={fitToView}
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 ml-1"
            title="Fit to View"
          >
            <Focus className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-6 bg-slate-700" />

        {/* Grid Toggle */}
        <button
          onClick={toggleGrid}
          className={`p-2 rounded-lg transition-colors ${
            grid.visible 
              ? 'text-blue-400 bg-blue-500/10' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Toggle Grid"
        >
          <Grid3X3 className="w-5 h-5" />
        </button>

        <div className="w-px h-6 bg-slate-700" />

        {/* Undo/Redo */}
        <button
          onClick={undo}
          disabled={!canUndo()}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-5 h-5" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo()}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800"
          title="Redo (Ctrl+Y)"
        >
          <Redo className="w-5 h-5" />
        </button>

        <div className="w-px h-6 bg-slate-700" />

        {/* Save */}
        <button
          onClick={() => saveProject()}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          title="Save (Ctrl+S)"
        >
          <Save className="w-5 h-5" />
        </button>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            title="Export"
          >
            <Download className="w-5 h-5" />
          </button>
          <AnimatePresence>
            {showExportMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50"
              >
                <div className="p-2">
                  <button
                    onClick={() => handleExport('json')}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
                  >
                    <FileImage className="w-4 h-4" />
                    Exportar JSON
                  </button>
                  <button
                    onClick={() => handleExport('png')}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
                  >
                    <Camera className="w-4 h-4" />
                    Exportar PNG
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
                  >
                    <Printer className="w-4 h-4" />
                    Exportar PDF
                  </button>
                  <div className="border-t border-slate-700 my-1" />
                  <button
                    onClick={() => handleExport('share')}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
                  >
                    <Share2 className="w-4 h-4" />
                    Compartilhar
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Settings */}
        <button
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
