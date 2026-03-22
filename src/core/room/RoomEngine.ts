// ============================================
// Room Engine - Room detection and management
// ============================================

import type { Room, Wall, Vec2, RoomType } from '@types';
import { vec2, geometry } from '@core/math/vector';
import { v4 as uuidv4 } from 'uuid';

export interface RoomCreateOptions {
  points: Vec2[];
  name?: string;
  type?: RoomType;
  height?: number;
  wallColor?: string;
  floorColor?: string;
}

export interface RoomDetectionResult {
  rooms: Room[];
  orphanedWalls: string[];
}

export class RoomEngine {
  private rooms: Map<string, Room> = new Map();
  private tolerance: number = 0.01;

  constructor(rooms: Room[] = []) {
    rooms.forEach(room => this.rooms.set(room.id, room));
  }

  // Room creation
  create(options: RoomCreateOptions): Room {
    const room: Room = {
      id: uuidv4(),
      name: options.name || 'Room',
      type: options.type || 'custom',
      points: options.points.map(p => [...p]),
      height: options.height ?? 2.8,
      wallColor: options.wallColor ?? '#e2e8f0',
      floorColor: options.floorColor ?? '#d4a574',
      ceilingColor: '#ffffff',
      wallMaterial: 'paint-white',
      floorMaterial: 'wood-oak',
      ceilingMaterial: 'paint-white',
      area: geometry.polygonArea(options.points),
      perimeter: geometry.polygonPerimeter(options.points),
      wallIds: [],
      visible: true,
      locked: false,
      metadata: {},
    };

    this.rooms.set(room.id, room);
    return room;
  }

  // Get room by ID
  get(id: string): Room | undefined {
    return this.rooms.get(id);
  }

  // Get all rooms
  getAll(): Room[] {
    return Array.from(this.rooms.values());
  }

  // Update room
  update(id: string, updates: Partial<Room>): Room | null {
    const room = this.rooms.get(id);
    if (!room) return null;

    const updated = { ...room, ...updates };
    
    // Recalculate area and perimeter if points changed
    if (updates.points) {
      updated.area = geometry.polygonArea(updated.points);
      updated.perimeter = geometry.polygonPerimeter(updated.points);
    }

    this.rooms.set(id, updated);
    return updated;
  }

  // Delete room
  delete(id: string): boolean {
    return this.rooms.delete(id);
  }

  // Detect rooms from walls using graph traversal
  detectRooms(walls: Wall[]): RoomDetectionResult {
    const detectedRooms: Room[] = [];
    const usedWalls = new Set<string>();

    // Build adjacency graph
    const graph = this.buildWallGraph(walls);

    // Find cycles in the graph
    const cycles = this.findCycles(graph, walls);

    // Convert cycles to rooms
    for (const cycle of cycles) {
      const points = this.cycleToPoints(cycle, walls);
      
      if (points.length >= 3) {
        // Check if room is valid (convex or concave polygon)
        const area = geometry.polygonArea(points);
        
        if (area > 0.1) { // Minimum room area
          const room = this.create({
            points,
            name: `Room ${detectedRooms.length + 1}`,
            type: this.inferRoomType(points, walls),
          });

          room.wallIds = cycle;
          detectedRooms.push(room);
          
          cycle.forEach(id => usedWalls.add(id));
        }
      }
    }

    const orphanedWalls = walls
      .filter(w => !usedWalls.has(w.id))
      .map(w => w.id);

    return { rooms: detectedRooms, orphanedWalls };
  }

  // Auto-detect and update rooms
  autoDetect(walls: Wall[]): Room[] {
    const { rooms } = this.detectRooms(walls);
    
    // Clear existing rooms
    this.rooms.clear();
    
    // Add detected rooms
    rooms.forEach(room => this.rooms.set(room.id, room));
    
    return rooms;
  }

  // Find room at point
  findRoomAtPoint(point: Vec2): Room | undefined {
    return this.getAll().find(room => 
      geometry.pointInPolygon(point, room.points)
    );
  }

  // Find rooms containing wall
  findRoomsWithWall(wallId: string): Room[] {
    return this.getAll().filter(room => 
      room.wallIds.includes(wallId)
    );
  }

