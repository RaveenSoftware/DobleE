import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'doblee-super-secret-key';
const prisma = new PrismaClient();

// Attach user from JWT — does NOT block unauthenticated requests
export function authenticate(req: Request & { user?: any }, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

/**
 * Resolves branchId from (in priority order):
 * 1. Explicit value passed in body/query
 * 2. JWT payload branchId
 * 3. Branch lookup by admin email
 * 4. Fallback to default branch
 */
export async function resolveBranchId(
  req: Request & { user?: any },
  bodyBranchId?: string | null
): Promise<string | null> {
  const raw = bodyBranchId;
  if (raw && raw !== 'null' && raw !== 'undefined' && raw.trim() !== '') {
    return raw;
  }

  const user = (req as any).user;
  if (user?.branchId && user.branchId !== 'null') return user.branchId;

  if (user?.role === 'admin' && user?.email) {
    try {
      const branch = await prisma.branch.findFirst({ where: { ownerEmail: user.email } });
      if (branch) return branch.id;
    } catch {
      // ignore
    }
  }

  try {
    const firstBranch = await prisma.branch.findFirst();
    if (firstBranch) return firstBranch.id;
  } catch {
    // ignore
  }

  return 'branch-1';
}
