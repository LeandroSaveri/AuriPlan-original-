// ============================================
// EXPORT ROUTES - Rotas de Exportação
// ============================================

import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { ExportEngine } from '../services/ExportEngine.js';
import { prisma } from '../db/index.js';

const router = Router();

// Export project to JSON
router.get('/json/:projectId', authenticate, async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: req.userId },
          { collaborators: { some: { userId: req.userId } } },
        ],
      },
      include: {
        floors: {
          include: {
            walls: true,
            rooms: true,
            furniture: true,
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const json = ExportEngine.toJSON(project);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${project.name}.json"`);
    res.send(json);
  } catch (error) {
    next(error);
  }
});

// Export project to OBJ
router.get('/obj/:projectId', authenticate, async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: req.userId },
          { collaborators: { some: { userId: req.userId } } },
        ],
      },
      include: {
        floors: {
          include: {
            walls: true,
            rooms: true,
            furniture: true,
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const obj = ExportEngine.toOBJ(project);

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${project.name}.obj"`);
    res.send(obj);
  } catch (error) {
    next(error);
  }
});

// Export floor to SVG
router.get('/svg/:floorId', authenticate, async (req, res, next) => {
  try {
    const { floorId } = req.params;

    const floor = await prisma.floor.findFirst({
      where: {
        id: floorId,
        project: {
          OR: [
            { ownerId: req.userId },
            { collaborators: { some: { userId: req.userId } } },
          ],
        },
      },
      include: {
        walls: true,
        rooms: true,
      },
    });

    if (!floor) {
      return res.status(404).json({ error: 'Floor not found' });
    }

    const svg = ExportEngine.floorToSVG(floor);

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Content-Disposition', `attachment; filename="${floor.name}.svg"`);
    res.send(svg);
  } catch (error) {
    next(error);
  }
});

export { router as exportRouter };
