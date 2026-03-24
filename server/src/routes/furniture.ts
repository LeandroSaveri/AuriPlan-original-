// ============================================
// FURNITURE ROUTES - Rotas de Móveis
// ============================================

import { Router } from 'express';
import { prisma } from '../db/index.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

// Get furniture library (todos os itens do catálogo)
router.get('/library', async (req, res, next) => {
  try {
    const furniture = await prisma.furnitureItem.findMany({
      orderBy: { name: 'asc' },
      include: {
        category: true,
        materials: true,
      },
    });
    res.json({ furniture });
  } catch (error) {
    next(error);
  }
});

// Get furniture by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const furniture = await prisma.furnitureItem.findUnique({
      where: { id },
      include: {
        category: true,
        materials: true,
        variants: true,
      },
    });

    if (!furniture) {
      return res.status(404).json({ error: 'Furniture not found' });
    }

    res.json({ furniture });
  } catch (error) {
    next(error);
  }
});

// Get furniture categories
router.get('/categories/list', async (req, res, next) => {
  try {
    const categories = await prisma.furnitureCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });
    res.json({ categories });
  } catch (error) {
    next(error);
  }
});

// Search furniture
router.get('/search/query', async (req, res, next) => {
  try {
    const { q, category, page = '1', limit = '20' } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};

    if (q) {
      where.OR = [
        { name: { contains: q as string, mode: 'insensitive' } },
        { description: { contains: q as string, mode: 'insensitive' } },
        { tags: { has: q as string } },
      ];
    }

    if (category) {
      where.categoryId = category as string;
    }

    const [items, total] = await Promise.all([
      prisma.furnitureItem.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        include: {
          category: true,
          materials: true,
        },
        orderBy: { name: 'asc' },
      }),
      prisma.furnitureItem.count({ where }),
    ]);

    res.json({
      items,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get popular furniture
router.get('/popular/list', async (req, res, next) => {
  try {
    const { limit = '10' } = req.query;

    const items = await prisma.furnitureItem.findMany({
      where: { isPopular: true },
      take: parseInt(limit as string),
      include: {
        category: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json({ items });
  } catch (error) {
    next(error);
  }
});

export { router as furnitureRouter };
