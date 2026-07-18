import { z } from 'zod';

export const teamCreateSchema = z.object({
  name: z.string().trim().min(1, '팀명을 입력하세요.'),
  teamNumber: z.string().trim().min(1).nullish(),
  leagueId: z.string().min(1, '리그를 선택하세요.'),
});

export const teamUpdateSchema = teamCreateSchema.extend({
  id: z.string().min(1),
});

export type TeamCreateInput = z.infer<typeof teamCreateSchema>;
export type TeamUpdateInput = z.infer<typeof teamUpdateSchema>;
