// ============================================
// Core Module Exports
// ============================================

// Math & Geometry
export * from './math/vector';
export * from './math/geometry';

// Camera Engine (singleton instance)
import { CameraEngine } from './camera/CameraEngine';
export const camera = new CameraEngine();

// Grid Engine (singleton instance)
import { GridEngine } from './grid/GridEngine';
export const grid = new GridEngine();

// Interaction Engine (singleton instance)
import { InteractionEngine } from './interaction/InteractionEngine';
export const interaction = new InteractionEngine();

// Snap System (singleton instance)
import { SnapSystem } from './snap/SnapSystem';
export const snap = new SnapSystem();

// Snap Engine (classe e singleton)
export { SnapEngine, getSnapEngine, createSnapEngine } from './snap/SnapEngine';

// Renderers (classes)
export { WallRenderer } from './wall/WallRenderer';
export { RoomRenderer } from './room/RoomRenderer';
export { GridRenderer } from './grid/GridRenderer';
export { CameraRenderer } from './camera/CameraRenderer';
export { SnapRenderer } from './snap/SnapRenderer';
export { InteractionRenderer } from './interaction/InteractionRenderer';
export { CollisionRenderer } from './collision/CollisionRenderer';

// Renderer instances (para uso direto no Canvas2D)
import { WallRenderer } from './wall/WallRenderer';
import { RoomRenderer } from './room/RoomRenderer';

export const wallRenderer = new WallRenderer();
export const roomRenderer = new RoomRenderer();

// History
export { HistoryManager } from './history/HistoryManager';
export { HistoryEngine } from './history/HistoryEngine';

// Project
export { ProjectManager } from './project/ProjectManager';

// Import/Export
export { ImportEngine } from './import/ImportEngine';
export { ExportEngine } from './export/ExportEngine';

// Types
export type { SnapResult, SnapType, SnapConfig } from './snap/SnapSystem';
export type { Handle } from './interaction/InteractionRenderer';
export type { SnapIndicator } from './snap/SnapRenderer';
