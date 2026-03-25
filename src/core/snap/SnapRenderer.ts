// ============================================
// SnapRenderer.ts
// Renderizador de snaps e guias
// Responsabilidade: Visualizar pontos de snap, linhas guia e indicadores
// ============================================

import { Vec2 } from '../../types';

export interface SnapIndicator {
  type: 'point' | 'line' | 'angle';
  point?: Vec2;
  lineStart?: Vec2;
  lineEnd?: Vec2;
  angle?: number;
  targetType?: string;
  priority: number;
}

interface SnapRenderOptions {
  showSnapPoints?: boolean;
  showSnapLines?: boolean;
  snapPointColor?: string;
  snapLineColor?: string;
  snapPointSize?: number;
}

export class SnapRenderer {
  private options: SnapRenderOptions = {
    showSnapPoints: true,
    showSnapLines: true,
    snapPointColor: '#10b981',
    snapLineColor: 'rgba(16, 185, 129, 0.4)',
    snapPointSize: 8
  };

  private activeIndicators: SnapIndicator[] = [];

  setOptions(options: Partial<SnapRenderOptions>): void {
    this.options = { ...this.options, ...options };
  }

  setIndicators(indicators: SnapIndicator[]): void {
    this.activeIndicators = indicators;
  }

  addIndicator(indicator: SnapIndicator): void {
    this.activeIndicators.push(indicator);
  }

  clearIndicators(): void {
    this.activeIndicators = [];
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.activeIndicators.length === 0) return;

    ctx.save();

    const sorted = [...this.activeIndicators].sort((a, b) => b.priority - a.priority);

    if (this.options.showSnapLines) {
      sorted.forEach(indicator => {
        if (indicator.type === 'line' && indicator.lineStart && indicator.lineEnd) {
          this.renderSnapLine(ctx, indicator);
        }
      });
    }

    if (this.options.showSnapPoints) {
      sorted.forEach(indicator => {
        if (indicator.type === 'point' && indicator.point) {
          this.renderSnapPoint(ctx, indicator);
        } else if (indicator.type === 'angle' && indicator.point) {
          this.renderAngleSnap(ctx, indicator);
        }
      });
    }

    ctx.restore();
  }

  private renderSnapPoint(ctx: CanvasRenderingContext2D, indicator: SnapIndicator): void {
    if (!indicator.point) return;

    const [x, y] = indicator.point;
    const size = this.options.snapPointSize || 8;

    ctx.fillStyle = this.options.snapPointColor!;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    switch (indicator.targetType) {
      case 'corner':
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x, y + size);
        ctx.lineTo(x - size, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;

      case 'center':
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x - size * 1.5, y);
        ctx.lineTo(x + size * 1.5, y);
        ctx.moveTo(x, y - size * 1.5);
        ctx.lineTo(x, y + size * 1.5);
        ctx.stroke();
        break;

      case 'midpoint':
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size, y + size);
        ctx.lineTo(x - size, y + size);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;

      default:
        ctx.beginPath();
        ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
  }

  private renderSnapLine(ctx: CanvasRenderingContext2D, indicator: SnapIndicator): void {
    if (!indicator.lineStart || !indicator.lineEnd) return;

    const [x1, y1] = indicator.lineStart;
    const [x2, y2] = indicator.lineEnd;

    ctx.strokeStyle = this.options.snapLineColor!;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.setLineDash([]);
  }

  private renderAngleSnap(ctx: CanvasRenderingContext2D, indicator: SnapIndicator): void {
    if (!indicator.point || indicator.angle === undefined) return;

    const [x, y] = indicator.point;
    const radius = 20;

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.setLineDash([2, 2]);

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, indicator.angle);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(
      x + Math.cos(indicator.angle) * radius,
      y + Math.sin(indicator.angle) * radius
    );
    ctx.stroke();

    ctx.setLineDash([]);

    ctx.fillStyle = '#f59e0b';
    ctx.font = '11px Inter, system-ui, sans-serif';
    const degrees = Math.round((indicator.angle * 180) / Math.PI);
    ctx.fillText(`${degrees}°`, x + radius + 5, y);
  }

  createPointSnap(point: Vec2, targetType: string, priority: number = 1): SnapIndicator {
    return {
      type: 'point',
      point,
      targetType,
      priority
    };
  }

  createLineSnap(start: Vec2, end: Vec2, priority: number = 1): SnapIndicator {
    return {
      type: 'line',
      lineStart: start,
      lineEnd: end,
      priority
    };
  }
}
