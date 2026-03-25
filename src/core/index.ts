// ============================================
// geometry.ts
// Funções geométricas utilitárias
// Responsabilidade: Cálculos geométricos 2D (distância, interseção, projeção)
// ============================================

import { Vec2 } from '../../types';

/**
 * Calcula a distância entre dois pontos
 */
export function distance(a: Vec2, b: Vec2): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calcula a distância quadrada (mais rápido, útil para comparações)
 */
export function distanceSquared(a: Vec2, b: Vec2): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  return dx * dx + dy * dy;
}

/**
 * Calcula o ponto médio entre dois pontos
 */
export function midpoint(a: Vec2, b: Vec2): Vec2 {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

/**
 * Projeta um ponto em uma linha (retorna o ponto mais próximo na linha)
 */
export function projectPointOnLine(point: Vec2, lineStart: Vec2, lineEnd: Vec2): Vec2 {
  const [x, y] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;

  const dx = x2 - x1;
  const dy = y2 - y1;

  if (dx === 0 && dy === 0) {
    return lineStart;
  }

  const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);

  if (t < 0) {
    return lineStart;
  } else if (t > 1) {
    return lineEnd;
  }

  return [x1 + t * dx, y1 + t * dy];
}

/**
 * Calcula a distância de um ponto a uma linha
 */
export function pointToLineDistance(point: Vec2, lineStart: Vec2, lineEnd: Vec2): number {
  const projected = projectPointOnLine(point, lineStart, lineEnd);
  return distance(point, projected);
}

/**
 * Verifica se duas linhas se intersectam e retorna o ponto de interseção
 */
export function lineIntersection(
  a1: Vec2,
  a2: Vec2,
  b1: Vec2,
  b2: Vec2
): Vec2 | null {
  const [x1, y1] = a1;
  const [x2, y2] = a2;
  const [x3, y3] = b1;
  const [x4, y4] = b2;

  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

  if (Math.abs(denom) < 1e-10) {
    return null; // Linhas paralelas
  }

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)];
  }

  return null;
}

/**
 * Verifica se um ponto está dentro de um polígono (ray casting algorithm)
 */
export function pointInPolygon(point: Vec2, polygon: Vec2[]): boolean {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Calcula a área de um polígono (fórmula de shoelace)
 */
export function polygonArea(polygon: Vec2[]): number {
  if (polygon.length < 3) return 0;

  let area = 0;

  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    area += polygon[i][0] * polygon[j][1];
    area -= polygon[j][0] * polygon[i][1];
  }

  return Math.abs(area) / 2;
}

/**
 * Calcula o centróide (centro de massa) de um polígono
 */
export function polygonCentroid(polygon: Vec2[]): Vec2 {
  if (polygon.length === 0) return [0, 0];

  let x = 0;
  let y = 0;

  for (const [px, py] of polygon) {
    x += px;
    y += py;
  }

  return [x / polygon.length, y / polygon.length];
}

/**
 * Normaliza um vetor (retorna vetor unitário)
 */
export function normalize(v: Vec2): Vec2 {
  const [x, y] = v;
  const len = Math.sqrt(x * x + y * y);

  if (len === 0) {
    return [0, 0];
  }

  return [x / len, y / len];
}

/**
 * Calcula o produto escalar de dois vetores
 */
export function dot(a: Vec2, b: Vec2): number {
  return a[0] * b[0] + a[1] * b[1];
}

/**
 * Calcula o produto vetorial 2D (z-component)
 */
export function cross(a: Vec2, b: Vec2): number {
  return a[0] * b[1] - a[1] * b[0];
}

/**
 * Adiciona dois vetores
 */
export function add(a: Vec2, b: Vec2): Vec2 {
  return [a[0] + b[0], a[1] + b[1]];
}

/**
 * Subtrai dois vetores
 */
export function subtract(a: Vec2, b: Vec2): Vec2 {
  return [a[0] - b[0], a[1] - b[1]];
}

/**
 * Multiplica um vetor por um escalar
 */
export function multiply(v: Vec2, scalar: number): Vec2 {
  return [v[0] * scalar, v[1] * scalar];
}

/**
 * Calcula o ângulo entre dois vetores (em radianos)
 */
export function angleBetween(a: Vec2, b: Vec2): number {
  const dotProduct = dot(a, b);
  const lenA = Math.sqrt(a[0] * a[0] + a[1] * a[1]);
  const lenB = Math.sqrt(b[0] * b[0] + b[1] * b[1]);

  if (lenA === 0 || lenB === 0) {
    return 0;
  }

  return Math.acos(Math.max(-1, Math.min(1, dotProduct / (lenA * lenB))));
}

/**
 * Rotaciona um ponto em torno de um centro
 */
export function rotatePoint(point: Vec2, center: Vec2, angle: number): Vec2 {
  const [x, y] = point;
  const [cx, cy] = center;

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const dx = x - cx;
  const dy = y - cy;

  return [
    cx + dx * cos - dy * sin,
    cy + dx * sin + dy * cos
  ];
}

/**
 * Verifica se dois segmentos de linha se intersectam
 */
export function segmentsIntersect(a1: Vec2, a2: Vec2, b1: Vec2, b2: Vec2): boolean {
  return lineIntersection(a1, a2, b1, b2) !== null;
}

/**
 * Calcula o bounding box de um conjunto de pontos
 */
export function boundingBox(points: Vec2[]): { min: Vec2; max: Vec2 } {
  if (points.length === 0) {
    return { min: [0, 0], max: [0, 0] };
  }

  let minX = points[0][0];
  let minY = points[0][1];
  let maxX = points[0][0];
  let maxY = points[0][1];

  for (const [x, y] of points) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  return { min: [minX, minY], max: [maxX, maxY] };
}

/**
 * Verifica se dois bounding boxes se intersectam
 */
export function boundingBoxesIntersect(
  a: { min: Vec2; max: Vec2 },
  b: { min: Vec2; max: Vec2 }
): boolean {
  return !(
    a.max[0] < b.min[0] ||
    a.min[0] > b.max[0] ||
    a.max[1] < b.min[1] ||
    a.min[1] > b.max[1]
  );
}
