// ============================================
// CameraRenderer.ts
// Renderizador de câmera/viewport
// Responsabilidade: Visualização de viewport, culling e debug de câmera
// ============================================

interface CameraRenderOptions {
  showViewportInfo?: boolean;
  showSafeArea?: boolean;
  showCenter?: boolean;
  infoPosition?: 'tl' | 'tr' | 'bl' | 'br';
}

export class CameraRenderer {
  private options: CameraRenderOptions = {
    showViewportInfo: true,
    showSafeArea: false,
    showCenter: false,
    infoPosition: 'tl'
  };

  setOptions(options: Partial<CameraRenderOptions>): void {
    this.options = { ...this.options, ...options };
  }

  render(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    scale: number,
    offset: [number, number]
  ): void {
    ctx.save();

    if (this.options.showSafeArea) {
      this.renderSafeArea(ctx, canvasWidth, canvasHeight);
    }

    if (this.options.showCenter) {
      this.renderCenterMarker(ctx, canvasWidth, canvasHeight);
    }

    if (this.options.showViewportInfo) {
      this.renderViewportInfo(ctx, canvasWidth, canvasHeight, scale, offset);
    }

    ctx.restore();
  }

  private renderSafeArea(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    const margin = 50;

    ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);
    ctx.setLineDash([]);
  }

  private renderCenterMarker(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    const centerX = width / 2;
    const centerY = height / 2;
    const size = 20;

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(centerX - size, centerY);
    ctx.lineTo(centerX + size, centerY);
    ctx.moveTo(centerX, centerY - size);
    ctx.lineTo(centerX, centerY + size);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  private renderViewportInfo(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    scale: number,
    offset: [number, number]
  ): void {
    const lines = [
      `Zoom: ${(scale * 100).toFixed(0)}%`,
      `Offset: (${offset[0].toFixed(0)}, ${offset[1].toFixed(0)})`,
      `Canvas: ${width}x${height}`
    ];

    ctx.font = '12px Inter, system-ui, monospace';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';

    const lineHeight = 16;
    const padding = 8;
    const maxWidth = Math.max(...lines.map(l => ctx.measureText(l).width));
    const boxWidth = maxWidth + padding * 2;
    const boxHeight = lines.length * lineHeight + padding * 2;

    let x = 10;
    let y = 10;

    switch (this.options.infoPosition) {
      case 'tr':
        x = width - boxWidth - 10;
        break;
      case 'bl':
        y = height - boxHeight - 10;
        break;
      case 'br':
        x = width - boxWidth - 10;
        y = height - boxHeight - 10;
        break;
    }

    ctx.fillRect(x, y, boxWidth, boxHeight);

    ctx.fillStyle = '#10b981';
    lines.forEach((line, index) => {
      ctx.fillText(line, x + padding, y + padding + (index + 1) * lineHeight - 4);
    });
  }

  isPointVisible(
    point: [number, number],
    canvasWidth: number,
    canvasHeight: number,
    scale: number,
    offset: [number, number],
    padding: number = 0
  ): boolean {
    const screenX = point[0] * scale + offset[0];
    const screenY = point[1] * scale + offset[1];

    return (
      screenX >= -padding &&
      screenX <= canvasWidth + padding &&
      screenY >= -padding &&
      screenY <= canvasHeight + padding
    );
  }

  getVisibleBounds(
    canvasWidth: number,
    canvasHeight: number,
    scale: number,
    offset: [number, number]
  ): { min: [number, number]; max: [number, number] } {
    return {
      min: [-offset[0] / scale, -offset[1] / scale],
      max: [(canvasWidth - offset[0]) / scale, (canvasHeight - offset[1]) / scale]
    };
  }
}
