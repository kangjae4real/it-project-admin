import { z } from 'zod';

export const userCreateSchema = z.object({
  username: z.string().trim().min(3, '아이디는 3자 이상이어야 합니다.'),
  name: z.string().trim().min(1, '이름을 입력하세요.'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;
