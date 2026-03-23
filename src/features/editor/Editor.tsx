// ============================================
// EDITOR - Editor Principal Premium
// ============================================

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditorStore, selectProjectStats } from '@store/editorStore';
import { Toolbar } from './components/Toolbar';
import { Canvas2D } from './components/Canvas2D';
import { Canvas3D } from './components/Canvas3D';
import { PropertiesPanel } from './components/PropertiesPanel';
import { FurnitureCatalog } from './components/FurnitureCatalog';
import { Sidebar } from './components/Sidebar';
import { StatusBar } from './components/StatusBar';
import { AIAssistant } from './components/AIAssistant';
import { ProjectManager } from './components/ProjectManager';
import { TemplateGallery } from '@features/templates/TemplateGallery';
import { QuotationSystem } from '@features/quotation/QuotationSystem';
import { VirtualTour } from '@features/tour/VirtualTour';
import { ShareSystem } from '@features/share/ShareSystem';
import type { ViewMode, Tool } from '@types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  Box, 
  Palette,
  Sparkles,
  FolderOpen,
  Save,
  Settings,
  LayoutTemplate,
  Calculator,
  View,
  Share2,
  FileText,
  Camera,
  Download,
  Undo,
  Redo,
  Maximize2
} from 'lucide-react';

interface EditorProps {
  onBack?: () => void;
}

