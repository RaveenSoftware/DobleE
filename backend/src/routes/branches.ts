import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all branches
router.get('/', async (req, res) => {
  try {
    const branches = await prisma.branch.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(branches);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener sucursales' });
  }
});

// Create a branch
router.post('/', async (req, res) => {
  try {
    const { name, city, ownerName, ownerEmail, phone, plan } = req.body;
    
    const newBranch = await prisma.branch.create({
      data: {
        name,
        city,
        ownerName,
        ownerEmail,
        phone,
        plan: plan || 'Pro Negocio',
      },
    });
    
    res.json(newBranch);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear sucursal' });
  }
});

// Update a branch
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, city, ownerName, ownerEmail, phone, plan, status } = req.body;
    
    const updatedBranch = await prisma.branch.update({
      where: { id: String(id) },
      data: { name, city, ownerName, ownerEmail, phone, plan, status },
    });
    
    res.json(updatedBranch);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar sucursal' });
  }
});

// Delete a branch
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.branch.delete({ where: { id: String(id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar sucursal' });
  }
});

export default router;
