// ============================================
// EXPORT ROUTES - Rotas de Exportação
// ============================================

import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { ExportEngine } from '../services/ExportEngine';

const router = Router();

// Export project to various formats
router.post('/:projectId', authenticate, async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { format, options = {} } = req.body;

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

    switch (format) {
      case 'json':
        const json = ExportEngine.toJSON(project);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${project.name}.json"`);
        res.send(json);
        break;

      case 'obj':
        const obj = ExportEngine.toOBJ(project);
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${project.name}.obj"`);
        res.send(obj);
        break;

      case 'svg':
        const floor = project.floors[0];
        if (!floor) {
          return res.status(400).json({ error: 'No floors to export' });
        }
        const svg = ExportEngine.floorToSVG(floor);
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Content-Disposition', `attachment; filename="${project.name}.svg"`);
        res.send(svg);
        break;

      default:
        res.status(400).json({ error: 'Unsupported format' });
    }
  } catch (error) {
    next(error);
  }
});

// Generate shareable link
router.post('/:projectId/share', authenticate, async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { expiresIn = '7d' } = req.body;

    const shareToken = await ExportEngine.generateShareToken(projectId, expiresIn);

    res.json({
      shareUrl: `${process.env.CLIENT_URL}/share/${shareToken}`,
      expiresAt: new Date(Date.now() + parseExpiresIn(expiresIn)),
    });
  } catch (error) {
    next(error);
  }
});

function parseExpiresIn(expiresIn: string): number {
  const units: Record<string, number> = {
    d: 24 * 60 * 60 * 1000,
    h: 60 * 60 * 1000,
    m: 60 * 1000,
  };

  const match = expiresIn.match(/^(\d+)([dhm])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;

  const [, value, unit] = match;
  return parseInt(value) * (units[unit] || units.d);
}

export { router as exportRouter };
