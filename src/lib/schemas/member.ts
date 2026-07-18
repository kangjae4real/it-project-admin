import { z } from 'zod';

export const memberCreateSchema = z.object({
  name: z.string().trim().min(1, '이름을 입력하세요.'),
  studentId: z.string().trim().min(1, '학번을 입력하세요.'),
  departmentId: z.string().min(1, '학과를 선택하세요.'),
  teamId: z.string().min(1, '팀을 선택하세요.'),
  isLeader: z.boolean().optional().default(false),
  contact: z.string().trim().min(1).nullish(),
  phone: z.string().trim().min(1).nullish(),
  droppedOut: z.boolean().optional().default(false),
});

export const memberUpdateSchema = memberCreateSchema.extend({
  id: z.string().min(1),
});

export type MemberCreateInput = z.infer<typeof memberCreateSchema>;
export type MemberUpdateInput = z.infer<typeof memberUpdateSchema>;
