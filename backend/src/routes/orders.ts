import { Router, Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, resolveBranchId } from '../middleware';
import { logAudit } from '../audit';

const router = Router();
const prisma = new PrismaClient();

// GET /api/orders?branchId=xxx
router.get('/', authenticate, async (req: Request & { user?: any }, res) => {
  try {
    const queryBranchId = req.query.branchId as string | undefined;
    const branchId = await resolveBranchId(req, queryBranchId);
    const where = branchId ? { branchId } : {};
    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    const parsed = orders.map((o: any) => ({
      ...o,
      items: typeof o.items === 'string' ? JSON.parse(o.items || '[]') : (o.items || []),
    }));
    res.json(parsed);
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    res.status(500).json({ error: 'Error al obtener órdenes' });
  }
});

// POST /api/orders
router.post('/', authenticate, async (req: Request & { user?: any }, res) => {
  try {
    const {
      customerType,
      customerId,
      customerName,
      customerPhone,
      tableName,
      tableId,
      waiterId,
      waiterName,
      items,
      subtotal,
      discount,
      discountReason,
      pointsUsed,
      pointsEarned,
      total,
      totalCost,
      netProfit,
      paymentMethod,
      channel,
      notes,
      status,
    } = req.body;

    const branchId = await resolveBranchId(req, req.body.branchId);

    if (!branchId) {
      return res.status(400).json({ error: 'No hay sucursal asignada a este usuario.' });
    }

    const calculatedSubtotal = Number(subtotal) || (Array.isArray(items) ? items.reduce((s: number, i: any) => s + (Number(i.totalPrice) || 0), 0) : 0);
    const calculatedTotal = Number(total) || calculatedSubtotal;
    const calculatedCost = Number(totalCost) || (Array.isArray(items) ? items.reduce((s: number, i: any) => s + ((Number(i.unitCost) || 0) * (Number(i.quantity) || 1)), 0) : 0);
    const calculatedProfit = Number(netProfit) || Math.max(0, calculatedTotal - calculatedCost);

    const order = await prisma.order.create({
      data: {
        branchId,
        customerType: customerType || 'guest',
        customerId: customerId || null,
        customerName: customerName || 'Cliente Mostrador',
        customerPhone: customerPhone || null,
        tableName: tableName || null,
        tableId: tableId || null,
        waiterId: waiterId || null,
        waiterName: waiterName || null,
        items: JSON.stringify(items || []),
        subtotal: calculatedSubtotal,
        discount: Number(discount) || 0,
        discountReason: discountReason || null,
        pointsUsed: Number(pointsUsed) || 0,
        pointsEarned: Number(pointsEarned) || 0,
        total: calculatedTotal,
        totalCost: calculatedCost,
        netProfit: calculatedProfit,
        paymentMethod: paymentMethod || 'Efectivo',
        channel: channel || 'Punto de Venta (POS)',
        notes: notes || null,
        status: status || 'Pendiente',
      }
    });

    const user = (req as any).user;
    await logAudit({
      branchId,
      userId: user?.id,
      userName: user?.name,
      userEmail: user?.email,
      action: 'ORDER_CREATED',
      entity: 'Order',
      entityId: order.id,
      details: { customerName: order.customerName, total: order.total, paymentMethod: order.paymentMethod, items: Array.isArray(items) ? items.length : 0 },
    });

    res.status(201).json({
      ...order,
      items: JSON.parse(order.items),
    });
  } catch (error) {
    console.error('Error al crear orden:', error);
    res.status(500).json({ error: 'Error al crear orden' });
  }
});

// PUT /api/orders/:id (Update any field: status, tableName, waiter, etc.)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, tableName, tableId, waiterId, waiterName, notes } = req.body;

    const dataToUpdate: any = {};
    if (status !== undefined) dataToUpdate.status = status;
    if (tableName !== undefined) dataToUpdate.tableName = tableName;
    if (tableId !== undefined) dataToUpdate.tableId = tableId;
    if (waiterId !== undefined) dataToUpdate.waiterId = waiterId;
    if (waiterName !== undefined) dataToUpdate.waiterName = waiterName;
    if (notes !== undefined) dataToUpdate.notes = notes;

    const updated = await prisma.order.update({
      where: { id: id as string },
      data: dataToUpdate,
    });

    const user = (req as any).user;
    await logAudit({
      userId: user?.id,
      userName: user?.name,
      userEmail: user?.email,
      action: 'ORDER_UPDATED',
      entity: 'Order',
      entityId: String(id),
      details: dataToUpdate,
    });

    res.json({
      ...updated,
      items: typeof updated.items === 'string' ? JSON.parse(updated.items) : updated.items,
    });
  } catch (error) {
    console.error('Error al actualizar orden:', error);
    res.status(500).json({ error: 'Error al actualizar orden' });
  }
});

// PUT /api/orders/:id/status
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await prisma.order.update({
      where: { id: req.params.id as string },
      data: { status }
    });
    res.json({
      ...order,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
    });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

// DELETE /api/orders/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.order.delete({
      where: { id: req.params.id as string }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar orden:', error);
    res.status(500).json({ error: 'Error al eliminar orden' });
  }
});

export default router;
