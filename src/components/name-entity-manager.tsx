import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';

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

type Row = { id: string; name: string; _count: Record<string, number> };

// 이름 하나 + 카운트만 가지는 참조 테이블(리그/학과) 공용 관리 화면.
export function NameEntityManager(props: {
  title: string;
  description: string;
  queryKey: string;
  countField: string;
  countLabel: string;
  list: () => Promise<Array<Row>>;
  create: (input: { name: string }) => Promise<unknown>;
  update: (input: { id: string; name: string }) => Promise<unknown>;
  remove: (input: { id: string }) => Promise<unknown>;
}) {
  const { title, description, queryKey, countField, countLabel } = props;
  const listQuery = useQuery({ queryKey: [queryKey], queryFn: props.list });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [name, setName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);

  const invalidate = [[queryKey], ['stats']];
  const createM = useCrudMutation(props.create, { invalidate, success: `${title} 추가됨`, onDone: () => setFormOpen(false) });
  const updateM = useCrudMutation(props.update, { invalidate, success: `${title} 수정됨`, onDone: () => setFormOpen(false) });
  const removeM = useCrudMutation(props.remove, { invalidate, success: `${title} 삭제됨`, onDone: () => setDeleteTarget(null) });

  function openCreate() {
    setEditing(null);
    setName('');
    setFormOpen(true);
  }
  function openEdit(row: Row) {
    setEditing(row);
    setName(row.name);
    setFormOpen(true);
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) updateM.mutate({ id: editing.id, name });
    else createM.mutate({ name });
  }

  const rows = listQuery.data ?? [];
  const saving = createM.isPending || updateM.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="size-4" />
          {title} 추가
        </Button>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead className="w-32 text-right">{countLabel}</TableHead>
              <TableHead className="w-24 text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listQuery.isLoading && (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground">
                  불러오는 중…
                </TableCell>
              </TableRow>
            )}
            {!listQuery.isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground">
                  아직 없습니다.
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell className="text-right text-muted-foreground">{row._count[countField] ?? 0}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(row)} aria-label="수정">
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(row)} aria-label="삭제">
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
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>{editing ? `${title} 수정` : `${title} 추가`}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="mt-1.5"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>
                취소
              </Button>
              <Button type="submit" disabled={saving || !name.trim()}>
                {saving ? '저장 중…' : '저장'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteTarget?.name} 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말 삭제할까요? 사용 중이면 삭제가 거부됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (deleteTarget) removeM.mutate({ id: deleteTarget.id });
              }}
              disabled={removeM.isPending}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
