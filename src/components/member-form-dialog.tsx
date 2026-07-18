import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCrudMutation } from '@/lib/mutations';
import { listDepartments } from '../server/departments';
import { listTeams } from '../server/teams';
import { createMember, updateMember } from '../server/members';

export type MemberEdit = {
  id: string;
  name: string;
  studentId: string;
  departmentId: string;
  teamId: string;
  isLeader: boolean;
  contact: string | null;
  droppedOut: boolean;
};

type FormState = {
  name: string;
  studentId: string;
  departmentId: string;
  teamId: string;
  isLeader: boolean;
  droppedOut: boolean;
  contact: string;
};

const empty = (teamId = ''): FormState => ({
  name: '',
  studentId: '',
  departmentId: '',
  teamId,
  isLeader: false,
  droppedOut: false,
  contact: '',
});

export function MemberFormDialog({
  open,
  onOpenChange,
  member,
  lockedTeamId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: MemberEdit | null;
  lockedTeamId?: string;
}) {
  const deptQuery = useQuery({ queryKey: ['departments'], queryFn: () => listDepartments(), enabled: open });
  const teamQuery = useQuery({ queryKey: ['teams'], queryFn: () => listTeams(), enabled: open });

  const [form, setForm] = useState<FormState>(empty());

  useEffect(() => {
    if (!open) return;
    if (member) {
      setForm({
        name: member.name,
        studentId: member.studentId,
        departmentId: member.departmentId,
        teamId: member.teamId,
        isLeader: member.isLeader,
        droppedOut: member.droppedOut,
        contact: member.contact ?? '',
      });
    } else {
      setForm(empty(lockedTeamId ?? ''));
    }
  }, [open, member, lockedTeamId]);

  const invalidate = [['members'], ['teams'], ['team'], ['departments'], ['stats']];
  const createM = useCrudMutation((i: NonNullable<Parameters<typeof createMember>[0]>['data']) => createMember({ data: i }), {
    invalidate,
    success: '팀원 추가됨',
    onDone: () => onOpenChange(false),
  });
  const updateM = useCrudMutation((i: NonNullable<Parameters<typeof updateMember>[0]>['data']) => updateMember({ data: i }), {
    invalidate,
    success: '팀원 수정됨',
    onDone: () => onOpenChange(false),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      studentId: form.studentId,
      departmentId: form.departmentId,
      teamId: form.teamId,
      isLeader: form.isLeader,
      droppedOut: form.droppedOut,
      contact: form.contact.trim() ? form.contact.trim() : null,
    };
    if (member) updateM.mutate({ id: member.id, ...payload });
    else createM.mutate(payload);
  }

  const saving = createM.isPending || updateM.isPending;
  const valid = form.name.trim() && form.studentId.trim() && form.departmentId && form.teamId;
  const departments = deptQuery.data ?? [];
  const teams = teamQuery.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{member ? '팀원 수정' : '팀원 추가'}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="m-name">이름</Label>
              <Input id="m-name" className="mt-1.5" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
            </div>
            <div>
              <Label htmlFor="m-sid">학번</Label>
              <Input id="m-sid" className="mt-1.5" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>학과</Label>
              <Select value={form.departmentId} onValueChange={(v) => setForm({ ...form, departmentId: v })}>
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue placeholder="학과 선택" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>소속 팀</Label>
              <Select value={form.teamId} onValueChange={(v) => setForm({ ...form, teamId: v })} disabled={!!lockedTeamId}>
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue placeholder="팀 선택" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="m-contact">연락처 (선택)</Label>
            <Input id="m-contact" className="mt-1.5" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="전화 / 이메일 / 카톡" />
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.isLeader} onCheckedChange={(v) => setForm({ ...form, isLeader: v === true })} />
              팀장
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.droppedOut} onCheckedChange={(v) => setForm({ ...form, droppedOut: v === true })} />
              중도하차
            </label>
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
