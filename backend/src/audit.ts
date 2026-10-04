import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuditPayload {
  branchId?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  action: string;
  entity?: string;
  entityId?: string;
  details?: object;
  ip?: string;
}

export async function logAudit(payload: AuditPayload) {
  try {
    await prisma.auditLog.create({
      data: {
        branchId: payload.branchId,
        userId: payload.userId,
        userName: payload.userName,
        userEmail: payload.userEmail,
        action: payload.action,
        entity: payload.entity,
        entityId: payload.entityId,
        details: payload.details ? JSON.stringify(payload.details) : undefined,
        ip: payload.ip,
      },
    });
  } catch (e) {
    // Non-blocking — never fail because of audit
    console.error('[AUDIT ERROR]', e);
  }
}
