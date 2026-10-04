import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware';

const router = Router();
const prisma = new PrismaClient();

// GET /api/toppings?branchId=xxx
router.get('/', async (req, res) => {
  try {
    const { branchId } = req.query;
    const where = branchId ? { branchId: String(branchId) } : {};
    const toppings = await prisma.topping.findMany({ where, orderBy: { name: 'asc' } });
    res.json(toppings);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener toppings' });
  }
});

// POST /api/toppings
router.post('/', authenticate, async (req, res) => {
  try {
    const { branchId, name, category, price, cost, inStock } = req.body;
    if (!branchId) return res.status(400).json({ error: 'branchId es requerido' });

    const topping = await prisma.topping.create({
      data: { branchId, name, category, price: Number(price), cost: Number(cost), inStock: inStock !== false }
    });
    res.status(201).json(topping);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear topping' });
  }
});

// PUT /api/toppings/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, category, price, cost, inStock } = req.body;
    const topping = await prisma.topping.update({
      where: { id: req.params.id as string },
      data: { name, category, price: Number(price), cost: Number(cost), inStock: Boolean(inStock) }
    });
    res.json(topping);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar topping' });
  }
});

// DELETE /api/toppings/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.topping.delete({ where: { id: req.params.id as string } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar topping' });
  }
});

export default router;
