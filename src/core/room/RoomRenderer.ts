// ============================================
// RoomRenderer.ts
// Renderizador de cômodos/rooms
// Responsabilidade: Desenhar cômodos com preenchimento, padrões e labels
// ============================================

import { Room, Vec2 } from '../../types';

interface RoomRenderOptions {
  showArea?: boolean;
  showName?: boolean;
  showDimensions?: boolean;
  opacity?: number;
  fillPattern?: 'solid' | 'hatch' | 'dots' | 'none';
}

export class RoomRenderer {
  private options: RoomRenderOptions = {
    showArea: true,
    showName: true,
    showDimensions: false,
    opacity: 0.3,
    fillPattern: 'solid'
  };

  private patterns: Map<string, CanvasPattern> = new Map();

  setOptions(options: Partial<RoomRenderOptions>): void {
    this.options = { ...this.options, ...options };
  }

  private createPatterns(ctx: CanvasRenderingContext2D): void {
    // Padrão de hachura
    const hatchCanvas = document.createElement('canvas');
    hatchCanvas.width = 10;
    hatchCanvas.height = 10;
    const hatchCtx = hatchCanvas.getContext('2d');
    if (hatchCtx) {
      hatchCtx.strokeStyle = 'rgba(0,0,0,0.1)';
      hatchCtx.lineWidth = 1;
      hatchCtx.beginPath();
      hatchCtx.moveTo(0, 10);
      hatchCtx.lineTo(10, 0);
      hatchCtx.stroke();
      const hatchPattern = ctx.createPattern(hatchCanvas, 'repeat');
      if (hatchPattern) this.patterns.set('hatch', hatchPattern);
    }

    // Padrão de pontos
    const dotsCanvas = document.createElement('canvas');
    dotsCanvas.width = 10;
    dotsCanvas.height = 10;
    const dotsCtx = dotsCanvas.getContext('2d');
    if (dotsCtx) {
      dotsCtx.fillStyle = 'rgba(0,0,0,0.2)';
      dotsCtx.beginPath();
      dotsCtx.arc(5, 5, 1, 0, Math.PI * 2);
      dotsCtx.fill();
      const dotsPattern = ctx.createPattern(dotsCanvas, 'repeat');
      if (dotsPattern) this.patterns.set('dots', dotsPattern);
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    rooms: Room[],
    selectedIds: string[]
  ): void {
    // Criar padrões se ainda não existirem
    if (this.patterns.size === 0) {
      this.createPatterns(ctx);
    }

    // Renderizar cômodos
    rooms.forEach(room => {
      const isSelected = selectedIds.includes(room.id);
      this.renderRoom(ctx, room, isSelected);
    });
  }

  private renderRoom(
    ctx: CanvasRenderingContext2D,
    room: Room,
    isSelected: boolean
  ): void {
    if (!room.points || room.points.length < 3) return;

    ctx.save();

    // Criar path do cômodo
    ctx.beginPath();
    room.points.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point[0], point[1]);
      } else {
        ctx.lineTo(point[0], point[1]);
      }
    });
    ctx.closePath();

    // Preenchimento
    this.renderFill(ctx, room, isSelected);

    // Borda
    this.renderStroke(ctx, isSelected);

    // Label central
    if (this.options.showName || this.options.showArea) {
      this.renderLabel(ctx, room);
    }

    ctx.restore();
  }

  private renderFill(
    ctx: CanvasRenderingContext2D,
    room: Room,
    isSelected: boolean
  ): void {
    const baseColor = room.color || '#94a3b8'; // slate-400
    const opacity = isSelected ? Math.min(this.options.opacity! + 0.2, 0.8) : this.options.opacity!;
    
    ctx.globalAlpha = opacity;

    if (this.options.fillPattern === 'hatch' && this.patterns.has('hatch')) {
      ctx.fillStyle = this.patterns.get('hatch')!;
      ctx.fill();
      ctx.fillStyle = baseColor;
      ctx.globalAlpha = opacity * 0.3;
      ctx.fill();
    } else if (this.options.fillPattern === 'dots' && this.patterns.has('dots')) {
      ctx.fillStyle = this.patterns.get('dots')!;
      ctx.fill();
      ctx.fillStyle = baseColor;
      ctx.globalAlpha = opacity * 0.3;
      ctx.fill();
    } else {
      // Sólido
      ctx.fillStyle = baseColor;
      ctx.fill();
    }

    // Overlay de seleção
    if (isSelected) {
      ctx.fillStyle = '#3b82f6'; // blue-500
      ctx.globalAlpha = 0.1;
      ctx.fill();
    }
  }

  private renderStroke(ctx: CanvasRenderingContext2D, isSelected: boolean): void {
    ctx.globalAlpha = 1;
    ctx.strokeStyle = isSelected ? '#3b82f6' : '#475569';
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  private renderLabel(ctx: CanvasRenderingContext2D, room: Room): void {
    // Calcular centroide
    const centroid = this.calculateCentroid(room.points!);
    
    ctx.fillStyle = '#1f2937';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let text = '';
    if (this.options.showName && room.name) {
      text = room.name;
    }
    
    if (this.options.showArea && room.area) {
      const areaText = `${room.area.toFixed(1)}m²`;
      text = text ? `${text}\n${areaText}` : areaText;
    }

    if (!text) return;

    const fontSize = 12;
    ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;

    // Fundo da label
    const lines = text.split('\n');
    const lineHeight = fontSize * 1.2;
    const totalHeight = lines.length * lineHeight;
    const maxWidth = Math.max(...lines.map(l => ctx.measureText(l).width));
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(
      centroid[0] - maxWidth / 2 - 4,
      centroid[1] - totalHeight / 2 - 2,
      maxWidth + 8,
      totalHeight + 4
    );

    // Texto
    ctx.fillStyle = '#1f2937';
    lines.forEach((line, index) => {
      const y = centroid[1] - totalHeight / 2 + (index + 0.5) * lineHeight;
      ctx.fillText(line, centroid[0], y);
    });
  }

  private calculateCentroid(points: Vec2[]): Vec2 {
    let x = 0, y = 0;
    points.forEach(p => {
      x += p[0];
      y += p[1];
    });
    return [x / points.length, y / points.length];
  }

  // Calcular área do cômodo (fórmula de shoelace)
  calculateArea(room: Room): number {
    if (!room.points || room.points.length < 3) return 0;

    let area = 0;
    const points = room.points;
    
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i][0] * points[j][1];
      area -= points[j][0] * points[i][1];
    }
    
    return Math.abs(area) / 2;
  }

  // Verificar se ponto está dentro do cômodo
  containsPoint(room: Room, point: Vec2): boolean {
    if (!room.points || room.points.length < 3) return false;

    let inside = false;
    const points = room.points;
    
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i][0], yi = points[i][1];
      const xj = points[j][0], yj = points[j][1];
      
      const intersect = ((yi > point[1]) !== (yj > point[1])) &&
        (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi);
      
      if (intersect) inside = !inside;
    }
    
    return inside;
  }
}
