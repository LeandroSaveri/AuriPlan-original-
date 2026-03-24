// ============================================
// PROJECTS ROUTES - Rotas de Projetos
// ============================================

import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../db/index.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

// Get all projects for current user
router.get('/', authenticate, async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: req.userId },
          { collaborators: { some: { userId: req.userId } } },
        ],
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { collaborators: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ projects });
  } catch (error) {
    next(error);
  }
});

export { router as projectsRouter };
