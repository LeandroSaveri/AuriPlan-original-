// ============================================
// CollisionRenderer.ts
// Renderizador de debug de colisões
// Responsabilidade: Visualizar áreas de colisão e interseções (debug)
// ============================================

import { Wall, Vec2 } from '../../types';

interface CollisionRenderOptions {
  showCollisionAreas?: boolean;
  showIntersections?: boolean;
  collisionColor?: string;
  intersectionColor?: string;
  showDistance?: boolean;
}

export class CollisionRenderer {
  private options: CollisionRenderOptions = {
    showCollisionAreas: true,
    showIntersections: true,
    collisionColor: 'rgba(239, 68, 68, 0.3)',
    intersectionColor: 'rgba(245, 158, 11, 0.8)',
    showDistance: true
  };

  private collisions: Array<{
    type: 'wall-wall' | 'wall-room' | 'room-room';
    items: string[];
    point?: Vec2;
    distance?: number;
  }> = [];

  setOptions(options: Partial<CollisionRenderOptions>): void {
    this.options = { ...this.options, ...options };
  }

  setCollisions(collisions: typeof this.collisions): void {
    this.collisions = collisions;
  }

  addCollision(collision: typeof this.collisions[0]): void {
    this.collisions.push(collision);
  }

  clearCollisions(): void {
    this.collisions = [];
  }

  render(ctx: CanvasRenderingContext2D, walls: Wall[] = []): void {
    ctx.save();

    if (this.options.showCollisionAreas) {
      walls.forEach(wall => {
        this.renderWallCollisionArea(ctx, wall);
      });
    }

    if (this.options.showIntersections) {
      this.collisions.forEach(collision => {
        if (collision.point) {
          this.renderIntersectionPoint(ctx, collision.point, collision.distance);
        }
      });

      this.renderRealtimeIntersections(ctx, walls);
    }

    ctx.restore();
  }

  private renderWallCollisionArea(ctx: CanvasRenderingContext2D, wall: Wall): void {
    const start = wall.start;
    const end = wall.end;
    const thickness = (wall.thickness || 10) + 4;

    ctx.fillStyle = this.options.collisionColor!;

    const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);
    const halfThickness = thickness / 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const p1: Vec2 = [
      start[0] - halfThickness * sin,
      start[1] + halfThickness * cos
    ];
    const p2: Vec2 = [
      start[0] + halfThickness * sin,
      start[1] - halfThickness * cos
    ];
    const p3: Vec2 = [
      end[0] + halfThickness * sin,
      end[1] - halfThickness * cos
    ];
    const p4: Vec2 = [
      end[0] - halfThickness * sin,
      end[1] + halfThickness * cos
    ];

    ctx.beginPath();
    ctx.moveTo(p1[0], p1[1]);
    ctx.lineTo(p2[0], p2[1]);
    ctx.lineTo(p3[0], p3[1]);
    ctx.lineTo(p4[0], p4[1]);
    ctx.closePath();
    ctx.fill();
  }

  private renderIntersectionPoint(
    ctx: CanvasRenderingContext2D,
    point: Vec2,
    distance?: number
  ): void {
    const [x, y] = point;
    const radius = 6;

    ctx.fillStyle = this.options.intersectionColor!;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x - radius * 0.5, y - radius * 0.5);
    ctx.lineTo(x + radius * 0.5, y + radius * 0.5);
    ctx.moveTo(x + radius * 0.5, y - radius * 0.5);
    ctx.lineTo(x - radius * 0.5, y + radius * 0.5);
    ctx.stroke();

    if (this.options.showDistance && distance !== undefined) {
      ctx.fillStyle = this.options.intersectionColor!;
      ctx.font = '10px Inter, system-ui, sans-serif';
      ctx.fillText(`${distance.toFixed(2)}m`, x + radius + 4, y);
    }
  }

  private renderRealtimeIntersections(ctx: CanvasRenderingContext2D, walls: Wall[]): void {
    for (let i = 0; i < walls.length; i++) {
      for (let j = i + 1; j < walls.length; j++) {
        const intersection = this.getWallIntersection(walls[i], walls[j]);
        if (intersection) {
          this.renderIntersectionPoint(ctx, intersection);
        }
      }
    }
  }

  private getWallIntersection(wall1: Wall, wall2: Wall): Vec2 | null {
    const [x1, y1] = wall1.start;
    const [x2, y2] = wall1.end;
    const [x3, y3] = wall2.start;
    const [x4, y4] = wall2.end;

    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

    if (Math.abs(denom) < 1e-10) return null;

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)];
    }

    return null;
  }

  checkPointWallCollision(point: Vec2, wall: Wall, threshold: number = 0.5): boolean {
    const dist = this.pointToLineDistance(point, wall.start, wall.end);
    const halfThickness = (wall.thickness || 10) / 2 + threshold;
    return dist <= halfThickness;
  }

  private pointToLineDistance(point: Vec2, lineStart: Vec2, lineEnd: Vec2): number {
    const [px, py] = point;
    const [x1, y1] = lineStart;
    const [x2, y2] = lineEnd;

    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;

    return Math.sqrt(dx * dx + dy * dy);
  }
}
