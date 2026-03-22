// ============================================
// AI ENGINE - Motor de Inteligência Artificial
// ============================================

import { Project, Floor, Room, Furniture } from '@prisma/client';

interface DesignSuggestion {
  roomType: string;
  style: string;
  furniture: Array<{
    catalogId: string;
    name: string;
    position: [number, number, number];
    rotation: [number, number, number];
  }>;
  colors: {
    wall: string;
    floor: string;
  };
}

interface RoomDimensions {
  width: number;
  depth: number;
  height: number;
}

export class AIEngine {
  private static readonly ROOM_TEMPLATES: Record<string, string[]> = {
    living: ['sofa-3-seat-modern', 'coffee-table-wood', 'tv-stand-modern', 'armchair-modern'],
    bedroom: ['bed-queen-classic', 'nightstand-modern', 'dresser-6-drawer'],
    kitchen: ['dining-table-6', 'dining-chair-modern', 'fridge-french-door'],
    bathroom: ['vanity-unit-bath', 'toilet-modern'],
    office: ['desk-modern', 'office-chair-ergonomic', 'bookshelf-tall'],
  };

  private static readonly STYLE_COLORS: Record<string, { wall: string; floor: string }> = {
    modern: { wall: '#F5F5F5', floor: '#8B7355' },
    classic: { wall: '#FFF8DC', floor: '#654321' },
    minimalist: { wall: '#FFFFFF', floor: '#C0C0C0' },
    industrial: { wall: '#808080', floor: '#4A4A4A' },
    scandinavian: { wall: '#FAF0E6', floor: '#DEB887' },
    bohemian: { wall: '#F5DEB3', floor: '#D2691E' },
    luxury: { wall: '#F0E68C', floor: '#8B4513' },
    cozy: { wall: '#FFE4B5', floor: '#A0522D' },
  };

  static generateDesign(
    roomType: string,
    style: string,
    dimensions: RoomDimensions
  ): DesignSuggestion {
    const template = this.ROOM_TEMPLATES[roomType] || this.ROOM_TEMPLATES.living;
    const colors = this.STYLE_COLORS[style] || this.STYLE_COLORS.modern;

    const furniture: DesignSuggestion['furniture'] = [];
    const centerX = dimensions.width / 2;
    const centerZ = dimensions.depth / 2;

    // Layout furniture based on room type
    switch (roomType) {
      case 'living':
        // Sofa against the back wall
        furniture.push({
          catalogId: 'sofa-3-seat-modern',
          name: 'Sofá Moderno',
          position: [centerX, 0, dimensions.depth * 0.2],
          rotation: [0, 0, 0],
        });
        // Coffee table in center
        furniture.push({
          catalogId: 'coffee-table-wood',
          name: 'Mesa de Centro',
          position: [centerX, 0, centerZ],
          rotation: [0, 0, 0],
        });
        // TV stand on opposite wall
        furniture.push({
          catalogId: 'tv-stand-modern',
          name: 'Rack para TV',
          position: [centerX, 0, dimensions.depth * 0.85],
          rotation: [0, Math.PI, 0],
        });
        // Armchair on side
        furniture.push({
          catalogId: 'armchair-modern',
          name: 'Poltrona',
          position: [dimensions.width * 0.2, 0, centerZ],
          rotation: [0, Math.PI / 4, 0],
        });
        break;

      case 'bedroom':
        // Bed centered on back wall
        furniture.push({
          catalogId: 'bed-queen-classic',
          name: 'Cama Queen',
          position: [centerX, 0, dimensions.depth * 0.3],
          rotation: [0, 0, 0],
        });
        // Nightstands on each side
        furniture.push({
          catalogId: 'nightstand-modern',
          name: 'Criado-Mudo',
          position: [centerX - 1.2, 0, dimensions.depth * 0.3],
          rotation: [0, 0, 0],
        });
        furniture.push({
          catalogId: 'nightstand-modern',
          name: 'Criado-Mudo',
          position: [centerX + 1.2, 0, dimensions.depth * 0.3],
          rotation: [0, 0, 0],
        });
        // Dresser on side wall
        furniture.push({
          catalogId: 'dresser-6-drawer',
          name: 'Cômoda',
          position: [dimensions.width * 0.85, 0, centerZ],
          rotation: [0, -Math.PI / 2, 0],
        });
        break;

      case 'kitchen':
        // Dining table in center
        furniture.push({
          catalogId: 'dining-table-6',
          name: 'Mesa de Jantar',
          position: [centerX, 0, centerZ],
          rotation: [0, 0, 0],
        });
        // Chairs around table
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          furniture.push({
            catalogId: 'dining-chair-modern',
            name: 'Cadeira',
            position: [
              centerX + Math.cos(angle) * 1.5,
              0,
              centerZ + Math.sin(angle) * 1.5,
            ],
            rotation: [0, angle + Math.PI / 2, 0],
          });
        }
        // Fridge on side
        furniture.push({
          catalogId: 'fridge-french-door',
          name: 'Geladeira',
          position: [dimensions.width * 0.1, 0, dimensions.depth * 0.1],
          rotation: [0, 0, 0],
        });
        break;

      default:
        // Generic layout
        furniture.push({
          catalogId: template[0],
          name: 'Item Principal',
          position: [centerX, 0, centerZ],
          rotation: [0, 0, 0],
        });
    }

