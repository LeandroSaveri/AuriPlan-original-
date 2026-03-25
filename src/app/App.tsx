// ============================================
// APP - Aplicação Principal
// ============================================

import { useState, useEffect } from 'react';
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
import { Editor } from '../features/editor/Editor';
import { useEditorStore } from '../store/editorStore';

// ============================================
// HOME PAGE - Página Inicial
// ============================================
function HomePage({ onCreateProject, onOpenProject }: { 
  onCreateProject: () => void; 
  onOpenProject: () => void;
}) {
  const [recentProjects, setRecentProjects] = useState<Array<{ id: string; name: string; updatedAt: string }>>([]);

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
              Ferramenta profissional de design de interiores com visualização 2D/3D, 
              biblioteca de móveis e colaboração em tempo real.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCreateProject}
                className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all"
              >
                <Plus className="w-5 h-5" />
                Novo Projeto
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onOpenProject}
                className="flex items-center gap-2 px-8 py-4 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-700 transition-all"
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
                  whileTap={{ scale: 0.98 }}
                  onClick={onCreateProject}
                  className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-left hover:border-blue-500/50 hover:bg-slate-800/50 transition-all group"
                >
                  <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                    <Icon className="w-6 h-6 text-slate-400 group-hover:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">{template.name}</h3>
                  <p className="text-sm text-slate-500">{template.description}</p>
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Recent Projects */}
      {recentProjects.length > 0 && (
        <section className="py-16 px-6 border-t border-slate-800">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-8">Projetos Recentes</h2>
            
            <div className="space-y-2">
              {recentProjects.map((project, index) => (
                <motion.button
                  key={project.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={onOpenProject}
                  className="w-full flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-blue-500/50 hover:bg-slate-800/50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <FolderOpen className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium text-white">{project.name}</h3>
                      <p className="text-sm text-slate-500">
                        Editado {new Date(project.updatedAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500" />
                </motion.button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 px-6 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Recursos Premium</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Layout,
                title: 'Editor 2D/3D',
                description: 'Crie plantas baixas em 2D e visualize em 3D com renderização em tempo real.',
              },
              {
                icon: Box,
                title: 'Biblioteca de Móveis',
                description: 'Milhares de itens de móveis em alta qualidade para decorar seus espaços.',
              },
              {
                icon: Sparkles,
                title: 'Design com IA',
                description: 'Deixe a inteligência artificial sugerir designs para seus cômodos.',
              },
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="text-center p-6"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-800">
        <div className="max-w-6xl mx-auto text-center text-slate-500 text-sm">
          <p>© 2024 AuriPlan. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

// ============================================
// MAIN APP
// ============================================
export default function App() {
  const [view, setView] = useState<'home' | 'editor'>('home');
  const { createProject } = useEditorStore();

  const handleCreateProject = () => {
    createProject(
      'Novo Projeto',
      { id: 'user-1', name: 'Usuário', email: 'user@example.com', role: 'owner' },
      ''
    );
    setView('editor');
  };

  const handleOpenProject = () => {
    handleCreateProject();
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
          <Editor onBack={() => setView('home')} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
