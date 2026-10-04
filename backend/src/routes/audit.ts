import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware';

const router = Router();
const prisma = new PrismaClient();

// GET /api/audit — get audit logs (paginated)
router.get('/', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.auditLog.count(),
    ]);

    res.json({ logs, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener auditoría' });
  }
});

// GET /api/audit/recent — last 20 for notifications bell
router.get('/recent', authenticate, async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Error' });
  }
});

export default router;