export function Editor({ onBack }: EditorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('2d');
  const [tool, setTool] = useState<Tool>('select');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(true);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showProjectManager, setShowProjectManager] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showQuotation, setShowQuotation] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { 
    project, 
    scenes,
    currentSceneId,
    createProject,
    saveProject,
    setCurrentScene,
    addScene,
    selectedIds,
    canUndo,
    canRedo,
    undo,
    redo,
  } = useEditorStore();

  const stats = useEditorStore(selectProjectStats);

  // Initialize project if none exists
  useEffect(() => {
    if (!project) {
      createProject(
        'Novo Projeto',
        { id: 'user-1', email: 'user@example.com', name: 'Usuário', role: 'owner' }
      );
    }
  }, [project, createProject]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              if (canRedo()) redo();
            } else {
              if (canUndo()) undo();
            }
            break;
          case 'y':
            e.preventDefault();
            if (canRedo()) redo();
            break;
          case 's':
            e.preventDefault();
            saveProject();
            break;
          case 'f':
            e.preventDefault();
            setIsCatalogOpen(true);
            break;
        }
      }

      // Tool shortcuts
      switch (e.key.toLowerCase()) {
        case 'v':
          setTool('select');
          break;
        case 'h':
          setTool('pan');
          break;
        case 'w':
          setTool('wall');
          break;
        case 'r':
          setTool('room');
          break;
        case 'd':
          setTool('door');
          break;
        case 'j':
          setTool('window');
          break;
        case 'm':
          setTool('measure');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo, saveProject]);

  const currentScene = scenes.find(s => s.id === currentSceneId);

  return (
    <div className="h-screen flex flex-col bg-slate-950">
      {/* Top Bar */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center px-4">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Box className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white">
                {project?.name || 'Novo Projeto'}
              </h1>
              <p className="text-xs text-slate-500">
                {currentScene?.name || 'Planta Baixa'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <div className="flex items-center bg-slate-800 rounded-lg p-1">
            <button
              onClick={undo}
              disabled={!canUndo()}
              className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded-md transition-colors"
              title="Desfazer (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo()}
              className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded-md transition-colors"
              title="Refazer (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-6 bg-slate-700 mx-1" />

          {/* Premium Features */}
          <button
            onClick={() => setShowTemplates(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Templates"
          >
            <LayoutTemplate className="w-4 h-4" />
            <span className="hidden lg:inline">Templates</span>
          </button>

          <button
            onClick={() => setShowQuotation(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Orçamento"
          >
            <Calculator className="w-4 h-4" />
            <span className="hidden lg:inline">Orçamento</span>
          </button>

          <button
            onClick={() => setShowTour(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Tour Virtual"
          >
            <View className="w-4 h-4" />
            <span className="hidden lg:inline">Tour 360°</span>
          </button>

          <div className="w-px h-6 bg-slate-700 mx-1" />

          <button
            onClick={() => setShowProjectManager(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <FolderOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Projetos</span>
          </button>
          
          <button
            onClick={() => saveProject()}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Salvar</span>
          </button>

          <button
            onClick={() => setShowShare(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Compartilhar"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-slate-700 mx-1" />

          <button
            onClick={() => setShowAIAssistant(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">IA</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        tool={tool}
        onToolChange={setTool}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-r border-slate-800 bg-slate-900 overflow-hidden"
            >
              <Sidebar
                scenes={scenes}
                currentSceneId={currentSceneId}
                onSceneChange={setCurrentScene}
                onAddScene={addScene}
                stats={stats}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Canvas Area */}
        <div className="flex-1 relative">
          {viewMode === '2d' && <Canvas2D />}
          {viewMode === '3d' && <Canvas3D />}
          {viewMode === 'split' && (
            <div className="flex h-full">
              <div className="w-1/2 border-r border-slate-800">
                <Canvas2D />
              </div>
              <div className="w-1/2">
                <Canvas3D />
              </div>
            </div>
          )}

          {/* Floating Action Buttons */}
          <div className="absolute bottom-4 left-4 flex flex-col gap-2">
            <button
              onClick={() => setIsCatalogOpen(true)}
              className="flex items-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-lg transition-colors"
            >
              <Box className="w-5 h-5" />
              <span className="font-medium">Catálogo de Móveis</span>
            </button>
          </div>
        </div>

        {/* Properties Panel */}
        <AnimatePresence>
          {isPropertiesOpen && selectedIds.length > 0 && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-l border-slate-800 bg-slate-900 overflow-hidden"
            >
              <PropertiesPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Status Bar */}
      <StatusBar
        viewMode={viewMode}
        tool={tool}
        stats={stats}
        selectedCount={selectedIds.length}
      />

      {/* Furniture Catalog Modal */}
      <AnimatePresence>
        {isCatalogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setIsCatalogOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-4xl h-[80vh] bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-14 border-b border-slate-800 flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                  <Box className="w-5 h-5 text-blue-400" />
                  <h2 className="text-lg font-semibold text-white">Catálogo de Móveis</h2>
                </div>
                <button
                  onClick={() => setIsCatalogOpen(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>
              <div className="h-[calc(80vh-56px)]">
                <FurnitureCatalog />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Assistant Modal */}
      <AnimatePresence>
        {showAIAssistant && (
          <AIAssistant onClose={() => setShowAIAssistant(false)} />
        )}
      </AnimatePresence>

      {/* Project Manager Modal */}
      <AnimatePresence>
        {showProjectManager && (
          <ProjectManager onClose={() => setShowProjectManager(false)} />
        )}
      </AnimatePresence>

      {/* Template Gallery Modal */}
      <AnimatePresence>
        {showTemplates && (
          <TemplateGallery 
            onSelectTemplate={(template) => {
              console.log('Template selected:', template);
              setShowTemplates(false);
            }}
            onClose={() => setShowTemplates(false)} 
          />
        )}
      </AnimatePresence>

      {/* Quotation System Modal */}
      <AnimatePresence>
        {showQuotation && (
          <QuotationSystem onClose={() => setShowQuotation(false)} />
        )}
      </AnimatePresence>

      {/* Virtual Tour Modal */}
      <AnimatePresence>
        {showTour && (
          <VirtualTour onClose={() => setShowTour(false)} />
        )}
      </AnimatePresence>

      {/* Share System Modal */}
      <AnimatePresence>
        {showShare && (
          <ShareSystem onClose={() => setShowShare(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
