import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET customers for a branch
router.get('/', async (req, res) => {
  const { branchId } = req.query;
  try {
    const where = branchId ? { branchId: String(branchId) } : {};
    const customers = await prisma.customer.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(customers);
  } catch {
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
});

// CREATE customer
router.post('/', async (req, res) => {
  const { branchId, name, email, phone } = req.body;
  if (!branchId || !name || !phone) return res.status(400).json({ error: 'branchId, name y phone son requeridos' });
  try {
    const customer = await prisma.customer.create({ data: { branchId, name, email: email || null, phone } });
    res.json(customer);
  } catch {
    res.status(500).json({ error: 'Error al crear cliente' });
  }
});

// UPDATE customer (points, tier, etc.)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, points, lifetimePoints, totalSpent, ordersCount, tier, lastOrderDate } = req.body;
  try {
    const updated = await prisma.customer.update({
      where: { id },
      data: { name, email, phone, points, lifetimePoints, totalSpent, ordersCount, tier, lastOrderDate: lastOrderDate ? new Date(lastOrderDate) : undefined },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
});

// DELETE customer
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.customer.delete({ where: { id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
});

export default router;
