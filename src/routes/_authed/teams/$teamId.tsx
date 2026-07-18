import { useState } from 'react';
import { Link, createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { MemberFormDialog, type MemberEdit } from '@/components/member-form-dialog';
import { useCrudMutation } from '@/lib/mutations';
import { getTeam } from '../../../server/teams';
import { deleteMember } from '../../../server/members';

export const Route = createFileRoute('/_authed/teams/$teamId')({
  component: TeamDetailPage,
});

function TeamDetailPage() {
  const { teamId } = Route.useParams();
  const teamQuery = useQuery({ queryKey: ['team', teamId], queryFn: () => getTeam({ data: { id: teamId } }) });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MemberEdit | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const removeM = useCrudMutation((i: { id: string }) => deleteMember({ data: i }), {
    invalidate: [['team', teamId], ['teams'], ['members'], ['stats']],
    success: '팀원 삭제됨',
    onDone: () => setDeleteTarget(null),
  });

  if (teamQuery.isLoading) return <p className="text-sm text-muted-foreground">불러오는 중…</p>;
  if (teamQuery.isError || !teamQuery.data) return <p className="text-sm text-destructive">팀을 찾을 수 없습니다.</p>;

  const team = teamQuery.data;

  return (
    <div className="space-y-6">
      <Link to="/teams" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />팀 목록
      </Link>

      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{team.name}</h1>
            {team.teamNumber && <Badge variant="secondary">{team.teamNumber}</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {team.league.name} · 팀원 {team.members.length}명
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />팀원 추가
        </Button>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>학번</TableHead>
              <TableHead>학과</TableHead>
              <TableHead>전화번호</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="w-24 text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {team.members.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  팀원이 없습니다.
                </TableCell>
              </TableRow>
            )}
            {team.members.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.name}</TableCell>
                <TableCell className="text-muted-foreground">{m.studentId}</TableCell>
                <TableCell>{m.department.name}</TableCell>
                <TableCell className="text-muted-foreground">{m.phone ?? '-'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {m.isLeader && <Badge>팀장</Badge>}
                    {m.droppedOut && <Badge variant="destructive">중도하차</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="수정"
                      onClick={() => {
                        setEditing({
                          id: m.id,
                          name: m.name,
                          studentId: m.studentId,
                          departmentId: m.departmentId,
                          teamId: m.teamId,
                          isLeader: m.isLeader,
                          contact: m.contact,
                          phone: m.phone,
                          droppedOut: m.droppedOut,
                        });
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="삭제" onClick={() => setDeleteTarget({ id: m.id, name: m.name })}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <MemberFormDialog open={formOpen} onOpenChange={setFormOpen} member={editing} lockedTeamId={editing ? undefined : team.id} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteTarget?.name} 삭제</AlertDialogTitle>
            <AlertDialogDescription>이 팀원을 삭제할까요?</AlertDialogDescription>
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
