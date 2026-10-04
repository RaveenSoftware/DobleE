import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET inventory for a branch
router.get('/', async (req, res) => {
  const { branchId } = req.query;
  try {
    const where = branchId ? { branchId: String(branchId) } : {};
    const items = await prisma.inventoryItem.findMany({ where, orderBy: { name: 'asc' } });
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Error al obtener inventario' });
  }
});

// CREATE inventory item
router.post('/', async (req, res) => {
  const { branchId, name, category, unit, currentStock, minStock, costPerUnit } = req.body;
  if (!branchId || !name) return res.status(400).json({ error: 'branchId y name son requeridos' });
  try {
    const item = await prisma.inventoryItem.create({ data: { branchId, name, category: category || 'General', unit: unit || 'unidad', currentStock: currentStock || 0, minStock: minStock || 0, costPerUnit: costPerUnit || 0 } });
    res.json(item);
  } catch {
    res.status(500).json({ error: 'Error al crear item de inventario' });
  }
});

// UPDATE inventory item (stock, etc.)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, category, unit, currentStock, minStock, costPerUnit, lastRestocked } = req.body;
  try {
    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: { name, category, unit, currentStock, minStock, costPerUnit, lastRestocked: lastRestocked ? new Date(lastRestocked) : undefined },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Error al actualizar inventario' });
  }
});

// DELETE inventory item
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.inventoryItem.delete({ where: { id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Error al eliminar item' });
  }
});

export default router;
