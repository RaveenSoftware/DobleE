import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { logAudit } from '../audit';

const router = Router();
const prisma = new PrismaClient();

// GET /api/public/menu?branchId=xxx — returns products, flavors, toppings (no auth)
router.get('/menu', async (req, res) => {
  try {
    // Get first branch if no branchId specified
    const branchId = req.query.branchId as string | undefined;
    const where = branchId ? { branchId, isAvailable: true } : { isAvailable: true };

    const [products, toppings, flavors] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { name: 'asc' },
      }),
      prisma.topping.findMany({
        where: branchId ? { branchId, inStock: true } : { inStock: true },
        orderBy: { name: 'asc' },
      }),
      prisma.flavor.findMany({
        where: branchId ? { branchId, inStock: true } : { inStock: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    // Get branch info (name, logo)
    let branchInfo = { name: 'DobleE', logoUrl: '' };
    try {
      const branch = branchId
        ? await prisma.branch.findUnique({ where: { id: branchId } })
        : await prisma.branch.findFirst();
      if (branch) branchInfo = { name: branch.name, logoUrl: (branch as any).logoUrl || '' };
    } catch { /* ignore */ }

    res.json({ products, toppings, flavors, branch: branchInfo });
  } catch (error) {
    console.error('Error al obtener menú público:', error);
    res.status(500).json({ error: 'Error al obtener menú' });
  }
});

// POST /api/public/orders — submit customer order (no auth needed)
router.post('/orders', async (req, res) => {
  try {
    const {
      customerName,
      tableName,
      items,
      paymentMethod,
      notes,
      branchId: bodyBranchId,
    } = req.body;

    if (!customerName?.trim() || !items?.length) {
      return res.status(400).json({ error: 'Nombre de cliente e ítems son requeridos' });
    }

    // Resolve branchId
    let branchId = bodyBranchId;
    if (!branchId) {
      const branch = await prisma.branch.findFirst();
      branchId = branch?.id || 'branch-1';
    }

    const subtotal = Array.isArray(items)
      ? items.reduce((s: number, i: any) => s + (Number(i.totalPrice) || 0), 0)
      : 0;

    const order = await prisma.order.create({
      data: {
        branchId,
        customerType: 'guest',
        customerName: customerName.trim(),
        tableName: tableName || null,
        items: JSON.stringify(items),
        subtotal,
        total: subtotal,
        paymentMethod: paymentMethod || 'Efectivo',
        channel: tableName ? `Mesa QR (${tableName})` : 'Web / Carta Digital',
        notes: notes || null,
        status: 'Pendiente',
      },
    });

    // Log to audit (non-blocking)
    await logAudit({
      branchId,
      action: 'ORDER_CREATED',
      entity: 'Order',
      entityId: order.id,
      details: {
        source: 'QR / Carta Digital',
        customerName: customerName.trim(),
        table: tableName || 'Mostrador',
        total: subtotal,
        itemCount: Array.isArray(items) ? items.length : 0,
        items: Array.isArray(items) ? items.map((i: any) => i.productName).join(', ') : '',
      },
    });

    res.status(201).json({
      success: true,
      orderId: order.id,
      message: '¡Pedido recibido! En breve lo preparamos.',
    });
  } catch (error) {
    console.error('Error al crear pedido público:', error);
    res.status(500).json({ error: 'Error al enviar pedido' });
  }
});

export default router;
