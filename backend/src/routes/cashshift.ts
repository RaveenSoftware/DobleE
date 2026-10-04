import { Router, Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, resolveBranchId } from '../middleware';

const router = Router();
const prisma = new PrismaClient();

// GET active (open) cash shift for a branch
router.get('/active', authenticate, async (req: Request & { user?: any }, res) => {
  try {
    const queryBranchId = req.query.branchId as string | undefined;
    const branchId = await resolveBranchId(req, queryBranchId);
    if (!branchId) return res.json(null);

    const shift = await prisma.cashShift.findFirst({
      where: { branchId, isOpen: true },
      orderBy: { openedAt: 'desc' },
    });
    res.json(shift);
  } catch {
    res.status(500).json({ error: 'Error al obtener turno de caja' });
  }
});

// OPEN cash shift
router.post('/open', authenticate, async (req: Request & { user?: any }, res) => {
  try {
    const { initialAmount, openedBy, notes } = req.body;
    const branchId = await resolveBranchId(req, req.body.branchId);

    if (!branchId) {
      return res.status(400).json({ error: 'No hay sucursal asignada a este usuario. Contacta al administrador.' });
    }
    if (initialAmount === undefined || initialAmount === null) {
      return res.status(400).json({ error: 'El monto inicial es requerido' });
    }

    // Close any open shift first
    await prisma.cashShift.updateMany({
      where: { branchId, isOpen: true },
      data: { isOpen: false, closedAt: new Date() },
    });

    const shift = await prisma.cashShift.create({
      data: {
        branchId,
        initialAmount: Number(initialAmount),
        openedBy: openedBy || (req as any).user?.name || 'Admin',
        notes: notes || null,
      },
    });
    res.json(shift);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al abrir caja' });
  }
});

// CLOSE cash shift
router.post('/close', authenticate, async (req: Request & { user?: any }, res) => {
  try {
    const { countedAmount, closedBy, notes } = req.body;
    const branchId = await resolveBranchId(req, req.body.branchId);

    if (!branchId) {
      return res.status(400).json({ error: 'No hay sucursal asignada a este usuario.' });
    }

    const shift = await prisma.cashShift.findFirst({ where: { branchId, isOpen: true } });
    if (!shift) return res.status(404).json({ error: 'No hay caja abierta' });

    const closed = await prisma.cashShift.update({
      where: { id: shift.id },
      data: {
        isOpen: false,
        closedAt: new Date(),
        countedAmount: countedAmount != null ? Number(countedAmount) : 0,
        closedBy: closedBy || (req as any).user?.name || 'Admin',
        notes: notes || shift.notes,
      },
    });
    res.json(closed);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al cerrar caja' });
  }
});

export default router;
