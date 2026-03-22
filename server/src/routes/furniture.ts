// ============================================
// FURNITURE ROUTES - Rotas de Catálogo de Móveis
// ============================================

import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

// Get all furniture categories
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await prisma.furnitureCategory.findMany({
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

// Get furniture items
router.get('/', async (req, res, next) => {
  try {
    const { category, search, page = '1', limit = '50' } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (category) where.categoryId = category;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { tags: { has: search as string } },
      ];
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

// Get single furniture item
router.get('/:id', async (req, res, next) => {
  try {
    const item = await prisma.furnitureItem.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        materials: true,
        variants: true,
      },
    });

    if (!item) {
      return res.status(404).json({ error: 'Furniture not found' });
    }

    res.json({ item });
  } catch (error) {
    next(error);
  }
});

// Get popular items
router.get('/popular/list', async (req, res, next) => {
  try {
    const { limit = '10' } = req.query;

    const items = await prisma.furnitureItem.findMany({
      where: { isPopular: true },
      take: parseInt(limit as string),
      include: {
        category: true,
      },
    });

    res.json({ items });
  } catch (error) {
    next(error);
  }
});

export { router as furnitureRouter };
