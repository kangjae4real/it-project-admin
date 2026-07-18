import { prisma } from '../db';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';
export type AuditEntity = 'League' | 'Department' | 'Team' | 'Member' | 'User';

// 변경 이력 기록. changes 는 JSON 문자열로 저장(SQLite Json 미지원).
export async function writeAudit(
  userId: string,
  action: AuditAction,
  entity: AuditEntity,
  entityId: string,
  changes?: unknown,
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entity,
      entityId,
      changes: changes === undefined ? null : JSON.stringify(changes),
    },
  });
}
