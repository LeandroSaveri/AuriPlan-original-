// ============================================
// APP - Versão Defensiva
// ============================================

import { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  FolderOpen, 
  Plus, 
  Settings, 
  User, 
  Box,
  ChevronRight,
  Layout,
  Sparkles
} from 'lucide-react';

// Lazy load do Editor para não crashar a Home
const Editor = lazy(() => import('../features/editor/Editor').catch(() => ({
  default: () => <div style={{ color: 'white', padding: 50 }}>Erro ao carregar Editor</div>
})));

// ============================================
// HOME PAGE
// ============================================
function HomePage({ onCreateProject, onOpenProject }: { 
  onCreateProject: () => void; 
  onOpenProject: () => void;
}) {
  const [recentProjects, setRecentProjects] = useState<Array<{ id: string; name: string; updatedAt: string }>>([]));

  useEffect(() => {
    const saved = localStorage.getItem('recentProjects');
    if (saved) {
      try {
        setRecentProjects(JSON.parse(saved).slice(0, 5));
      } catch {}
    }
  }, []);

  const templates = [
    { id: 'apartment', name: 'Apartamento', icon: Layout, description: '2 quartos, 1 suíte' },
    { id: 'house', name: 'Casa', icon: Home, description: '3 quartos, quintal' },
    { id: 'studio', name: 'Studio', icon: Box, description: 'Espaço aberto' },
    { id: 'office', name: 'Escritório', icon: FolderOpen, description: 'Espaço de trabalho' },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Box className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              AuriPlan
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-colors">
              <Settings className="w-4 h-4" />
              <span className="text-sm">Configurações</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-colors">
              <User className="w-4 h-4" />
              <span className="text-sm">Entrar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Crie Designs de
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                {' '}Interiores Incríveis
              </span>
            </h1>
            <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
              Ferramenta profissional de design de interiores com visualização 2D/3D.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCreateProject}
                className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl"
              >
                <Plus className="w-5 h-5" />
                Novo Projeto
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onOpenProject}
                className="flex items-center gap-2 px-8 py-4 bg-slate-800 text-white font-semibold rounded-xl"
              >
                <FolderOpen className="w-5 h-5" />
                Abrir Projeto
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Templates Section */}
      <section className="py-16 px-6 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8">Comece com um Template</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {templates.map((template, index) => {
              const Icon = template.icon;
              return (
                <motion.button
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  onClick={onCreateProject}
                  className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-left hover:border-blue-500/50"
                >
                  <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">{template.name}</h3>
                  <p className="text-sm text-slate-500">{template.description}</p>
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

// ============================================
// MAIN APP
// ============================================
export default function App() {
  const [view, setView] = useState<'home' | 'editor'>('home');

  const handleCreateProject = () => {
    setView('editor');
  };

  const handleOpenProject = () => {
    setView('editor');
  };

  return (
    <AnimatePresence mode="wait">
      {view === 'home' ? (
        <motion.div
          key="home"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <HomePage 
            onCreateProject={handleCreateProject}
            onOpenProject={handleOpenProject}
          />
        </motion.div>
      ) : (
        <motion.div
          key="editor"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="h-screen"
        >
          <Suspense fallback={<div style={{ color: 'white', padding: 50 }}>Carregando Editor...</div>}>
            <Editor onBack={() => setView('home')} />
          </Suspense>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
