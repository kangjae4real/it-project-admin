// 참가 신청 응답 xlsx → DB import.
// 사용법: npm run db:import -- "<xlsx 경로>" ["<시트명>"]
// 멱등: 실행 시 기존 팀/팀원을 모두 지우고 새로 넣는다. 리그/학과(고정)는 유지.
import { readFileSync } from 'node:fs';

import * as XLSX from 'xlsx';

import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const FILE = process.argv[2];
const SHEET = process.argv[3] || '설문지 응답 시트1의 사본';
if (!FILE) {
  console.error('usage: npm run db:import -- "<xlsx 경로>" ["<시트명>"]');
  process.exit(1);
}

const COL = {
  team: '참가를 희망하는 팀의 팀명을 기재해 주세요.',
  league: '참가를 희망하는 리그를 선택해 주세요.',
  leader: '팀장의 학과, 학번, 이름을 기재해 주세요.',
  members: '팀원 전원의 학과, 학번, 이름을 모두 기재해 주세요.',
  phone: '팀장의 연락처를 기재해 주세요.',
};

type Person = { dept: string; sid: string; name: string };

function normalizeDept(d: string): string {
  const t = d.trim();
  if (t.includes('글로벌미디어')) return '글로벌미디어학부';
  if (t.includes('디지털미디어')) return '디지털미디어학과';
  return t;
}

// "학과 / 학번 / 이름[ / 역할]" 또는 공백 구분 "학과 학번 이름". 앞 3개만 사용.
function parsePerson(raw: string): Person | null {
  const s = String(raw).trim();
  if (!s) return null;
  const parts = (s.includes('/') ? s.split('/') : s.split(/\s+/)).map((p) => p.trim()).filter(Boolean);
  if (parts.length < 3) return null;
  return { dept: normalizeDept(parts[0]), sid: parts[1], name: parts[2] };
}

function splitMembers(raw: unknown): Array<string> {
  return String(raw ?? '')
    .split(/[\r\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const prisma = new PrismaClient({
  adapter: new PrismaLibSql({ url: process.env.DATABASE_URL || 'file:./dev.db', authToken: process.env.DATABASE_AUTH_TOKEN }),
});

async function main() {
  const wb = XLSX.read(readFileSync(FILE), { type: 'buffer' });
  const ws = wb.Sheets[SHEET];
  if (!ws) throw new Error(`시트 "${SHEET}" 없음. 있는 시트: ${wb.SheetNames.join(', ')}`);
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null });

  // 고정 리그/학과 보장 + 이름→id 맵.
  for (const name of ['비기너 리그', '프로 리그']) {
    await prisma.league.upsert({ where: { name }, update: {}, create: { name } });
  }
  for (const name of ['글로벌미디어학부', '디지털미디어학과']) {
    await prisma.department.upsert({ where: { name }, update: {}, create: { name } });
  }
  const leagueId = new Map((await prisma.league.findMany()).map((l) => [l.name, l.id]));
  const deptId = new Map((await prisma.department.findMany()).map((d) => [d.name, d.id]));

  // 멱등: 기존 팀/팀원 제거 (팀원 먼저 — FK).
  await prisma.member.deleteMany({});
  await prisma.team.deleteMany({});

  const warnings: Array<string> = [];
  let teamCount = 0;
  let memberCount = 0;
  let leaderCount = 0;

  for (const r of rows) {
    const teamName = String(r[COL.team] ?? '').trim();
    if (!teamName) continue;
    const leagueName = String(r[COL.league] ?? '').trim();
    const lid = leagueId.get(leagueName);
    if (!lid) {
      warnings.push(`팀 "${teamName}": 알 수 없는 리그 "${leagueName}" → 건너뜀`);
      continue;
    }

    const leader = r[COL.leader] ? parsePerson(String(r[COL.leader])) : null;
    const phone = r[COL.phone] ? String(r[COL.phone]).trim() : null;
    const rawMembers = splitMembers(r[COL.members]).map(parsePerson).filter((p): p is Person => !!p);

    // 팀장 + 팀원, 학번으로 중복 제거(팀장이 팀원목록에 또 있는 경우 대비).
    const people: Array<Person & { isLeader: boolean }> = [];
    const seen = new Set<string>();
    if (leader) {
      people.push({ ...leader, isLeader: true });
      seen.add(leader.sid);
    }
    for (const m of rawMembers) {
      if (seen.has(m.sid)) continue;
      seen.add(m.sid);
      people.push({ ...m, isLeader: false });
    }
    if (people.length === 0) {
      warnings.push(`팀 "${teamName}": 파싱된 인원 0명 → 건너뜀`);
      continue;
    }

    const team = await prisma.team.create({ data: { name: teamName, leagueId: lid } });
    teamCount++;
    for (const p of people) {
      const did = deptId.get(p.dept);
      if (!did) {
        warnings.push(`팀 "${teamName}" / ${p.name}(${p.sid}): 알 수 없는 학과 "${p.dept}" → 팀원 건너뜀`);
        continue;
      }
      await prisma.member.create({
        data: {
          name: p.name,
          studentId: p.sid,
          departmentId: did,
          teamId: team.id,
          isLeader: p.isLeader,
          phone: p.isLeader ? phone : null,
        },
      });
      memberCount++;
      if (p.isLeader) leaderCount++;
    }
  }

  console.log(`✅ import 완료: 팀 ${teamCount}개, 팀원 ${memberCount}명(팀장 ${leaderCount}명)`);
  if (warnings.length) {
    console.log(`⚠️  경고 ${warnings.length}건:`);
    warnings.forEach((w) => console.log('   - ' + w));
  } else {
    console.log('경고 없음.');
  }
}

main()
  .catch((e) => {
    console.error('❌ import 실패:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
