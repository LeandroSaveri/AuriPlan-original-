// ============================================
// GridRenderer.ts
// Renderizador de grade/snap grid
// Responsabilidade: Desenhar grid dinâmico que se adapta ao zoom
// ============================================

interface GridOptions {
  majorGridSize?: number;
  minorGridSize?: number;
  showAxes?: boolean;
  majorColor?: string;
  minorColor?: string;
  axisColor?: string;
}

export class GridRenderer {
  private options: GridOptions = {
    majorGridSize: 1,
    minorGridSize: 0.1,
    showAxes: true,
    majorColor: 'rgba(148, 163, 184, 0.3)',
    minorColor: 'rgba(203, 213, 225, 0.15)',
    axisColor: 'rgba(239, 68, 68, 0.5)'
  };

  setOptions(options: Partial<GridOptions>): void {
    this.options = { ...this.options, ...options };
  }

  render(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    scale: number,
    offset: [number, number]
  ): void {
    const gridInfo = this.calculateAdaptiveGrid(scale);

    ctx.save();

    // Grid menor (fundo)
    this.renderGridLevel(
      ctx,
      canvasWidth,
      canvasHeight,
      gridInfo.minorStep,
      this.options.minorColor!,
      1,
      scale,
      offset
    );

    // Grid principal
    this.renderGridLevel(
      ctx,
      canvasWidth,
      canvasHeight,
      gridInfo.majorStep,
      this.options.majorColor!,
      1.5,
      scale,
      offset
    );

    // Eixos
    if (this.options.showAxes) {
      this.renderAxes(ctx, canvasWidth, canvasHeight, scale, offset);
    }

    ctx.restore();
  }

  private calculateAdaptiveGrid(scale: number): { majorStep: number; minorStep: number } {
    const baseMajor = this.options.majorGridSize || 1;
    const baseMinor = this.options.minorGridSize || 0.1;
    const pixelsPerMeter = scale;

    if (pixelsPerMeter < 10) {
      return { majorStep: baseMajor * 10, minorStep: baseMajor * 5 };
    } else if (pixelsPerMeter < 50) {
      return { majorStep: baseMajor * 5, minorStep: baseMajor };
    } else if (pixelsPerMeter < 100) {
      return { majorStep: baseMajor, minorStep: baseMajor / 2 };
    } else if (pixelsPerMeter < 500) {
      return { majorStep: baseMajor, minorStep: baseMinor };
    } else {
      return { majorStep: baseMajor / 2, minorStep: baseMinor / 2 };
    }
  }

  private renderGridLevel(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    step: number,
    color: string,
    lineWidth: number,
    scale: number,
    offset: [number, number]
  ): void {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;

    const stepPx = step * scale;
    const startX = offset[0] % stepPx;
    const startY = offset[1] % stepPx;

    ctx.beginPath();

    for (let x = startX; x < width; x += stepPx) {
      if (x >= 0) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
    }

    for (let y = startY; y < height; y += stepPx) {
      if (y >= 0) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
    }

    ctx.stroke();
  }

  private renderAxes(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    scale: number,
    offset: [number, number]
  ): void {
    ctx.strokeStyle = this.options.axisColor!;
    ctx.lineWidth = 2;

    const y0 = offset[1];
    if (y0 >= 0 && y0 <= height) {
      ctx.beginPath();
      ctx.moveTo(0, y0);
      ctx.lineTo(width, y0);
      ctx.stroke();
    }

    const x0 = offset[0];
    if (x0 >= 0 && x0 <= width) {
      ctx.beginPath();
      ctx.moveTo(x0, 0);
      ctx.lineTo(x0, height);
      ctx.stroke();
    }

    if (x0 >= 0 && x0 <= width && y0 >= 0 && y0 <= height) {
      ctx.fillStyle = this.options.axisColor!;
      ctx.beginPath();
      ctx.arc(x0, y0, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  screenToGrid(
    screenPoint: [number, number],
    scale: number,
    offset: [number, number]
  ): [number, number] {
    const worldX = (screenPoint[0] - offset[0]) / scale;
    const worldY = (screenPoint[1] - offset[1]) / scale;
    const snapSize = this.options.minorGridSize || 0.1;

    return [
      Math.round(worldX / snapSize) * snapSize,
      Math.round(worldY / snapSize) * snapSize
    ];
  }
}
