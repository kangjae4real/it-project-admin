import { createFileRoute } from '@tanstack/react-router';

import { NameEntityManager } from '@/components/name-entity-manager';
import { createDepartment, deleteDepartment, listDepartments, updateDepartment } from '../../server/departments';

export const Route = createFileRoute('/_authed/departments')({
  component: DepartmentsPage,
});

function DepartmentsPage() {
  return (
    <NameEntityManager
      title="학과"
      description="참가 학과"
      queryKey="departments"
      countField="members"
      countLabel="팀원 수"
      list={() => listDepartments()}
      create={(input) => createDepartment({ data: input })}
      update={(input) => updateDepartment({ data: input })}
      remove={(input) => deleteDepartment({ data: input })}
    />
  );
}
