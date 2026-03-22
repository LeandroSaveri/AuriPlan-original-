// ============================================
// Wall Engine - Wall creation and management
// ============================================

import type { Wall, Vec2, Scene } from '@types';
import { vec2, geometry } from '@core/math/vector';
import { v4 as uuidv4 } from 'uuid';

export interface WallCreateOptions {
  start: Vec2;
  end: Vec2;
  height?: number;
  thickness?: number;
  color?: string;
  material?: string;
}

export interface WallIntersection {
  point: Vec2;
  wall1Id: string;
  wall2Id: string;
  t1: number;
  t2: number;
}

export interface WallConnection {
  wallId: string;
  point: Vec2;
  isStart: boolean;
}

export class WallEngine {
  private walls: Map<string, Wall> = new Map();
  private tolerance: number = 0.01;

  constructor(walls: Wall[] = []) {
    walls.forEach(wall => this.walls.set(wall.id, wall));
  }

  // Wall creation
  create(options: WallCreateOptions): Wall {
    const wall: Wall = {
      id: uuidv4(),
      start: [...options.start],
      end: [...options.end],
      height: options.height ?? 2.8,
      thickness: options.thickness ?? 0.15,
      color: options.color ?? '#e2e8f0',
      material: options.material ?? 'paint-white',
      startConnected: false,
      endConnected: false,
      connectedWalls: { start: [], end: [] },
      roomIds: [],
      openingIds: [],
      visible: true,
      locked: false,
      metadata: { isExternal: false },
    };

    this.walls.set(wall.id, wall);
    this.autoConnect(wall.id);
    
    return wall;
  }

  // Get wall by ID
  get(id: string): Wall | undefined {
    return this.walls.get(id);
  }

  // Get all walls
  getAll(): Wall[] {
    return Array.from(this.walls.values());
  }

  // Update wall
  update(id: string, updates: Partial<Wall>): Wall | null {
    const wall = this.walls.get(id);
    if (!wall) return null;

    const updated = { ...wall, ...updates };
    this.walls.set(id, updated);
    
    // Reconnect if position changed
    if (updates.start || updates.end) {
      this.updateConnections(id);
    }
    
    return updated;
  }

  // Delete wall
  delete(id: string): boolean {
    const wall = this.walls.get(id);
    if (!wall) return false;

    // Disconnect from other walls
    this.disconnectAll(id);
    
    return this.walls.delete(id);
  }

  // Split wall at point
  split(id: string, point: Vec2): [Wall, Wall] | null {
    const wall = this.walls.get(id);
    if (!wall) return null;

    const projected = geometry.projectPointOnLine(point, wall.start, wall.end);
    const t = this.getParameterOnWall(wall, projected);

    if (t <= 0.01 || t >= 0.99) return null;

    // Create two new walls
    const wall1 = this.create({
      start: wall.start,
      end: projected,
      height: wall.height,
      thickness: wall.thickness,
      color: wall.color,
      material: wall.material,
    });

    const wall2 = this.create({
      start: projected,
      end: wall.end,
      height: wall.height,
      thickness: wall.thickness,
      color: wall.color,
      material: wall.material,
    });

    // Transfer connections
    wall1.connectedWalls.start = [...wall.connectedWalls.start];
    wall2.connectedWalls.end = [...wall.connectedWalls.end];

    // Connect the split walls
    this.connect(wall1.id, wall2.id);

    // Delete original wall
    this.delete(id);

    return [wall1, wall2];
  }

  // Merge walls
  merge(wallIds: string[]): Wall | null {
    if (wallIds.length < 2) return null;

    const walls = wallIds.map(id => this.walls.get(id)).filter(Boolean) as Wall[];
    if (walls.length < 2) return null;

    // Find connected walls
    const connected = this.findConnectedChain(walls);
    if (connected.length < 2) return null;

    // Get endpoints
    const start = connected[0].start;
    const end = connected[connected.length - 1].end;

    // Create merged wall
    const merged = this.create({
      start,
      end,
      height: walls[0].height,
      thickness: walls[0].thickness,
      color: walls[0].color,
      material: walls[0].material,
    });

    // Delete original walls
    wallIds.forEach(id => this.delete(id));

    return merged;
  }

  // Connect two walls
  connect(wall1Id: string, wall2Id: string): boolean {
    const wall1 = this.walls.get(wall1Id);
    const wall2 = this.walls.get(wall2Id);
    
    if (!wall1 || !wall2 || wall1Id === wall2Id) return false;

    // Check all endpoint combinations
    const combinations = [
      { p1: wall1.start, p2: wall2.start, isStart1: true, isStart2: true },
      { p1: wall1.start, p2: wall2.end, isStart1: true, isStart2: false },
      { p1: wall1.end, p2: wall2.start, isStart1: false, isStart2: true },
      { p1: wall1.end, p2: wall2.end, isStart1: false, isStart2: false },
    ];

    for (const combo of combinations) {
      if (vec2.distance(combo.p1, combo.p2) < this.tolerance) {
        // Update connections
        const key1 = combo.isStart1 ? 'start' : 'end';
        const key2 = combo.isStart2 ? 'start' : 'end';

        if (!wall1.connectedWalls[key1].includes(wall2Id)) {
          wall1.connectedWalls[key1].push(wall2Id);
        }
        if (!wall2.connectedWalls[key2].includes(wall1Id)) {
          wall2.connectedWalls[key2].push(wall1Id);
        }

        wall1.startConnected = wall1.connectedWalls.start.length > 0;
        wall1.endConnected = wall1.connectedWalls.end.length > 0;
        wall2.startConnected = wall2.connectedWalls.start.length > 0;
        wall2.endConnected = wall2.connectedWalls.end.length > 0;

        return true;
      }
    }

    return false;
  }

