import { useMemo, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MemberFormDialog, type MemberEdit } from '@/components/member-form-dialog';
import { useCrudMutation } from '@/lib/mutations';
import { deleteMember, listMembers } from '../../../server/members';
import { listDepartments } from '../../../server/departments';
import { listTeams } from '../../../server/teams';

export const Route = createFileRoute('/_authed/members/')({
  component: MembersPage,
});

function MembersPage() {
  const membersQuery = useQuery({ queryKey: ['members'], queryFn: () => listMembers() });
  const deptQuery = useQuery({ queryKey: ['departments'], queryFn: () => listDepartments() });
  const teamsQuery = useQuery({ queryKey: ['teams'], queryFn: () => listTeams() });

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MemberEdit | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const rows = useMemo(() => {
    const all = membersQuery.data ?? [];
    const q = search.trim().toLowerCase();
    return all.filter((m) => {
      const matchQ = !q || m.name.toLowerCase().includes(q) || m.studentId.toLowerCase().includes(q);
      const matchDept = deptFilter === 'all' || m.departmentId === deptFilter;
      const matchTeam = teamFilter === 'all' || m.teamId === teamFilter;
      return matchQ && matchDept && matchTeam;
    });
  }, [membersQuery.data, search, deptFilter, teamFilter]);

  const removeM = useCrudMutation((i: { id: string }) => deleteMember({ data: i }), {
    invalidate: [['members'], ['teams'], ['team'], ['stats']],
    success: '팀원 삭제됨',
    onDone: () => setDeleteTarget(null),
  });

  const departments = deptQuery.data ?? [];
  const teams = teamsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">팀원</h1>
          <p className="mt-1 text-sm text-muted-foreground">전체 참가자</p>
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

      <div className="flex flex-wrap gap-3">
        <Input placeholder="이름·학번 검색" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="학과" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 학과</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={teamFilter} onValueChange={setTeamFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="팀" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 팀</SelectItem>
            {teams.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>학번</TableHead>
              <TableHead>학과</TableHead>
              <TableHead>소속 팀</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="w-24 text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {membersQuery.isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  불러오는 중…
                </TableCell>
              </TableRow>
            )}
            {!membersQuery.isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  결과 없음
                </TableCell>
              </TableRow>
            )}
            {rows.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.name}</TableCell>
                <TableCell className="text-muted-foreground">{m.studentId}</TableCell>
                <TableCell>{m.department.name}</TableCell>
                <TableCell>{m.team.name}</TableCell>
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

      <MemberFormDialog open={formOpen} onOpenChange={setFormOpen} member={editing} />

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
