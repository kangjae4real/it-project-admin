import { z } from 'zod';

export const leagueCreateSchema = z.object({
  name: z.string().trim().min(1, '리그명을 입력하세요.'),
});

export const leagueUpdateSchema = leagueCreateSchema.extend({
  id: z.string().min(1),
});

export type LeagueCreateInput = z.infer<typeof leagueCreateSchema>;
export type LeagueUpdateInput = z.infer<typeof leagueUpdateSchema>;