  // Disconnect walls
  disconnect(wall1Id: string, wall2Id: string): boolean {
    const wall1 = this.walls.get(wall1Id);
    const wall2 = this.walls.get(wall2Id);
    
    if (!wall1 || !wall2) return false;

    wall1.connectedWalls.start = wall1.connectedWalls.start.filter(id => id !== wall2Id);
    wall1.connectedWalls.end = wall1.connectedWalls.end.filter(id => id !== wall2Id);
    wall2.connectedWalls.start = wall2.connectedWalls.start.filter(id => id !== wall1Id);
    wall2.connectedWalls.end = wall2.connectedWalls.end.filter(id => id !== wall1Id);

    wall1.startConnected = wall1.connectedWalls.start.length > 0;
    wall1.endConnected = wall1.connectedWalls.end.length > 0;
    wall2.startConnected = wall2.connectedWalls.start.length > 0;
    wall2.endConnected = wall2.connectedWalls.end.length > 0;

    return true;
  }

  // Disconnect wall from all
  disconnectAll(wallId: string): void {
    const wall = this.walls.get(wallId);
    if (!wall) return;

    const allConnections = [
      ...wall.connectedWalls.start,
      ...wall.connectedWalls.end,
    ];

    allConnections.forEach(otherId => this.disconnect(wallId, otherId));
  }

  // Auto-connect wall to nearby walls
  autoConnect(wallId: string): void {
    const wall = this.walls.get(wallId);
    if (!wall) return;

    for (const [otherId, other] of this.walls) {
      if (otherId === wallId) continue;
      this.connect(wallId, otherId);
    }
  }

  // Update connections after wall move
  updateConnections(wallId: string): void {
    this.disconnectAll(wallId);
    this.autoConnect(wallId);
  }

  // Find all intersections
  findIntersections(): WallIntersection[] {
    const intersections: WallIntersection[] = [];
    const walls = this.getAll();

    for (let i = 0; i < walls.length; i++) {
      for (let j = i + 1; j < walls.length; j++) {
        const point = geometry.lineIntersection(
          walls[i].start,
          walls[i].end,
          walls[j].start,
          walls[j].end
        );

        if (point) {
          intersections.push({
            point,
            wall1Id: walls[i].id,
            wall2Id: walls[j].id,
            t1: this.getParameterOnWall(walls[i], point),
            t2: this.getParameterOnWall(walls[j], point),
          });
        }
      }
    }

    return intersections;
  }

  // Find walls connected to a point
  findWallsAtPoint(point: Vec2, tolerance = 0.01): Wall[] {
    return this.getAll().filter(wall => 
      vec2.distance(wall.start, point) < tolerance ||
      vec2.distance(wall.end, point) < tolerance
    );
  }

  // Find walls near a point
  findWallsNearPoint(point: Vec2, tolerance = 0.1): Wall[] {
    return this.getAll().filter(wall => 
      geometry.distanceToLine(point, wall.start, wall.end) < tolerance
    );
  }

  // Get parameter (0-1) of point on wall
  private getParameterOnWall(wall: Wall, point: Vec2): number {
    const dx = wall.end[0] - wall.start[0];
    const dy = wall.end[1] - wall.start[1];
    
    if (Math.abs(dx) > Math.abs(dy)) {
      return (point[0] - wall.start[0]) / dx;
    } else {
      return (point[1] - wall.start[1]) / dy;
    }
  }

  // Find connected chain of walls
  private findConnectedChain(walls: Wall[]): Wall[] {
    if (walls.length === 0) return [];
    
    const chain: Wall[] = [walls[0]];
    const remaining = new Set(walls.slice(1));
    
    while (remaining.size > 0) {
      let added = false;
      
      for (const wall of remaining) {
        const last = chain[chain.length - 1];
        
        if (vec2.distance(last.end, wall.start) < this.tolerance) {
          chain.push(wall);
          remaining.delete(wall);
          added = true;
          break;
        }
        
        if (vec2.distance(last.end, wall.end) < this.tolerance) {
          chain.push({ ...wall, start: wall.end, end: wall.start });
          remaining.delete(wall);
          added = true;
          break;
        }
      }
      
      if (!added) break;
    }
    
    return chain;
  }

  // Clear all walls
  clear(): void {
    this.walls.clear();
  }

  // Export walls array
  toArray(): Wall[] {
    return this.getAll();
  }

  // Import walls array
  fromArray(walls: Wall[]): void {
    this.walls.clear();
    walls.forEach(wall => this.walls.set(wall.id, wall));
  }
}
