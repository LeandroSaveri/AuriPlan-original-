// ============================================
// COMPONENTE: Sidebar
// Painel lateral de ferramentas do editor
// ============================================

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MousePointer2,
  PenLine,
  Square,
  Hand,
  Magnet,
  Grid3X3,
  Settings,
  ChevronRight,
  ChevronLeft,
  Ruler
} from 'lucide-react';

// ============================================
// TIPOS
// ============================================

type ToolType = 'select' | 'wall' | 'room' | 'move';

interface SidebarProps {
  currentTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  snapEnabled: boolean;
  onToggleSnap: () => void;
  gridSize: number;
  onGridSizeChange: (size: number) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

// ============================================
// COMPONENTE
// ============================================

export const Sidebar: React.FC<SidebarProps> = ({
  currentTool,
  onToolChange,
  snapEnabled,
  onToggleSnap,
  gridSize,
  onGridSizeChange,
  showGrid,
  onToggleGrid,
  isCollapsed = false,
  onToggleCollapse
}) => {
  // --------------------------------------------
  // Configuração das Ferramentas
  // --------------------------------------------

  const tools: { id: ToolType; icon: React.ReactNode; label: string; shortcut: string }[] = [
    { id: 'select', icon: <MousePointer2 size={20} />, label: 'Selecionar', shortcut: 'V' },
    { id: 'wall', icon: <PenLine size={20} />, label: 'Parede', shortcut: 'W' },
    { id: 'room', icon: <Square size={20} />, label: 'Cômodo', shortcut: 'R' },
    { id: 'move', icon: <Hand size={20} />, label: 'Mover', shortcut: 'H' },
  ];

  // --------------------------------------------
  // Render
  // --------------------------------------------

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 60 : 280 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={styles.sidebar}
    >
      {/* Botão de Colapsar */}
      <button
        onClick={onToggleCollapse}
        style={styles.collapseButton}
        title={isCollapsed ? 'Expandir' : 'Recolher'}
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.content}
          >
            {/* Seção: Ferramentas */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Ferramentas</h3>
              <div style={styles.toolsGrid}>
                {tools.map((tool) => (
                  <ToolButton
                    key={tool.id}
                    tool={tool}
                    isActive={currentTool === tool.id}
                    onClick={() => onToolChange(tool.id)}
                  />
                ))}
              </div>
            </div>

            {/* Seção: Configurações de Snap */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Ajuste</h3>
              
              {/* Snap Toggle */}
              <div style={styles.settingRow}>
                <div style={styles.settingInfo}>
                  <Magnet size={16} style={{ color: snapEnabled ? '#4ade80' : '#6b7280' }} />
                  <span style={styles.settingLabel}>Snap</span>
                </div>
                <ToggleSwitch checked={snapEnabled} onChange={onToggleSnap} />
              </div>

              {/* Grid Toggle */}
              <div style={styles.settingRow}>
                <div style={styles.settingInfo}>
                  <Grid3X3 size={16} style={{ color: showGrid ? '#4ade80' : '#6b7280' }} />
                  <span style={styles.settingLabel}>Grade</span>
                </div>
                <ToggleSwitch checked={showGrid} onChange={onToggleGrid} />
              </div>

              {/* Grid Size */}
              {showGrid && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  style={styles.gridSizeControl}
                >
                  <div style={styles.settingInfo}>
                    <Ruler size={14} />
                    <span style={styles.settingLabelSmall}>Tamanho: {gridSize}cm</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={gridSize}
                    onChange={(e) => onGridSizeChange(Number(e.target.value))}
                    style={styles.slider}
                  />
                </motion.div>
              )}
            </div>

            {/* Seção: Info */}
            <div style={styles.infoSection}>
              <p style={styles.infoText}>
                <kbd style={styles.kbd}>V</kbd> Selecionar
              </p>
              <p style={styles.infoText}>
                <kbd style={styles.kbd}>W</kbd> Parede
              </p>
              <p style={styles.infoText}>
                <kbd style={styles.kbd}>R</kbd> Cômodo
              </p>
              <p style={styles.infoText}>
                <kbd style={styles.kbd}>H</kbd> Mover
              </p>
              <p style={styles.infoText}>
                <kbd style={styles.kbd}>Del</kbd> Excluir
              </p>
              <p style={styles.infoText}>
                <kbd style={styles.kbd}>Esc</kbd> Cancelar
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Versão Colapsada - Ícones apenas */}
      {isCollapsed && (
        <div style={styles.collapsedTools}>
          {tools.map((tool) => (
            <CollapsedToolButton
              key={tool.id}
              tool={tool}
              isActive={currentTool === tool.id}
              onClick={() => onToolChange(tool.id)}
            />
          ))}
        </div>
      )}
    </motion.aside>
  );
};

