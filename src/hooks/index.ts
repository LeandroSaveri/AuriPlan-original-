// ============================================
// HOOKS INDEX - Exportação Centralizada de Hooks
// ============================================

// --------------------------------------------
// UI & Interação
// --------------------------------------------
export { useClickOutside } from './useClickOutside';
export { useDebounce, useDebouncedCallback } from './useDebounce';
export { useIntersectionObserver } from './useIntersectionObserver';
export { useMediaQuery, useIsMobile, useIsTablet, useIsDesktop, useIsDarkMode } from './useMediaQuery';
export { useToast } from './useToast';
export { useWindowSize } from './useWindowSize';

// --------------------------------------------
// Storage & Dados
// --------------------------------------------
export { useLocalStorage, useSessionStorage } from './useLocalStorage';
export { useUndoRedo } from './useUndoRedo';

// --------------------------------------------
// Editor AuriPlan (novos)
// --------------------------------------------
export {
  useEditor,
  useEditorSelection,
  useEditorCamera,
  useEditorTools,
  useEditorHistory
} from './useEditor';

// --------------------------------------------
// Teclado (mantido compatibilidade)
// --------------------------------------------
export { useKeyboard } from './useKeyboard';
