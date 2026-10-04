import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET all staff for a branch
router.get('/', async (req, res) => {
  const { branchId } = req.query;
  try {
    const where = branchId ? { branchId: String(branchId) } : {};
    const staff = await prisma.staff.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(staff);
  } catch {
    res.status(500).json({ error: 'Error al obtener meseros' });
  }
});

// CREATE staff member
router.post('/', async (req, res) => {
  const { branchId, name, role, pin, phone, active } = req.body;
  if (!branchId || !name || !pin) return res.status(400).json({ error: 'branchId, name y pin son requeridos' });
  try {
    const member = await prisma.staff.create({ data: { branchId, name, role: role || 'Mesero', pin, phone: phone || null, active: active !== false } });
    res.json(member);
  } catch {
    res.status(500).json({ error: 'Error al crear mesero' });
  }
});

// UPDATE staff member
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, role, pin, phone, active, shiftStatus, totalSales, totalOrders } = req.body;
  try {
    const updated = await prisma.staff.update({
      where: { id },
      data: { name, role, pin, phone, active, shiftStatus, totalSales, totalOrders },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Error al actualizar mesero' });
  }
});

// DELETE staff member
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.staff.delete({ where: { id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Error al eliminar mesero' });
  }
});

export default router;
