// ============================================
// CANVAS 2D - Versão Standalone (sem engines)
// ============================================

import { useRef, useEffect, useState } from 'react';

interface Canvas2DProps {
  width?: number;
  height?: number;
}

export function Canvas2D({ width = 800, height = 600 }: Canvas2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ajusta tamanho do canvas
    canvas.width = width;
    canvas.height = height;

    // Fundo escuro
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid simples
    ctx.strokeStyle = '#2d2d3d';
    ctx.lineWidth = 1;

    const gridSize = 20;
    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Texto de exemplo
    ctx.fillStyle = '#3b82f6';
    ctx.font = '24px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Canvas2D Funcionando!', canvas.width / 2, canvas.height / 2);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px Inter, sans-serif';
    ctx.fillText('Grid: 20px | Sem engines externos', canvas.width / 2, canvas.height / 2 + 30);

    setIsReady(true);
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#0f172a',
        cursor: 'crosshair',
      }}
    />
  );
}

export default Canvas2D;
