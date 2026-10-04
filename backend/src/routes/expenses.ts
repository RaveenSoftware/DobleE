import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET expenses for a branch
router.get('/', async (req, res) => {
  const { branchId } = req.query;
  try {
    const where = branchId ? { branchId: String(branchId) } : {};
    const expenses = await prisma.expense.findMany({ where, orderBy: { date: 'desc' } });
    res.json(expenses);
  } catch {
    res.status(500).json({ error: 'Error al obtener gastos' });
  }
});

// CREATE expense
router.post('/', async (req, res) => {
  const { branchId, category, description, amount, recordedBy, date } = req.body;
  if (!branchId || !category || !amount) return res.status(400).json({ error: 'branchId, category y amount son requeridos' });
  try {
    const expense = await prisma.expense.create({ data: { branchId, category, description: description || '', amount, recordedBy: recordedBy || 'Admin', date: date ? new Date(date) : new Date() } });
    res.json(expense);
  } catch {
    res.status(500).json({ error: 'Error al crear gasto' });
  }
});

// DELETE expense
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.expense.delete({ where: { id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Error al eliminar gasto' });
  }
});

export default router;
