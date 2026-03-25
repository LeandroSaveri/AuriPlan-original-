// WallRenderer.ts - Renderer de Paredes
// Responsabilidade: Desenhar paredes no canvas 2D

import type { Vec2 } from '../../types';

export interface Wall {
  id: string;
  start: Vec2;
  end: Vec2;
  thickness?: number;
  height?: number;
  color?: string;
}

export interface Door {
  id: string;
  wallId: string;
  position: number; // Posição ao longo da parede (0-1)
  width: number;
  height?: number;
  color?: string;
}

export interface Window {
  id: string;
  wallId: string;
  position: number; // Posição ao longo da parede (0-1)
  width: number;
  height?: number;
  sillHeight?: number;
  color?: string;
}

export class WallRenderer {
  private defaultThickness = 0.2;
  private defaultColor = '#475569';
  private selectedColor = '#3b82f6';
  private hoveredColor = '#60a5fa';

  render(
    ctx: CanvasRenderingContext2D,
    walls: Wall[],
    selectedIds: string[],
    hoveredId: string | null
  ): void {
    if (!walls || walls.length === 0) return;

    walls.forEach(wall => {
      const isSelected = selectedIds.includes(wall.id);
      const isHovered = wall.id === hoveredId;
      this.renderWall(ctx, wall, isSelected, isHovered);
    });
  }

  private renderWall(
    ctx: CanvasRenderingContext2D,
    wall: Wall,
    isSelected: boolean,
    isHovered: boolean
  ): void {
    const thickness = wall.thickness || this.defaultThickness;
    const halfThickness = thickness / 2;

    // Calcula vetor perpendicular
    const dx = wall.end[0] - wall.start[0];
    const dy = wall.end[1] - wall.start[1];
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) return;

    const perpX = (-dy / length) * halfThickness;
    const perpY = (dx / length) * halfThickness;

    // Define cor
    let color = wall.color || this.defaultColor;
    if (isSelected) color = this.selectedColor;
    else if (isHovered) color = this.hoveredColor;

    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.01;

    // Desenha a parede como um retângulo
    ctx.beginPath();
    ctx.moveTo(wall.start[0] + perpX, wall.start[1] + perpY);
    ctx.lineTo(wall.end[0] + perpX, wall.end[1] + perpY);
    ctx.lineTo(wall.end[0] - perpX, wall.end[1] - perpY);
    ctx.lineTo(wall.start[0] - perpX, wall.start[1] - perpY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Se selecionada, desenha contorno destacado
    if (isSelected) {
      ctx.strokeStyle = this.selectedColor;
      ctx.lineWidth = 0.03;
      ctx.setLineDash([0.05, 0.05]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  // Renderiza uma porta
  renderDoor(ctx: CanvasRenderingContext2D, door: Door, wall: Wall): void {
    const wallDir = [wall.end[0] - wall.start[0], wall.end[1] - wall.start[1]];
    const wallLen = Math.sqrt(wallDir[0] * wallDir[0] + wallDir[1] * wallDir[1]);
    const wallUnit = [wallDir[0] / wallLen, wallDir[1] / wallLen];

    const doorStart: Vec2 = [
      wall.start[0] + wallUnit[0] * door.position,
      wall.start[1] + wallUnit[1] * door.position
    ];
    const doorEnd: Vec2 = [
      doorStart[0] + wallUnit[0] * door.width,
      doorStart[1] + wallUnit[1] * door.width
    ];

    ctx.save();
    ctx.strokeStyle = '#8B4513';
    ctx.fillStyle = '#D2691E';
    ctx.lineWidth = 0.05;

    // Linha da porta
    ctx.beginPath();
    ctx.moveTo(doorStart[0], doorStart[1]);
    ctx.lineTo(doorEnd[0], doorEnd[1]);
    ctx.stroke();

    // Arco de abertura
    ctx.beginPath();
    ctx.arc(
      doorStart[0], 
      doorStart[1], 
      door.width, 
      Math.atan2(wallUnit[1], wallUnit[0]), 
      Math.atan2(wallUnit[1], wallUnit[0]) + Math.PI / 2
    );
    ctx.stroke();

    ctx.restore();
  }

  // Renderiza uma janela
  renderWindow(ctx: CanvasRenderingContext2D, window: Window, wall: Wall): void {
    const wallDir = [wall.end[0] - wall.start[0], wall.end[1] - wall.start[1]];
    const wallLen = Math.sqrt(wallDir[0] * wallDir[0] + wallDir[1] * wallDir[1]);
    const wallUnit = [wallDir[0] / wallLen, wallDir[1] / wallLen];

    const winStart: Vec2 = [
      wall.start[0] + wallUnit[0] * window.position,
      wall.start[1] + wallUnit[1] * window.position
    ];
    const winEnd: Vec2 = [
      winStart[0] + wallUnit[0] * window.width,
      winStart[1] + wallUnit[1] * window.width
    ];

    ctx.save();
    ctx.strokeStyle = '#87CEEB';
    ctx.fillStyle = 'rgba(135, 206, 235, 0.3)';
    ctx.lineWidth = 0.08;

    // Linha da janela
    ctx.beginPath();
    ctx.moveTo(winStart[0], winStart[1]);
    ctx.lineTo(winEnd[0], winEnd[1]);
    ctx.stroke();

    // Linhas de vidro
    ctx.lineWidth = 0.02;
    ctx.setLineDash([0.05, 0.05]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }

  // Cria uma nova parede
  createWall(
    start: Vec2, 
    end: Vec2, 
    options: { thickness?: number; height?: number; color?: string } = {}
  ): Wall {
    return {
      id: `wall_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      start,
      end,
      thickness: options.thickness || this.defaultThickness,
      height: options.height || 2.8,
      color: options.color || this.defaultColor
    };
  }

  // Hit test - verifica se ponto está próximo da parede
  hitTest(point: Vec2, walls: Wall[], threshold: number = 0.3): string | null {
    for (const wall of walls) {
      const dist = this.pointToLineDistance(
        point[0], point[1],
        wall.start[0], wall.start[1],
        wall.end[0], wall.end[1]
      );
      if (dist < threshold) {
        return wall.id;
      }
    }
    return null;
  }

  private pointToLineDistance(
    px: number, py: number,
    x1: number, y1: number,
    x2: number, y2: number
  ): number {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;
    if (param < 0) { xx = x1; yy = y1; }
    else if (param > 1) { xx = x2; yy = y2; }
    else { xx = x1 + param * C; yy = y1 + param * D; }

    return Math.hypot(px - xx, py - yy);
  }
}

export default WallRenderer;