    return {
      roomType,
      style,
      furniture,
      colors,
    };
  }

  static suggestFurniturePlacement(
    existingFurniture: Furniture[],
    roomDimensions: RoomDimensions
  ): Array<{ catalogId: string; position: [number, number, number] }> {
    const suggestions: Array<{ catalogId: string; position: [number, number, number] }> = [];
    
    // Simple algorithm to find empty spaces
    const gridSize = 0.5;
    const occupied = new Set<string>();

    // Mark occupied spaces
    existingFurniture.forEach(f => {
      const data = f.data as any;
      if (data?.position) {
        const gx = Math.round(data.position[0] / gridSize);
        const gz = Math.round(data.position[2] / gridSize);
        occupied.add(`${gx},${gz}`);
      }
    });

    // Find empty spaces and suggest furniture
    for (let x = 1; x < roomDimensions.width - 1; x += 1) {
      for (let z = 1; z < roomDimensions.depth - 1; z += 1) {
        const gx = Math.round(x / gridSize);
        const gz = Math.round(z / gridSize);
        
        if (!occupied.has(`${gx},${gz}`)) {
          // Check surrounding spaces
          const hasNeighbor = 
            occupied.has(`${gx + 1},${gz}`) ||
            occupied.has(`${gx - 1},${gz}`) ||
            occupied.has(`${gx},${gz + 1}`) ||
            occupied.has(`${gx},${gz - 1}`);

          if (hasNeighbor && suggestions.length < 3) {
            suggestions.push({
              catalogId: 'plant-small-succulent',
              position: [x, 0, z],
            });
          }
        }
      }
    }

    return suggestions;
  }

  static analyzeProject(project: Project & { floors: Floor[] }): {
    totalArea: number;
    roomCount: number;
    furnitureCount: number;
    suggestions: string[];
  } {
    let totalArea = 0;
    let roomCount = 0;
    let furnitureCount = 0;
    const suggestions: string[] = [];

    project.floors.forEach(floor => {
      const data = floor.data as any;
      if (data?.rooms) {
        roomCount += data.rooms.length;
        data.rooms.forEach((room: any) => {
          totalArea += room.area || 0;
        });
      }
      if (data?.furniture) {
        furnitureCount += data.furniture.length;
      }
    });

    // Generate suggestions
    if (roomCount === 0) {
      suggestions.push('Comece criando cômodos usando a ferramenta de parede');
    }
    if (furnitureCount === 0 && roomCount > 0) {
      suggestions.push('Adicione móveis aos seus cômodos para torná-los mais realistas');
    }
    if (totalArea < 20) {
      suggestions.push('Considere adicionar mais espaço para melhor funcionalidade');
    }

    return {
      totalArea,
      roomCount,
      furnitureCount,
      suggestions,
    };
  }
}