  // Merge adjacent rooms
  merge(roomIds: string[]): Room | null {
    if (roomIds.length < 2) return null;

    const rooms = roomIds.map(id => this.rooms.get(id)).filter(Boolean) as Room[];
    if (rooms.length < 2) return null;

    // Combine points (simplified - would need proper polygon union)
    const allPoints = rooms.flatMap(r => r.points);
    const mergedPoints = this.simplifyPolygon(allPoints);

    const merged = this.create({
      points: mergedPoints,
      name: rooms[0].name,
      type: rooms[0].type,
      height: rooms[0].height,
      wallColor: rooms[0].wallColor,
      floorColor: rooms[0].floorColor,
    });

    // Delete original rooms
    roomIds.forEach(id => this.delete(id));

    return merged;
  }

  // Split room
  split(roomId: string, splitLine: [Vec2, Vec2]): [Room, Room] | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    // Find intersection points with room boundary
    const intersections: Vec2[] = [];
    
    for (let i = 0; i < room.points.length; i++) {
      const j = (i + 1) % room.points.length;
      const intersection = geometry.lineIntersection(
        room.points[i],
        room.points[j],
        splitLine[0],
        splitLine[1]
      );
      
      if (intersection) {
        intersections.push(intersection);
      }
    }

    if (intersections.length !== 2) return null;

    // Create two new polygons (simplified)
    // In a real implementation, this would properly split the polygon

