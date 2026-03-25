// ============================================
// Sidebar.tsx - Painel Lateral Premium
// Desktop: Lateral esquerda fixa | Mobile: Drawer overlay
// ============================================

import React, { useState } from 'react';
import { 
  X, 
  Layers, 
  Settings, 
  Palette, 
  Ruler,
  ChevronRight,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-react';
import { useEditorStore, selectCurrentScene } from '@/store/editorStore';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

type TabType = 'scenes' | 'properties' | 'materials' | 'settings';

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, className = '' }) => {
  const [activeTab, setActiveTab] = useState<TabType>('scenes');
  const currentScene = useEditorStore(selectCurrentScene);
  const { scenes, currentSceneId, setCurrentScene, addScene, deleteScene } = useEditorStore();

  // Mobile: Drawer overlay
  // Desktop: Lateral fixa
  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <motion.aside
        initial={false}
        animate={{ 
          x: isOpen ? 0 : '-100%',
          opacity: isOpen ? 1 : 0 
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`
          fixed lg:sticky
          top-0 lg:top-4
          left-0
          h-full lg:h-[calc(100vh-2rem)]
          w-80 lg:w-72
          bg-slate-900/98 lg:bg-slate-900/95
          backdrop-blur-2xl
          border-r lg:border border-slate-700/50
          lg:rounded-2xl
          z-50 lg:z-30
          flex flex-col
          shadow-2xl shadow-black/50
          ${className}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-slate-100">Projeto</h2>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700/50">
          {[
            { id: 'scenes' as TabType, icon: Layers, label: 'Cenas' },
            { id: 'properties' as TabType, icon: Settings, label: 'Propriedades' },
            { id: 'materials' as TabType, icon: Palette, label: 'Materiais' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 flex items-center justify-center gap-2 py-3 px-2
                text-xs font-medium transition-all
                ${activeTab === tab.id 
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }
              `}
            >
              <tab.icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'scenes' && (
            <ScenesTab 
              scenes={scenes}
              currentSceneId={currentSceneId}
              onSceneChange={setCurrentScene}
              onAddScene={addScene}
              onDeleteScene={deleteScene}
            />
          )}
          
          {activeTab === 'properties' && (
            <PropertiesTab scene={currentScene} />
          )}
          
          {activeTab === 'materials' && (
            <MaterialsTab />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700/50 bg-slate-900/50">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>AuriPlan v2.0</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Online
            </span>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

// Tab Components

interface ScenesTabProps {
  scenes: any[];
  currentSceneId: string | null;
  onSceneChange: (id: string) => void;
  onAddScene: () => void;
  onDeleteScene: (id: string) => void;
}

const ScenesTab: React.FC<ScenesTabProps> = ({ 
  scenes, currentSceneId, onSceneChange, onAddScene, onDeleteScene 
}) => {
  const [showAddInput, setShowAddInput] = useState(false);
  const [newSceneName, setNewSceneName] = useState('');

  const handleAdd = () => {
    if (newSceneName.trim()) {
      onAddScene();
      setNewSceneName('');
      setShowAddInput(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Add Scene Button */}
      {showAddInput ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={newSceneName}
            onChange={(e) => setNewSceneName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') setShowAddInput(false);
            }}
            placeholder="Nome da cena"
            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            autoFocus
          />
          <button
            onClick={handleAdd}
            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAddInput(true)}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-dashed border-slate-600 rounded-xl text-slate-400 hover:text-slate-200 transition-all"
        >
          <Plus size={18} />
          <span className="text-sm font-medium">Nova Cena</span>
        </button>
      )}

      {/* Scene List */}
      <div className="space-y-2">
        {scenes.map((scene, index) => (
          <SceneItem
            key={scene.id}
            scene={scene}
            index={index}
            isActive={scene.id === currentSceneId}
            onClick={() => onSceneChange(scene.id)}
            onDelete={() => onDeleteScene(scene.id)}
          />
        ))}
      </div>
    </div>
  );
};

interface SceneItemProps {
  scene: any;
  index: number;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}

const SceneItem: React.FC<SceneItemProps> = ({ scene, index, isActive, onClick, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all
        ${isActive 
          ? 'bg-blue-500/20 border border-blue-500/30' 
          : 'bg-slate-800/50 border border-transparent hover:bg-slate-800'
        }
      `}
    >
      {/* Thumbnail */}
      <div className={`
        w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold
        ${isActive ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'}
      `}>
        {index + 1}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-slate-200 truncate">
          {scene.name || `Cena ${index + 1}`}
        </h4>
        <p className="text-xs text-slate-500">
          {scene.walls?.length || 0} paredes • {scene.rooms?.length || 0} cômodos
        </p>
      </div>

      {/* Actions */}
      <div className={`
        flex items-center gap-1 transition-opacity
        ${isHovered ? 'opacity-100' : 'opacity-0'}
      `}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
        >
          <Trash2 size={14} />
        </button>
        <ChevronRight size={16} className="text-slate-500" />
      </div>
    </div>
  );
};

interface PropertiesTabProps {
  scene: any;
}

const PropertiesTab: React.FC<PropertiesTabProps> = ({ scene }) => {
  if (!scene) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Settings size={48} className="mx-auto mb-3 opacity-50" />
        <p className="text-sm">Selecione uma cena para editar propriedades</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PropertyGroup title="Dimensões">
        <PropertyField label="Largura" value="10.5" unit="m" />
        <PropertyField label="Comprimento" value="12.3" unit="m" />
        <PropertyField label="Altura" value="2.8" unit="m" />
      </PropertyGroup>

      <PropertyGroup title="Configurações">
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-slate-300">Visibilidade</span>
          <button className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-blue-400">
            <Eye size={18} />
          </button>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-slate-300">Bloquear</span>
          <button className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-amber-400">
            <Unlock size={18} />
          </button>
        </div>
      </PropertyGroup>
    </div>
  );
};

interface PropertyGroupProps {
  title: string;
  children: React.ReactNode;
}

const PropertyGroup: React.FC<PropertyGroupProps> = ({ title, children }) => (
  <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
      {title}
    </h4>
    <div className="space-y-3">
      {children}
    </div>
  </div>
);

interface PropertyFieldProps {
  label: string;
  value: string;
  unit?: string;
}

const PropertyField: React.FC<PropertyFieldProps> = ({ label, value, unit }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-slate-400">{label}</span>
    <div className="flex items-center gap-2">
      <input
        type="text"
        defaultValue={value}
        className="w-20 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-right text-sm text-slate-200 focus:outline-none focus:border-blue-500"
      />
      {unit && <span className="text-xs text-slate-500 w-4">{unit}</span>}
    </div>
  </div>
);

const MaterialsTab: React.FC = () => (
  <div className="grid grid-cols-3 gap-2">
    {['#8B4513', '#D2691E', '#87CEEB', '#696969', '#F5F5DC', '#2F4F4F'].map((color) => (
      <button
        key={color}
        className="aspect-square rounded-xl border-2 border-transparent hover:border-white/50 transition-all"
        style={{ backgroundColor: color }}
      />
    ))}
    <button className="aspect-square rounded-xl border-2 border-dashed border-slate-600 flex items-center justify-center text-slate-500 hover:border-slate-400 hover:text-slate-300">
      <Plus size={24} />
    </button>
  </div>
);

export default Sidebar;
