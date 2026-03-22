// ============================================
// PROJECTS ROUTES - Rotas de Projetos
// ============================================

import { Router } from 'express';
import { prisma } from '../db';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// Get all projects for user
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
        collaborators: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        _count: {
          select: { floors: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ projects });
  } catch (error) {
    next(error);
  }
});

// Get single project
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
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
        owner: {
          select: { id: true, name: true, email: true },
        },
        collaborators: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ project });
  } catch (error) {
    next(error);
  }
});

// Create project
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { name, description, data } = req.body;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        data: data || {},
        ownerId: req.userId,
        floors: {
          create: {
            name: 'Ground Floor',
            level: 0,
            data: {},
          },
        },
      },
      include: {
        floors: true,
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(201).json({ project });
  } catch (error) {
    next(error);
  }
});

// Update project
router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const { name, description, data } = req.body;

    const project = await prisma.project.updateMany({
      where: {
        id: req.params.id,
        OR: [
          { ownerId: req.userId },
          { collaborators: { some: { userId: req.userId, role: 'editor' } } },
        ],
      },
      data: {
        name,
        description,
        data,
        updatedAt: new Date(),
      },
    });

    if (project.count === 0) {
      return res.status(404).json({ error: 'Project not found or no permission' });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Delete project
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const project = await prisma.project.deleteMany({
      where: {
        id: req.params.id,
        ownerId: req.userId,
      },
    });

    if (project.count === 0) {
      return res.status(404).json({ error: 'Project not found or no permission' });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Add collaborator
router.post('/:id/collaborators', authenticate, async (req, res, next) => {
  try {
    const { email, role } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const project = await prisma.project.findFirst({
      where: { id: req.params.id, ownerId: req.userId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const collaborator = await prisma.projectCollaborator.create({
      data: {
        projectId: req.params.id,
        userId: user.id,
        role: role || 'viewer',
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(201).json({ collaborator });
  } catch (error) {
    next(error);
  }
});

export { router as projectsRouter };
