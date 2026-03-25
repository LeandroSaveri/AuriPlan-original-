// ============================================
// InteractionRenderer.ts
// Renderizador de interação (handles, seleção, hover)
// Responsabilidade: Visual feedback de interação do usuário
// ============================================

import { Vec2 } from '../../types';

export interface Handle {
  id: string;
  position: Vec2;
  type: 'move' | 'resize' | 'rotate' | 'vertex';
  targetId: string;
  cursor: string;
}

interface InteractionRenderOptions {
  handleSize?: number;
  selectionColor?: string;
  hoverColor?: string;
  handleColor?: string;
  showBoundingBox?: boolean;
}

export class InteractionRenderer {
  private options: InteractionRenderOptions = {
    handleSize: 8,
    selectionColor: '#3b82f6',
    hoverColor: '#60a5fa',
    handleColor: '#ffffff',
    showBoundingBox: true
  };

  private handles: Handle[] = [];
  private selectionBox: { start: Vec2; end: Vec2 } | null = null;

  setOptions(options: Partial<InteractionRenderOptions>): void {
    this.options = { ...this.options, ...options };
  }

  setHandles(handles: Handle[]): void {
    this.handles = handles;
  }

  setSelectionBox(start: Vec2 | null, end: Vec2 | null): void {
    if (start && end) {
      this.selectionBox = { start, end };
    } else {
      this.selectionBox = null;
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    selectedIds: string[],
    hoveredId?: string | null
  ): void {
    ctx.save();

    // Renderizar handles
    this.handles.forEach(handle => {
      const isHandleHovered = handle.targetId === hoveredId;
      this.renderHandle(ctx, handle, isHandleHovered);
    });

    // Renderizar caixa de seleção drag
    if (this.selectionBox) {
      this.renderSelectionBox(ctx);
    }

    ctx.restore();
  }

  private renderHandle(
    ctx: CanvasRenderingContext2D,
    handle: Handle,
    isHovered: boolean
  ): void {
    const [x, y] = handle.position;
    const size = this.options.handleSize || 8;

    ctx.fillStyle = this.options.handleColor!;
    ctx.strokeStyle = isHovered ? this.options.hoverColor! : this.options.selectionColor!;
    ctx.lineWidth = isHovered ? 3 : 2;

    switch (handle.type) {
      case 'move':
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;

      case 'resize':
        ctx.fillRect(x - size, y - size, size * 2, size * 2);
        ctx.strokeRect(x - size, y - size, size * 2, size * 2);
        break;

      case 'rotate':
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x, y, size + 4, -Math.PI / 4, Math.PI / 4);
        ctx.stroke();
        break;

      case 'vertex':
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x, y + size);
        ctx.lineTo(x - size, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
    }
  }

  private renderSelectionBox(ctx: CanvasRenderingContext2D): void {
    if (!this.selectionBox) return;

    const { start, end } = this.selectionBox;
    const x = Math.min(start[0], end[0]);
    const y = Math.min(start[1], end[1]);
    const w = Math.abs(end[0] - start[0]);
    const h = Math.abs(end[1] - start[1]);

    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = this.options.selectionColor!;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);
  }

  // Gerar handles para parede
  generateWallHandles(wallId: string, start: Vec2, end: Vec2): Handle[] {
    const handles: Handle[] = [];

    handles.push({
      id: `${wallId}-move`,
      position: [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2],
      type: 'move',
      targetId: wallId,
      cursor: 'move'
    });

    handles.push({
      id: `${wallId}-start`,
      position: start,
      type: 'vertex',
      targetId: wallId,
      cursor: 'nwse-resize'
    });

    handles.push({
      id: `${wallId}-end`,
      position: end,
      type: 'vertex',
      targetId: wallId,
      cursor: 'nwse-resize'
    });

    return handles;
  }
}
