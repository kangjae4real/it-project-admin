import { createFileRoute } from '@tanstack/react-router';

import { NameEntityManager } from '@/components/name-entity-manager';
import { createLeague, deleteLeague, listLeagues, updateLeague } from '../../server/leagues';

export const Route = createFileRoute('/_authed/leagues')({
  component: LeaguesPage,
});

function LeaguesPage() {
  return (
    <NameEntityManager
      title="리그"
      description="공모전 리그 구분"
      queryKey="leagues"
      countField="teams"
      countLabel="팀 수"
      list={() => listLeagues()}
      create={(input) => createLeague({ data: input })}
      update={(input) => updateLeague({ data: input })}
      remove={(input) => deleteLeague({ data: input })}
    />
  );
}
