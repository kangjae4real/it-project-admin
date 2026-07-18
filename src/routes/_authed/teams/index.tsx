import { useEffect, useMemo, useState } from 'react';
import { Link, createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCrudMutation } from '@/lib/mutations';
import { createTeam, deleteTeam, listTeams, updateTeam } from '../../../server/teams';
import { listLeagues } from '../../../server/leagues';

export const Route = createFileRoute('/_authed/teams/')({
  component: TeamsPage,
});

type TeamRow = Awaited<ReturnType<typeof listTeams>>[number];

function TeamsPage() {
  const teamsQuery = useQuery({ queryKey: ['teams'], queryFn: () => listTeams() });
  const leaguesQuery = useQuery({ queryKey: ['leagues'], queryFn: () => listLeagues() });

  const [search, setSearch] = useState('');
  const [leagueFilter, setLeagueFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TeamRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TeamRow | null>(null);

  const leagues = leaguesQuery.data ?? [];
  const rows = useMemo(() => {
    const all = teamsQuery.data ?? [];
    return all.filter((t) => {
      const matchName = t.name.toLowerCase().includes(search.trim().toLowerCase());
      const matchLeague = leagueFilter === 'all' || t.leagueId === leagueFilter;
      return matchName && matchLeague;
    });
  }, [teamsQuery.data, search, leagueFilter]);

  const removeM = useCrudMutation((i: { id: string }) => deleteTeam({ data: i }), {
    invalidate: [['teams'], ['stats']],
    success: '팀 삭제됨',
    onDone: () => setDeleteTarget(null),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">팀</h1>
          <p className="mt-1 text-sm text-muted-foreground">참가 팀 목록</p>
        </div>
        <Button
          className="gap-2"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />팀 추가
        </Button>
      </div>

      <div className="flex gap-3">
        <Input placeholder="팀명 검색" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={leagueFilter} onValueChange={setLeagueFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="리그" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 리그</SelectItem>
            {leagues.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">팀번호</TableHead>
              <TableHead>팀명</TableHead>
              <TableHead>리그</TableHead>
              <TableHead className="w-24 text-right">인원</TableHead>
              <TableHead className="w-24 text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamsQuery.isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  불러오는 중…
                </TableCell>
              </TableRow>
            )}
            {!teamsQuery.isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  결과 없음
                </TableCell>
              </TableRow>
            )}
            {rows.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="text-muted-foreground">{t.teamNumber ?? '-'}</TableCell>
                <TableCell className="font-medium">
                  <Link to="/teams/$teamId" params={{ teamId: t.id }} className="hover:text-primary hover:underline">
                    {t.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{t.league.name}</Badge>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">{t._count.members}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="수정"
                      onClick={() => {
                        setEditing(t);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="삭제" onClick={() => setDeleteTarget(t)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <TeamFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        team={editing}
        leagues={leagues}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteTarget?.name} 삭제</AlertDialogTitle>
            <AlertDialogDescription>소속된 팀원이 있으면 삭제할 수 없습니다.</AlertDialogDescription>
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

function TeamFormDialog({
  open,
  onOpenChange,
  team,
  leagues,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: TeamRow | null;
  leagues: Array<{ id: string; name: string }>;
}) {
  const [name, setName] = useState('');
  const [teamNumber, setTeamNumber] = useState('');
  const [leagueId, setLeagueId] = useState('');

  useEffect(() => {
    if (open) {
      setName(team?.name ?? '');
      setTeamNumber(team?.teamNumber ?? '');
      setLeagueId(team?.leagueId ?? '');
    }
  }, [open, team]);

  const invalidate = [['teams'], ['stats'], ['leagues']];
  const createM = useCrudMutation((i: { name: string; teamNumber: string | null; leagueId: string }) => createTeam({ data: i }), {
    invalidate,
    success: '팀 추가됨',
    onDone: () => onOpenChange(false),
  });
  const updateM = useCrudMutation(
    (i: { id: string; name: string; teamNumber: string | null; leagueId: string }) => updateTeam({ data: i }),
    { invalidate, success: '팀 수정됨', onDone: () => onOpenChange(false) },
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { name, teamNumber: teamNumber.trim() ? teamNumber.trim() : null, leagueId };
    if (team) updateM.mutate({ id: team.id, ...payload });
    else createM.mutate(payload);
  }

  const saving = createM.isPending || updateM.isPending;
  const valid = name.trim() && leagueId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{team ? '팀 수정' : '팀 추가'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="t-name">팀명</Label>
              <Input id="t-name" className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            </div>
            <div>
              <Label htmlFor="t-num">팀번호 (선택)</Label>
              <Input id="t-num" className="mt-1.5" value={teamNumber} onChange={(e) => setTeamNumber(e.target.value)} placeholder="예: A-1" />
            </div>
          </div>
          <div>
            <Label>리그</Label>
            <Select value={leagueId} onValueChange={setLeagueId}>
              <SelectTrigger className="mt-1.5 w-full">
                <SelectValue placeholder="리그 선택" />
              </SelectTrigger>
              <SelectContent>
                {leagues.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={saving || !valid}>
              {saving ? '저장 중…' : '저장'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
