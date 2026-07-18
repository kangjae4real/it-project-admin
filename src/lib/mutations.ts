import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { toast } from 'sonner';

// CRUD 뮤테이션 공용 래퍼: 성공/실패 토스트 + 관련 쿼리 무효화.
export function useCrudMutation<TInput, TResult>(
  mutationFn: (input: TInput) => Promise<TResult>,
  options: { invalidate: Array<QueryKey>; success: string; onDone?: () => void },
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      for (const key of options.invalidate) {
        qc.invalidateQueries({ queryKey: key });
      }
      toast.success(options.success);
      options.onDone?.();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : '오류가 발생했습니다.');
    },
  });
}
