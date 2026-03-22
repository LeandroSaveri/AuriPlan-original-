// ============================================
// EXPORT ENGINE SERVICE - Serviço de Exportação
// ============================================

import { Project, Floor, Wall, Room, Furniture } from '@prisma/client';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export class ExportEngine {
  static toJSON(project: Project & { floors: Array<Floor & { walls: Wall[]; rooms: Room[]; furniture: Furniture[] }> }): string {
    return JSON.stringify({
      id: project.id,
      name: project.name,
      description: project.description,
      data: project.data,
      floors: project.floors.map(floor => ({
        id: floor.id,
        name: floor.name,
        level: floor.level,
        height: floor.height,
        walls: floor.walls,
        rooms: floor.rooms,
        furniture: floor.furniture,
      })),
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }

  static toOBJ(project: Project & { floors: Array<Floor & { walls: Wall[]; rooms: Room[]; furniture: Furniture[] }> }): string {
    let obj = '# AuriPlan Export\n';
    obj += `# Project: ${project.name}\n`;
    obj += `# Exported: ${new Date().toISOString()}\n\n`;

    let vertexOffset = 1;

    project.floors.forEach((floor, floorIndex) => {
      obj += `# Floor: ${floor.name}\n\n`;

      // Export walls
      floor.walls.forEach((wall, wallIndex) => {
        const start = wall.data?.start || [0, 0];
        const end = wall.data?.end || [1, 0];
        const thickness = (wall.data?.thickness || 0.15) * 10;
        const height = wall.data?.height || 2.8;

        const dx = end[0] - start[0];
        const dy = end[1] - start[1];
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        const halfThick = thickness / 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        const vertices = [
          [start[0] - halfThick * sin, 0, start[1] + halfThick * cos],
          [start[0] + halfThick * sin, 0, start[1] - halfThick * cos],
          [end[0] + halfThick * sin, 0, end[1] - halfThick * cos],
          [end[0] - halfThick * sin, 0, end[1] + halfThick * cos],
          [start[0] - halfThick * sin, height, start[1] + halfThick * cos],
          [start[0] + halfThick * sin, height, start[1] - halfThick * cos],
          [end[0] + halfThick * sin, height, end[1] - halfThick * cos],
          [end[0] - halfThick * sin, height, end[1] + halfThick * cos],
        ];

        obj += `# Wall ${wallIndex + 1}\n`;
        vertices.forEach(v => {
          obj += `v ${v[0].toFixed(4)} ${v[1].toFixed(4)} ${v[2].toFixed(4)}\n`;
        });

        const faces = [
          [1, 2, 3, 4],
          [5, 8, 7, 6],
          [1, 5, 6, 2],
          [2, 6, 7, 3],
          [3, 7, 8, 4],
          [4, 8, 5, 1],
        ];

        faces.forEach(face => {
          obj += `f ${face.map(f => f + vertexOffset - 1).join(' ')}\n`;
        });

        vertexOffset += 8;
        obj += '\n';
      });
    });

    return obj;
  }

  static floorToSVG(floor: Floor & { walls: Wall[]; rooms: Room[] }): string {
    const width = 800;
    const height = 600;
    const scale = 10;

    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" stroke-width="0.5"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="white"/>
  <rect width="100%" height="100%" fill="url(#grid)"/>`;

    // Render rooms
    floor.rooms.forEach(room => {
      const points = room.data?.points || [];
      if (points.length >= 3) {
        const pointsStr = points.map((p: number[]) => `${p[0] * scale + width/2},${p[1] * scale + height/2}`).join(' ');
        svg += `
  <polygon points="${pointsStr}" fill="${room.data?.floorColor || '#D2691E'}" 
    stroke="${room.data?.wallColor || '#F5F5DC'}" stroke-width="2" opacity="0.5"/>`;
      }
    });

    // Render walls
    floor.walls.forEach(wall => {
      const start = wall.data?.start || [0, 0];
      const end = wall.data?.end || [1, 0];
      const thickness = (wall.data?.thickness || 0.15) * 10;

      svg += `
  <line x1="${start[0] * scale + width/2}" y1="${start[1] * scale + height/2}" 
    x2="${end[0] * scale + width/2}" y2="${end[1] * scale + height/2}" 
    stroke="${wall.data?.color || '#8B4513'}" stroke-width="${thickness}" stroke-linecap="round"/>`;
    });

    svg += '\n</svg>';
    return svg;
  }

  static async generateShareToken(projectId: string, expiresIn: string): Promise<string> {
    return jwt.sign(
      { projectId, type: 'share' },
      JWT_SECRET,
      { expiresIn: expiresIn as any }
    );
  }
}