// ============================================
// SUB-COMPONENTES
// ============================================

const ToolButton: React.FC<{
  tool: { id: string; icon: React.ReactNode; label: string; shortcut: string };
  isActive: boolean;
  onClick: () => void;
}> = ({ tool, isActive, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    style={{
      ...styles.toolButton,
      ...(isActive ? styles.toolButtonActive : {}),
    }}
  >
    <span style={isActive ? styles.iconActive : styles.icon}>{tool.icon}</span>
    <span style={styles.toolLabel}>{tool.label}</span>
    <kbd style={styles.shortcut}>{tool.shortcut}</kbd>
  </motion.button>
);

const CollapsedToolButton: React.FC<{
  tool: { id: string; icon: React.ReactNode; label: string };
  isActive: boolean;
  onClick: () => void;
}> = ({ tool, isActive, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    title={tool.label}
    style={{
      ...styles.collapsedButton,
      ...(isActive ? styles.collapsedButtonActive : {}),
    }}
  >
    {tool.icon}
  </motion.button>
);

const ToggleSwitch: React.FC<{ checked: boolean; onChange: () => void }> = ({
  checked,
  onChange
}) => (
  <button
    onClick={onChange}
    style={{
      ...styles.toggle,
      backgroundColor: checked ? '#4ade80' : '#374151',
    }}
  >
    <motion.div
      initial={false}
      animate={{ x: checked ? 20 : 2 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      style={styles.toggleThumb}
    />
  </button>
);

// ============================================
// ESTILOS
// ============================================

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    backgroundColor: '#1e1e2e',
    borderRight: '1px solid #2d2d3d',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
  },
  collapseButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    background: 'transparent',
    border: 'none',
    color: '#6b7280',
    cursor: 'pointer',
    padding: 4,
    borderRadius: 4,
    zIndex: 10,
  },
  content: {
    padding: '16px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    height: '100%',
    overflowY: 'auto',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    margin: 0,
  },
  toolsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 8,
  },
  toolButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    padding: '12px 8px',
    backgroundColor: '#252536',
    border: '1px solid #2d2d3d',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.2s',
    position: 'relative',
  },
  toolButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#60a5fa',
  },
  icon: {
    color: '#9ca3af',
  },
  iconActive: {
    color: '#ffffff',
  },
  toolLabel: {
    fontSize: 11,
    color: '#d1d5db',
    fontWeight: 500,
  },
  shortcut: {
    position: 'absolute',
    top: 4,
    right: 4,
    fontSize: 9,
    color: '#6b7280',
    backgroundColor: '#1e1e2e',
    padding: '2px 4px',
    borderRadius: 3,
    fontFamily: 'monospace',
  },
  settingRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 0',
  },
  settingInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: '#d1d5db',
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: 500,
  },
  settingLabelSmall: {
    fontSize: 11,
  },
  toggle: {
    width: 40,
    height: 22,
    borderRadius: 11,
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    padding: 0,
  },
  toggleThumb: {
    width: 18,
    height: 18,
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    position: 'absolute',
    top: 2,
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
  },
  gridSizeControl: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: '8px 12px',
    backgroundColor: '#252536',
    borderRadius: 6,
    marginTop: 4,
  },
  slider: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: '#374151',
    outline: 'none',
    border: 'none',
    cursor: 'pointer',
  },
  infoSection: {
    marginTop: 'auto',
    padding: '12px',
    backgroundColor: '#252536',
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  infoText: {
    fontSize: 11,
    color: '#9ca3af',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  kbd: {
    backgroundColor: '#1e1e2e',
    padding: '2px 6px',
    borderRadius: 4,
    fontFamily: 'monospace',
    fontSize: 10,
    border: '1px solid #374151',
    minWidth: 20,
    textAlign: 'center',
  },
  collapsedTools: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: '12px 8px',
  },
  collapsedButton: {
    width: 40,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#252536',
    border: '1px solid #2d2d3d',
    borderRadius: 8,
    cursor: 'pointer',
    color: '#9ca3af',
  },
  collapsedButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#60a5fa',
    color: '#ffffff',
  },
};

// ============================================
// EXPORTAÇÃO
// ============================================

export default Sidebar;
