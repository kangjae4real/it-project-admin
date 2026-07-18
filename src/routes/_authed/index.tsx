import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';

import { getStats } from '../../server/stats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/_authed/')({
  component: Dashboard,
});

function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['stats'], queryFn: () => getStats() });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">대시보드</h1>
        <p className="mt-1 text-sm text-muted-foreground">공모전 현황 요약</p>
      </div>

      {isLoading || !data ? (
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="총 팀" value={data.teamCount} />
            <StatCard label="총 인원" value={data.memberCount} />
            <StatCard label="팀장" value={data.leaderCount} />
            <StatCard label="중도하차" value={data.droppedCount} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <DistributionCard title="학과별 인원" rows={data.byDepartment} />
            <DistributionCard title="리그별 팀" rows={data.byLeague} />
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-normal text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

function DistributionCard({ title, rows }: { title: string; rows: Array<{ name: string; count: number }> }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 && <p className="text-sm text-muted-foreground">데이터 없음</p>}
        {rows.map((r) => (
          <div key={r.name} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-foreground">{r.name}</span>
              <span className="text-muted-foreground">{r.count}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(r.count / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
