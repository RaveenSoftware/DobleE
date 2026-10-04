import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { logAudit } from '../audit';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'doblee-secret';

// Iniciar sesión
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // If admin, look up their branch by ownerEmail
    let branchId: string | null = user.branchId || null;
    if (user.role === 'admin' && !branchId) {
      const branch = await prisma.branch.findFirst({ where: { ownerEmail: user.email } });
      if (branch) branchId = branch.id;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, branchId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    await logAudit({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user.id,
      details: { role: user.role },
      ip: req.ip,
    });

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, branchId },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Verificar token
router.get('/me', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No autorizado' });
    }
    const token = auth.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });

    let branchId: string | null = user.branchId || null;
    if (user.role === 'admin' && !branchId) {
      const branch = await prisma.branch.findFirst({ where: { ownerEmail: user.email } });
      if (branch) branchId = branch.id;
    }

    res.json({ id: user.id, email: user.email, name: user.name, role: user.role, branchId });
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
});

export default router;
