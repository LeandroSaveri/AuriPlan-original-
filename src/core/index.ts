// ============================================
// Core Module Exports
// ============================================

// Math & Geometry
export * from './math/vector';
export * from './math/geometry';

// Snap System
export { SnapSystem } from './snap/SnapSystem';
export { SnapRenderer } from './snap/SnapRenderer';
export type { SnapIndicator } from './snap/SnapRenderer';

// Grid
export { GridRenderer } from './grid/GridRenderer';

// Camera/Viewport
export { CameraRenderer } from './camera/CameraRenderer';

// Interaction
export { InteractionRenderer } from './interaction/InteractionRenderer';
export type { Handle } from './interaction/InteractionRenderer';

// Collision
export { CollisionRenderer } from './collision/CollisionRenderer';

// Wall
export { WallRenderer } from './wall/WallRenderer';

// Room
export { RoomRenderer } from './room/RoomRenderer';

// History
export { HistoryManager } from './history/HistoryManager';

// Project
export { ProjectManager } from './project/ProjectManager';

// Import/Export
export { ImportEngine } from './import/ImportEngine';
export { ExportEngine } from './export/ExportEngine';
