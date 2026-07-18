import { z } from 'zod';

export const departmentCreateSchema = z.object({
  name: z.string().trim().min(1, '학과명을 입력하세요.'),
});

export const departmentUpdateSchema = departmentCreateSchema.extend({
  id: z.string().min(1),
});

export type DepartmentCreateInput = z.infer<typeof departmentCreateSchema>;
export type DepartmentUpdateInput = z.infer<typeof departmentUpdateSchema>;
