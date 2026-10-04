import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET rewards for a branch
router.get('/', async (req, res) => {
  const { branchId } = req.query;
  try {
    const where = branchId ? { branchId: String(branchId) } : {};
    const rewards = await prisma.reward.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(rewards);
  } catch {
    res.status(500).json({ error: 'Error al obtener recompensas' });
  }
});

// CREATE reward
router.post('/', async (req, res) => {
  const { branchId, title, description, pointsCost, discountAmount } = req.body;
  if (!branchId || !title || !pointsCost) return res.status(400).json({ error: 'branchId, title y pointsCost son requeridos' });
  try {
    const reward = await prisma.reward.create({ data: { branchId, title, description: description || '', pointsCost, discountAmount: discountAmount || 0 } });
    res.json(reward);
  } catch {
    res.status(500).json({ error: 'Error al crear recompensa' });
  }
});

// UPDATE reward
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, pointsCost, discountAmount, active } = req.body;
  try {
    const updated = await prisma.reward.update({ where: { id }, data: { title, description, pointsCost, discountAmount, active } });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Error al actualizar recompensa' });
  }
});

// DELETE reward
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.reward.delete({ where: { id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Error al eliminar recompensa' });
  }
});

export default router;
