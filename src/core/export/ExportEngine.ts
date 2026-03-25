// ============================================
// ExportEngine.ts
// Engine central de exportação
// Responsabilidade: Orquestrar diferentes formatos de exportação
// ============================================

import { ImageExporter } from './ImageExporter';
import { ModelExporter } from './ModelExporter';
import { PDFExporter } from './PDFExporter';
import { Project, Scene } from '../../types';

export type ExportFormat = 'image' | 'pdf' | 'model' | 'json';

export interface ExportOptions {
  format: ExportFormat;
  quality?: number;
  scale?: number;
  includeGrid?: boolean;
  includeMeasurements?: boolean;
  filename?: string;
}

export class ExportEngine {
  private imageExporter: ImageExporter;
  private modelExporter: ModelExporter;
  private pdfExporter: PDFExporter;

  constructor() {
    this.imageExporter = new ImageExporter();
    this.modelExporter = new ModelExporter();
    this.pdfExporter = new PDFExporter();
  }

  async export(
    scene: Scene,
    options: ExportOptions
  ): Promise<Blob | string | null> {
    const filename = options.filename || `auriplan-export-${Date.now()}`;

    switch (options.format) {
      case 'image':
        return this.exportImage(scene, options);

      case 'pdf':
        return this.exportPDF(scene, options);

      case 'model':
        return this.exportModel(scene, filename);

      case 'json':
        return this.exportJSON(scene);

      default:
        throw new Error(`Formato de exportação não suportado: ${options.format}`);
    }
  }

  private async exportImage(
    scene: Scene,
    options: ExportOptions
  ): Promise<Blob | null> {
    return this.imageExporter.export(scene, {
      quality: options.quality || 0.9,
      scale: options.scale || 2,
      includeGrid: options.includeGrid || false,
      includeMeasurements: options.includeMeasurements || true
    });
  }

  private async exportPDF(
    scene: Scene,
    options: ExportOptions
  ): Promise<Blob | null> {
    return this.pdfExporter.export(scene, {
      quality: options.quality || 0.95,
      scale: options.scale || 1.5,
      includeGrid: options.includeGrid || false,
      includeMeasurements: options.includeMeasurements || true
    });
  }

  private async exportModel(
    scene: Scene,
    filename: string
  ): Promise<Blob | null> {
    return this.modelExporter.export(scene, filename);
  }

  private exportJSON(scene: Scene): string {
    return JSON.stringify(
      {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        scene: {
          walls: scene.walls,
          rooms: scene.rooms,
          furniture: scene.furniture,
          metadata: scene.metadata
        }
      },
      null,
      2
    );
  }

  // Métodos utilitários para verificar suporte
  isFormatSupported(format: string): format is ExportFormat {
    return ['image', 'pdf', 'model', 'json'].includes(format);
  }

  getSupportedFormats(): ExportFormat[] {
    return ['image', 'pdf', 'model', 'json'];
  }

  // Download automático
  async download(
    scene: Scene,
    options: ExportOptions
  ): Promise<void> {
    const result = await this.export(scene, options);

    if (!result) {
      throw new Error('Falha ao exportar');
    }

    const blob = result instanceof Blob ? result : new Blob([result], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;

    const extension = this.getExtension(options.format);
    link.download = `${options.filename || 'export'}.${extension}`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  private getExtension(format: ExportFormat): string {
    switch (format) {
      case 'image':
        return 'png';
      case 'pdf':
        return 'pdf';
      case 'model':
        return 'obj';
      case 'json':
        return 'json';
      default:
        return 'txt';
    }
  }
}
