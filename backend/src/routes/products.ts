import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware';

const router = Router();
const prisma = new PrismaClient();

// GET /api/products?branchId=xxx
router.get('/', async (req: Request, res: Response) => {
  try {
    const { branchId } = req.query;
    const where = branchId ? { branchId: String(branchId) } : {};
    const products = await prisma.product.findMany({ where, orderBy: { name: 'asc' } });
    const parsed = products.map((p: any) => ({
      ...p,
      flavors: JSON.parse(p.flavors || '[]'),
      sizePrices: p.sizePrices ? JSON.parse(p.sizePrices) : null,
      allowedToppingIds: p.allowedToppingIds ? JSON.parse(p.allowedToppingIds) : null,
    }));
    res.json(parsed);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// POST /api/products
router.post('/', authenticate, async (req: Request & { user?: any }, res: Response) => {
  try {
    const { branchId, name, category, description, basePrice, baseCost, image, isPopular, isAvailable, flavors, sizePrices, allowedToppingIds } = req.body;
    if (!branchId) return res.status(400).json({ error: 'branchId es requerido' });

    const product = await prisma.product.create({
      data: {
        branchId,
        name,
        category,
        description: description || '',
        basePrice: Number(basePrice),
        baseCost: Number(baseCost),
        image: image || null,
        isPopular: Boolean(isPopular),
        isAvailable: isAvailable !== false,
        flavors: JSON.stringify(flavors || []),
        sizePrices: sizePrices ? JSON.stringify(sizePrices) : null,
        allowedToppingIds: allowedToppingIds ? JSON.stringify(allowedToppingIds) : null,
      }
    });
    res.status(201).json({ ...product, flavors: JSON.parse(product.flavors), sizePrices: product.sizePrices ? JSON.parse(product.sizePrices) : null });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

// PUT /api/products/:id
router.put('/:id', authenticate, async (req: Request & { user?: any }, res: Response) => {
  try {
    const id = String(req.params.id);
    const { name, category, description, basePrice, baseCost, image, isPopular, isAvailable, flavors, sizePrices, allowedToppingIds } = req.body;
    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        category,
        description: description || '',
        basePrice: Number(basePrice),
        baseCost: Number(baseCost),
        image: image || null,
        isPopular: Boolean(isPopular),
        isAvailable: isAvailable !== false,
        flavors: JSON.stringify(flavors || []),
        sizePrices: sizePrices ? JSON.stringify(sizePrices) : null,
        allowedToppingIds: allowedToppingIds ? JSON.stringify(allowedToppingIds) : null,
      }
    });
    res.json({ ...product, flavors: JSON.parse(product.flavors), sizePrices: product.sizePrices ? JSON.parse(product.sizePrices) : null });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', authenticate, async (req: Request & { user?: any }, res: Response) => {
  try {
    await prisma.product.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

export default router;
