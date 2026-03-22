// ============================================
// TYPES - Tipos da Aplicação
// ============================================

// ============================================
// VECTORS
// ============================================
export type Vec2 = [number, number];
export type Vec3 = [number, number, number];

// ============================================
// USER
// ============================================
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer';
}

// ============================================
// PROJECT
// ============================================
export interface Project {
  id: string;
  name: string;
  description: string;
  owner: User;
  collaborators: User[];
  createdAt: string;
  updatedAt: string;
  settings: {
    units: 'metric' | 'imperial';
    currency: string;
  };
}

// ============================================
// SCENE (FLOOR)
// ============================================
export interface Scene {
  id: string;
  name: string;
  level: number;
  height: number;
  walls: Wall[];
  rooms: Room[];
  doors: Door[];
  windows: Window[];
  furniture: Furniture[];
  measurements: Measurement[];
}

// ============================================
// WALL
// ============================================
export interface Wall {
  id: string;
  start: Vec2;
  end: Vec2;
  thickness: number;
  height: number;
  color: string;
  visible: boolean;
  locked: boolean;
  metadata: Record<string, any>;
}

// ============================================
// ROOM
// ============================================
export type RoomType = 'living' | 'bedroom' | 'kitchen' | 'bathroom' | 'dining' | 'office' | 'custom';

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  points: Vec2[];
  wallColor: string;
  floorColor: string;
  ceilingColor: string;
  height: number;
  area: number;
  perimeter: number;
  visible: boolean;
  locked: boolean;
  metadata: Record<string, any>;
}

// ============================================
// DOOR
// ============================================
export type DoorSwing = 'left' | 'right' | 'double' | 'sliding';
export type DoorStyle = 'panel' | 'flush' | 'french' | 'sliding';

export interface Door {
  id: string;
  wallId: string;
  position: number;
  width: number;
  height: number;
  depth: number;
  swing: DoorSwing;
  style: DoorStyle;
  panelColor: string;
  frameColor: string;
  visible: boolean;
  locked: boolean;
  metadata: Record<string, any>;
}

// ============================================
// WINDOW
// ============================================
export type WindowStyle = 'single-hung' | 'double-hung' | 'sliding' | 'casement' | 'picture';

export interface Window {
  id: string;
  wallId: string;
  position: number;
  width: number;
  height: number;
  sillHeight: number;
  depth: number;
  style: WindowStyle;
  frameColor: string;
  visible: boolean;
  locked: boolean;
  metadata: Record<string, any>;
}

// ============================================
// FURNITURE
// ============================================
export type FurnitureCategory = 
  | 'living' 
  | 'bedroom' 
  | 'kitchen' 
  | 'bathroom' 
  | 'lighting' 
  | 'decor' 
  | 'office' 
  | 'appliances'
  | 'outdoor';

export type FurnitureType = 
  | 'sofa' 
  | 'sectional'
  | 'armchair'
  | 'coffee-table'
  | 'tv-stand'
  | 'bookshelf'
  | 'bed'
  | 'nightstand'
  | 'dresser'
  | 'wardrobe'
  | 'dining-table'
  | 'dining-chair'
  | 'kitchen-island'
  | 'bar-stool'
  | 'vanity-unit'
  | 'bathtub'
  | 'chandelier'
  | 'floor-lamp'
  | 'table-lamp'
  | 'plant'
  | 'rug'
  | 'mirror'
  | 'artwork'
  | 'desk'
  | 'office-chair'
  | 'bookshelf-office'
  | 'fridge'
  | 'stove'
  | 'oven'
  | 'dishwasher'
  | 'washer'
  | 'patio-set'
  | 'grill'
  | 'generic';

export interface Dimensions {
  width: number;
  height: number;
  depth: number;
}

export interface Furniture {
  id: string;
  catalogId: string;
  name: string;
  category: FurnitureCategory;
  type: FurnitureType;
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
  dimensions: Dimensions;
  color: string;
  material: string;
  visible: boolean;
  locked: boolean;
  castShadow: boolean;
  receiveShadow: boolean;
  metadata: Record<string, any>;
}

// ============================================
// MEASUREMENT
// ============================================
export interface Measurement {
  id: string;
  start: Vec2;
  end: Vec2;
  value: number;
  unit: string;
  visible: boolean;
}

// ============================================
// SETTINGS
// ============================================
export interface GridSettings {
  visible: boolean;
  size: number;
  color: string;
  opacity: number;
}

export interface SnapSettings {
  enabled: boolean;
  grid: boolean;
  endpoints: boolean;
  midpoints: boolean;
  edges: boolean;
  centers: boolean;
  perpendicular: boolean;
  angle: boolean;
  distance: number;
}

export interface CameraState {
  position: Vec3;
  target: Vec3;
  zoom: number;
  rotation: number;
}

// ============================================
// UI
// ============================================
export type ViewMode = '2d' | '3d' | 'split';

export type Tool = 
  | 'select' 
  | 'pan' 
  | 'wall' 
  | 'room' 
  | 'door' 
  | 'window' 
  | 'furniture' 
  | 'measure' 
  | 'text' 
  | 'eraser';

// ============================================
// CATALOG
// ============================================
export interface CatalogItem {
  id: string;
  name: string;
  category: FurnitureCategory;
  type: FurnitureType;
  thumbnail: string;
  dimensions: Dimensions;
  defaultColor: string;
  availableColors: string[];
  availableMaterials: string[];
  price?: number;
  brand?: string;
  isPremium: boolean;
  popularity: number;
}

// ============================================
// EXPORT
// ============================================
export interface ExportOptions {
  format: 'json' | 'png' | 'pdf' | 'obj' | 'svg';
  quality?: 'low' | 'medium' | 'high';
  includeFurniture?: boolean;
  includeMaterials?: boolean;
  scale?: number;
}

// ============================================
// AI DESIGN
// ============================================
export interface AIDesignRequest {
  roomType: RoomType;
  style: string;
  dimensions: Dimensions;
  budget?: number;
}

export interface AIDesignSuggestion {
  furniture: Array<{
    catalogId: string;
    position: Vec3;
    rotation: Vec3;
  }>;
  colors: {
    wall: string;
    floor: string;
  };
  description: string;
}

// ============================================
// COLLABORATION
// ============================================
export interface CursorPosition {
  userId: string;
  name: string;
  color: string;
  position: Vec2;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  name: string;
  message: string;
  timestamp: string;
}