    return null;
  }

  // Calculate room statistics
  getStatistics(): {
    totalArea: number;
    totalPerimeter: number;
    roomCount: number;
    averageArea: number;
  } {
    const rooms = this.getAll();
    const totalArea = rooms.reduce((sum, r) => sum + r.area, 0);
    const totalPerimeter = rooms.reduce((sum, r) => sum + r.perimeter, 0);
    
    return {
      totalArea,
      totalPerimeter,
      roomCount: rooms.length,
      averageArea: rooms.length > 0 ? totalArea / rooms.length : 0,
    };
  }

  // Build wall adjacency graph
  private buildWallGraph(walls: Wall[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    // Initialize graph
    walls.forEach(wall => graph.set(wall.id, []));

    // Find connections
    for (let i = 0; i < walls.length; i++) {
      for (let j = i + 1; j < walls.length; j++) {
        const w1 = walls[i];
        const w2 = walls[j];

        // Check if walls share an endpoint
        const connected = 
          vec2.distance(w1.start, w2.start) < this.tolerance ||
          vec2.distance(w1.start, w2.end) < this.tolerance ||
          vec2.distance(w1.end, w2.start) < this.tolerance ||
          vec2.distance(w1.end, w2.end) < this.tolerance;

        if (connected) {
          graph.get(w1.id)?.push(w2.id);
          graph.get(w2.id)?.push(w1.id);
        }
      }
    }

    return graph;
  }

  // Find all cycles in graph
  private findCycles(graph: Map<string, string[]>, walls: Wall[]): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();

    const dfs = (
      node: string,
      path: string[],
      start: string,
      depth: number
    ): void => {
      if (depth > 50) return; // Prevent infinite loops

      const neighbors = graph.get(node) || [];

      for (const neighbor of neighbors) {
        if (neighbor === start && path.length >= 3) {
          // Found a cycle
          const cycle = [...path, start];
          
          // Check if cycle is unique
          const normalized = this.normalizeCycle(cycle);
          const isUnique = !cycles.some(c => 
            this.cyclesEqual(this.normalizeCycle(c), normalized)
          );
          
          if (isUnique) {
            cycles.push(cycle);
          }
          continue;
        }

        if (!path.includes(neighbor)) {
          dfs(neighbor, [...path, neighbor], start, depth + 1);
        }
      }
    };

    for (const [node] of graph) {
      if (!visited.has(node)) {
        dfs(node, [node], node, 0);
      }
    }

    // Filter out nested cycles (keep only outer boundaries)
    return this.filterNestedCycles(cycles);
  }

  // Normalize cycle for comparison
  private normalizeCycle(cycle: string[]): string[] {
    // Rotate to start with smallest ID
    const minIndex = cycle.indexOf(Math.min(...cycle) as unknown as string);
    const rotated = [...cycle.slice(minIndex), ...cycle.slice(0, minIndex)];
    
    // Also check reversed
    const reversed = [...rotated].reverse();
    const reversedMinIndex = reversed.indexOf(Math.min(...reversed) as unknown as string);
    const reversedRotated = [...reversed.slice(reversedMinIndex), ...reversed.slice(0, reversedMinIndex)];
    
    // Return lexicographically smaller
    return rotated.join(',') < reversedRotated.join(',') ? rotated : reversedRotated;
  }

  // Check if two cycles are equal
  private cyclesEqual(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((id, i) => id === b[i]);
  }

  // Filter out nested cycles
  private filterNestedCycles(cycles: string[][]): string[][] {
    // Sort by length (prefer smaller cycles)
    const sorted = [...cycles].sort((a, b) => a.length - b.length);
    const result: string[][] = [];

    for (const cycle of sorted) {
      // Check if this cycle is contained within any already selected cycle
      const isNested = result.some(selected => 
        this.isCycleNested(cycle, selected)
      );

      if (!isNested) {
        result.push(cycle);
      }
    }

    return result;
  }

  // Check if cycle A is nested within cycle B
  private isCycleNested(a: string[], b: string[]): boolean {
    // Simplified check - would need proper polygon containment test
    return a.every(id => b.includes(id)) && a.length < b.length;
  }

  // Convert wall cycle to room points
  private cycleToPoints(cycle: string[], walls: Wall[]): Vec2[] {
    const points: Vec2[] = [];
    const wallMap = new Map(walls.map(w => [w.id, w]));

    for (let i = 0; i < cycle.length - 1; i++) {
      const wall1 = wallMap.get(cycle[i]);
      const wall2 = wallMap.get(cycle[i + 1]);

      if (wall1 && wall2) {
        // Find shared endpoint
        if (vec2.distance(wall1.end, wall2.start) < this.tolerance) {
          points.push(wall1.start);
        } else if (vec2.distance(wall1.start, wall2.end) < this.tolerance) {
          points.push(wall1.end);
        } else if (vec2.distance(wall1.end, wall2.end) < this.tolerance) {
          points.push(wall1.start);
        } else {
          points.push(wall1.end);
        }
      }
    }

    return points;
  }

  // Infer room type from shape and context
  private inferRoomType(points: Vec2[], walls: Wall[]): RoomType {
    const area = geometry.polygonArea(points);
    const bounds = geometry.boundingBox(points);
    const width = bounds.max[0] - bounds.min[0];
    const height = bounds.max[1] - bounds.min[1];
    const aspectRatio = width / height;

    // Simple heuristics
    if (area < 4) return 'closet';
    if (area > 30) return 'living';
    if (aspectRatio > 2 || aspectRatio < 0.5) return 'hallway';
    if (area < 8) return 'bathroom';
    if (area < 15) return 'bedroom';

    return 'custom';
  }

  // Simplify polygon (remove collinear points)
  private simplifyPolygon(points: Vec2[]): Vec2[] {
    if (points.length < 3) return points;

    const simplified: Vec2[] = [points[0]];

    for (let i = 1; i < points.length; i++) {
      const prev = simplified[simplified.length - 1];
      const curr = points[i];
      const next = points[(i + 1) % points.length];

      // Check if current point is collinear
      const area = Math.abs(
        (curr[0] - prev[0]) * (next[1] - prev[1]) -
        (curr[1] - prev[1]) * (next[0] - prev[0])
      );

      if (area > 0.001) {
        simplified.push(curr);
      }
    }

    return simplified;
  }

  // Clear all rooms
  clear(): void {
    this.rooms.clear();
  }

  // Export rooms array
  toArray(): Room[] {
    return this.getAll();
  }

  // Import rooms array
  fromArray(rooms: Room[]): void {
    this.rooms.clear();
    rooms.forEach(room => this.rooms.set(room.id, room));
  }
}
