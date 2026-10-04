import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET flavors for a branch
router.get('/', async (req, res) => {
  const { branchId } = req.query;
  try {
    const where = branchId ? { branchId: String(branchId) } : {};
    const flavors = await prisma.flavor.findMany({ where, orderBy: { name: 'asc' } });
    res.json(flavors);
  } catch {
    res.status(500).json({ error: 'Error al obtener sabores' });
  }
});

// CREATE flavor
router.post('/', async (req, res) => {
  const { branchId, name, category, color } = req.body;
  if (!branchId || !name) return res.status(400).json({ error: 'branchId y name son requeridos' });
  try {
    const flavor = await prisma.flavor.create({ data: { branchId, name, category: category || 'Frutas', color: color || '#84cc16' } });
    res.json(flavor);
  } catch {
    res.status(500).json({ error: 'Error al crear sabor' });
  }
});

// UPDATE flavor
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, category, color, inStock } = req.body;
  try {
    const updated = await prisma.flavor.update({ where: { id }, data: { name, category, color, inStock } });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Error al actualizar sabor' });
  }
});

// DELETE flavor
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.flavor.delete({ where: { id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Error al eliminar sabor' });
  }
});

export default router;
