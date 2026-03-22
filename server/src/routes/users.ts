// ============================================
// USERS ROUTES - Rotas de Usuários
// ============================================

import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../db';
import { authenticate } from '../middleware/authenticate';
import bcrypt from 'bcryptjs';

const router = Router();

// Get current user profile
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            ownedProjects: true,
            collaborations: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.patch('/me', authenticate, [
  body('name').optional().trim().isLength({ min: 2 }),
  body('email').optional().isEmail().normalizeEmail(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, avatar } = req.body;

    // Check if email is already taken
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          id: { not: req.userId },
        },
      });

      if (existingUser) {
        return res.status(409).json({ error: 'Email already in use' });
      }
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        name,
        email,
        avatar,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
      },
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Change password
router.post('/me/change-password', authenticate, [
  body('currentPassword').exists(),
  body('newPassword').isLength({ min: 6 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashedPassword },
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Get user stats
router.get('/me/stats', authenticate, async (req, res, next) => {
  try {
    const [projectsCount, collaborationsCount, totalWalls, totalRooms, totalFurniture] = await Promise.all([
      prisma.project.count({ where: { ownerId: req.userId } }),
      prisma.projectCollaborator.count({ where: { userId: req.userId } }),
      prisma.wall.count({
        where: {
          floor: {
            project: {
              OR: [
                { ownerId: req.userId },
                { collaborators: { some: { userId: req.userId } } },
              ],
            },
          },
        },
      }),
      prisma.room.count({
        where: {
          floor: {
            project: {
              OR: [
                { ownerId: req.userId },
                { collaborators: { some: { userId: req.userId } } },
              ],
            },
          },
        },
      }),
      prisma.furniture.count({
        where: {
          floor: {
            project: {
              OR: [
                { ownerId: req.userId },
                { collaborators: { some: { userId: req.userId } } },
              ],
            },
          },
        },
      }),
    ]);

    res.json({
      stats: {
        projects: projectsCount,
        collaborations: collaborationsCount,
        walls: totalWalls,
        rooms: totalRooms,
        furniture: totalFurniture,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Delete account
router.delete('/me', authenticate, async (req, res, next) => {
  try {
    await prisma.user.delete({
      where: { id: req.userId },
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export { router as usersRouter };
