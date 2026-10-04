import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        branchId: true,
        createdAt: true,
      },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Create a new user
router.post('/', async (req, res) => {
  try {
    const { name, email, password, role, branchId } = req.body;
    
    // Validar que el usuario no exista
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'El correo ya está en uso' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'mesero',
        branchId: branchId || null,
      },
      select: { id: true, email: true, name: true, role: true, branchId: true },
    });
    
    res.json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// Update a user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, branchId } = req.body;
    
    const data: any = { name, email, role, branchId: branchId || null };
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: String(id) },
      data,
      select: { id: true, email: true, name: true, role: true, branchId: true },
    });
    
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// Delete a user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id: String(id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

export default router;
