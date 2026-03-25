// ============================================
// WallRenderer.ts
// Renderizador especializado em paredes
// Responsabilidade: Desenhar paredes com espessura, cantos arredondados, e materiais
// ============================================

import { Wall, Vec2 } from '../../types';

interface WallRenderOptions {
  showMeasurements?: boolean;
  showDirection?: boolean;
  highlightSelected?: boolean;
  opacity?: number;
}

export class WallRenderer {
  private options: WallRenderOptions = {
    showMeasurements: true,
    showDirection: false,
    highlightSelected: true,
    opacity: 1
  };

  setOptions(options: Partial<WallRenderOptions>): void {
    this.options = { ...this.options, ...options };
  }

  render(
    ctx: CanvasRenderingContext2D,
    walls: Wall[],
    selectedIds: string[],
    hoveredId?: string | null
  ): void {
    // Renderizar paredes de trás para frente (ordem z-index)
    const sortedWalls = [...walls].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    sortedWalls.forEach(wall => {
      const isSelected = selectedIds.includes(wall.id);
      const isHovered = wall.id === hoveredId;

      this.renderWallFill(ctx, wall, isSelected);
      this.renderWallStroke(ctx, wall, isSelected, isHovered);
    });

    // Renderizar medidas
    if (this.options.showMeasurements) {
      sortedWalls.forEach(wall => {
        this.renderWallMeasurements(ctx, wall);
      });
    }
  }

  private renderWallFill(
    ctx: CanvasRenderingContext2D,
    wall: Wall,
    isSelected: boolean
  ): void {
    const start = wall.start;
    const end = wall.end;
    const thickness = wall.thickness || 10;

    ctx.save();
    ctx.globalAlpha = this.options.opacity;

    // Cor base ou cor de seleção
    if (isSelected && this.options.highlightSelected) {
      ctx.fillStyle = '#3b82f6'; // blue-500
      ctx.shadowColor = '#3b82f6';
      ctx.shadowBlur = 10;
    } else {
      ctx.fillStyle = wall.color || '#374151'; // gray-700 padrão
    }

    // Desenhar retângulo da parede com rotação
    this.drawWallRectangle(ctx, start, end, thickness);

    ctx.restore();
  }

  private renderWallStroke(
    ctx: CanvasRenderingContext2D,
    wall: Wall,
    isSelected: boolean,
    isHovered: boolean
  ): void {
    const start = wall.start;
    const end = wall.end;
    const thickness = wall.thickness || 10;

    ctx.save();
    ctx.globalAlpha = this.options.opacity;

    // Linhas de contorno
    ctx.strokeStyle = isSelected
      ? '#3b82f6'
      : isHovered
      ? '#60a5fa'
      : '#1f2937';

    ctx.lineWidth = 0.5;

    this.drawWallRectangleStroke(ctx, start, end, thickness);
    
    // Linha central (eixo da parede)
    ctx.strokeStyle = isSelected ? '#93c5fd' : '#6b7280'; // blue-300 ou gray-500
    ctx.lineWidth = 0.25;
    ctx.setLineDash([5, 5]);
    
    ctx.beginPath();
    ctx.moveTo(start[0], start[1]);
    ctx.lineTo(end[0], end[1]);
    ctx.stroke();

    ctx.restore();
  }

  private renderWallMeasurements(ctx: CanvasRenderingContext2D, wall: Wall): void {
    const start = wall.start;
    const end = wall.end;
    
    // Calcular comprimento em unidades do mundo
    const length = Math.sqrt(
      Math.pow(end[0] - start[0], 2) + 
      Math.pow(end[1] - start[1], 2)
    );
    
    const midX = (start[0] + end[0]) / 2;
    const midY = (start[1] + end[1]) / 2;

    ctx.save();
    
    // Fundo da label
    const text = `${length.toFixed(2)}m`;
    ctx.font = '12px Inter, system-ui, sans-serif';
    const metrics = ctx.measureText(text);
    const padding = 4;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(
      midX - metrics.width / 2 - padding,
      midY - 10 - padding,
      metrics.width + padding * 2,
      20 + padding * 2
    );

    // Texto
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, midX, midY);

    ctx.restore();
  }

  private drawWallRectangle(
    ctx: CanvasRenderingContext2D,
    start: Vec2,
    end: Vec2,
    thickness: number
  ): void {
    const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);
    const halfThickness = thickness / 2;
    
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    // Cantos do retângulo
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

  private drawWallRectangleStroke(
    ctx: CanvasRenderingContext2D,
    start: Vec2,
    end: Vec2,
    thickness: number
  ): void {
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
    ctx.stroke();
  }

  // Método para renderizar preview durante criação
  renderPreview(
    ctx: CanvasRenderingContext2D,
    start: Vec2,
    end: Vec2,
    thickness: number = 10
  ): void {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#6b7280';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    
    this.drawWallRectangle(ctx, start, end, thickness);
    ctx.fill();
    ctx.stroke();
    
    ctx.restore();
  }
}
