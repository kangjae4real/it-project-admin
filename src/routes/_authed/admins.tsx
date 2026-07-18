import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCrudMutation } from '@/lib/mutations';
import { createUser, deleteUser, listUsers } from '../../server/users';

export const Route = createFileRoute('/_authed/admins')({
  component: AdminsPage,
});

function AdminsPage() {
  const { user } = Route.useRouteContext();
  const usersQuery = useQuery({ queryKey: ['users'], queryFn: () => listUsers() });

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ username: '', name: '', password: '' });
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const createM = useCrudMutation((i: { username: string; name: string; password: string }) => createUser({ data: i }), {
    invalidate: [['users']],
    success: '운영진 추가됨',
    onDone: () => setFormOpen(false),
  });
  const removeM = useCrudMutation((i: { id: string }) => deleteUser({ data: i }), {
    invalidate: [['users']],
    success: '운영진 삭제됨',
    onDone: () => setDeleteTarget(null),
  });

  function openCreate() {
    setForm({ username: '', name: '', password: '' });
    setFormOpen(true);
  }

  const rows = usersQuery.data ?? [];
  const valid = form.username.trim().length >= 3 && form.name.trim() && form.password.length >= 8;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">운영진</h1>
          <p className="mt-1 text-sm text-muted-foreground">이 백오피스에 접근할 수 있는 계정</p>
        </div>
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="size-4" />운영진 추가
        </Button>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>아이디</TableHead>
              <TableHead>이름</TableHead>
              <TableHead>가입일</TableHead>
              <TableHead className="w-20 text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersQuery.isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  불러오는 중…
                </TableCell>
              </TableRow>
            )}
            {rows.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">
                  {u.username}
                  {u.id === user.id && <span className="ml-2 text-xs text-muted-foreground">(나)</span>}
                </TableCell>
                <TableCell>{u.name}</TableCell>
                <TableCell className="text-muted-foreground">{new Date(u.createdAt).toLocaleDateString('ko-KR')}</TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="삭제"
                      disabled={u.id === user.id}
                      onClick={() => setDeleteTarget({ id: u.id, name: u.name })}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createM.mutate(form);
            }}
            className="space-y-4"
          >
            <DialogHeader>
              <DialogTitle>운영진 추가</DialogTitle>
            </DialogHeader>
            <div>
              <Label htmlFor="u-username">아이디</Label>
              <Input id="u-username" className="mt-1.5" autoComplete="off" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} autoFocus />
            </div>
            <div>
              <Label htmlFor="u-name">이름</Label>
              <Input id="u-name" className="mt-1.5" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="u-password">비밀번호</Label>
              <Input id="u-password" type="password" className="mt-1.5" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="8자 이상" />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>
                취소
              </Button>
              <Button type="submit" disabled={createM.isPending || !valid}>
                {createM.isPending ? '생성 중…' : '생성'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteTarget?.name} 계정 삭제</AlertDialogTitle>
            <AlertDialogDescription>이 운영진 계정을 삭제할까요? 활동 기록이 있으면 삭제할 수 없습니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              disabled={removeM.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (deleteTarget) removeM.mutate({ id: deleteTarget.id });
              }}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
