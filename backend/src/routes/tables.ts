import { Router, Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, resolveBranchId } from '../middleware';

const router = Router();
const prisma = new PrismaClient();

// GET tables for a branch
router.get('/', async (req, res) => {
  const { branchId } = req.query;
  try {
    const where = branchId ? { branchId: String(branchId) } : {};
    const tables = await prisma.tableItem.findMany({ where, orderBy: { createdAt: 'asc' } });
    res.json(tables);
  } catch {
    res.status(500).json({ error: 'Error al obtener mesas' });
  }
});

// CREATE table
router.post('/', authenticate, async (req: Request & { user?: any }, res) => {
  const { name, capacity, area, shape, status, isHidden, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'El nombre de la mesa es requerido' });
  try {
    const branchId = await resolveBranchId(req, req.body.branchId);
    if (!branchId) return res.status(400).json({ error: 'No hay sucursal asignada' });
    const table = await prisma.tableItem.create({
      data: {
        branchId,
        name: String(name),
        capacity: Number(capacity) || 4,
        area: area ? String(area) : 'Salón Principal',
        shape: shape ? String(shape) : 'cuadrada',
        status: status ? String(status) : 'libre',
        isHidden: Boolean(isHidden) || false,
        notes: notes ? String(notes) : null,
      },
    });
    res.json(table);
  } catch (err) {
    console.error('Error al crear mesa:', err);
    res.status(500).json({ error: 'Error al crear mesa' });
  }
});

// UPDATE table (status, order, area, shape, etc.)
router.put('/:id', authenticate, async (req, res) => {
  const id = String(req.params.id);
  const { name, capacity, area, shape, status, isHidden, currentOrderId, orderTotal, activeWaiter, notes } = req.body;
  try {
    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = String(name);
    if (capacity !== undefined) dataToUpdate.capacity = Number(capacity);
    if (area !== undefined) dataToUpdate.area = String(area);
    if (shape !== undefined) dataToUpdate.shape = String(shape);
    if (status !== undefined) dataToUpdate.status = String(status);
    if (isHidden !== undefined) dataToUpdate.isHidden = Boolean(isHidden);
    if (currentOrderId !== undefined) dataToUpdate.currentOrderId = currentOrderId;
    if (orderTotal !== undefined) dataToUpdate.orderTotal = Number(orderTotal);
    if (activeWaiter !== undefined) dataToUpdate.activeWaiter = activeWaiter ? String(activeWaiter) : null;
    if (notes !== undefined) dataToUpdate.notes = notes ? String(notes) : null;

    const updated = await prisma.tableItem.update({
      where: { id: String(id) },
      data: dataToUpdate,
    });
    res.json(updated);
  } catch (err) {
    console.error('Error al actualizar mesa:', err);
    res.status(500).json({ error: 'Error al actualizar mesa' });
  }
});

// DELETE table
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.tableItem.delete({ where: { id: String(id) } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Error al eliminar mesa' });
  }
});

export default router;
