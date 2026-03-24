// ============================================
// FURNITURE ROUTES - Rotas de Móveis
// ============================================

import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../db/index.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

// Get furniture library
router.get('/library', async (req, res, next) => {
  try {
    const furniture = await prisma.furnitureLibrary.findMany({
      orderBy: { category: 'asc' },
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
    const furniture = await prisma.furnitureLibrary.findUnique({
      where: { id },
    });

    if (!furniture) {
      return res.status(404).json({ error: 'Furniture not found' });
    }

    res.json({ furniture });
  } catch (error) {
    next(error);
  }
});

export { router as furnitureRouter };
