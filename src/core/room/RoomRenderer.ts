// RoomRenderer.ts - Renderer de Cômodos
// Responsabilidade: Desenhar cômodos no canvas 2D

import type { Vec2 } from '../../types';

export interface Room {
  id: string;
  points: Vec2[];
  color?: string;
  opacity?: number;
}

export class RoomRenderer {
  private defaultColor = '#3b82f6';
  private defaultOpacity = 0.2;

  render(
    ctx: CanvasRenderingContext2D,
    rooms: Room[],
    selectedIds: string[]
  ): void {
    if (!rooms || rooms.length === 0) return;

    rooms.forEach(room => {
      this.renderRoom(ctx, room, selectedIds.includes(room.id));
    });
  }

  private renderRoom(
    ctx: CanvasRenderingContext2D,
    room: Room,
    isSelected: boolean
  ): void {
    if (!room.points || room.points.length < 3) return;

    ctx.save();

    // Configurações de estilo
    const color = room.color || this.defaultColor;
    const opacity = room.opacity !== undefined ? room.opacity : this.defaultOpacity;

    ctx.fillStyle = this.hexToRgba(color, opacity);
    ctx.strokeStyle = isSelected ? '#3b82f6' : color;
    ctx.lineWidth = isSelected ? 0.05 : 0.03;

    // Desenha o polígono do cômodo
    ctx.beginPath();
    const [first, ...rest] = room.points;
    ctx.moveTo(first[0], first[1]);
    rest.forEach(point => ctx.lineTo(point[0], point[1]));
    ctx.closePath();

    ctx.fill();
    ctx.stroke();

    // Se selecionado, desenha handles nos vértices
    if (isSelected) {
      this.renderVertexHandles(ctx, room.points);
    }

    ctx.restore();
  }

  private renderVertexHandles(ctx: CanvasRenderingContext2D, points: Vec2[]): void {
    ctx.fillStyle = '#3b82f6';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.01;

    points.forEach(point => {
      ctx.beginPath();
      ctx.arc(point[0], point[1], 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // Método para hit test (verificar se ponto está dentro do cômodo)
  hitTest(point: Vec2, room: Room): boolean {
    if (!room.points || room.points.length < 3) return false;
    return this.pointInPolygon(point, room.points);
  }

  private pointInPolygon(point: Vec2, polygon: Vec2[]): boolean {
    let inside = false;
    const [x, y] = point;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];

      if (((yi > y) !== (yj > y)) && 
          (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }

    return inside;
  }
}

export default RoomRenderer;
