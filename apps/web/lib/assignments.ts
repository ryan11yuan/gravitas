import {
  isQuercusAuthenticated,
  getQuercusCourses,
  getQuercusCourseAssignments,
} from "./quercus-client";
import {
  isCrowdmarkAuthenticated,
  getCrowdmarkCourses,
  getCrowdmarkAssignments,
  getCrowdmarkCourseStatistics,
} from "./crowdmark-client";
import type { QuercusAssignment, QuercusCourse } from "@/common/types/quercus";
import type {
  CrowdmarkAssignment,
  CrowdmarkCourse,
  CrowdmarkExamMaster,
  CrowdmarkAssignmentsResponse,
  CrowdmarkCourseStatistics,
} from "@/common/types/crowdmark";
import { LLMEstimate } from "./ai";

export interface BaseAssignment {
  id: string;
  src: "quercus" | "crowdmark";
  course: string;
  title: string;
  description?: string;
  points?: number | null;
  dueAt?: string | null;
  graded?: boolean;
  average?: number | null;
}

export type AnalyzedAssignment = BaseAssignment & {
  analysis: LLMEstimate | null;
};

const randomQuercusAvg = () => 80 + Math.floor(Math.random() * 16);

const iso = (s?: string | null) =>
  !s ? s : isNaN(new Date(s).getTime()) ? null : new Date(s).toISOString();
const num = (v: any) =>
  typeof v === "number"
    ? Number.isFinite(v)
      ? v
      : null
    : typeof v === "string"
      ? Number.isFinite(+v)
        ? +v
        : null
      : null;
const examTitleMap = (inc?: CrowdmarkExamMaster[]) =>
  (inc || []).reduce<Record<string, string>>((m, e) => {
    if (e?.id && e?.attributes?.title) m[e.id] = e.attributes.title;
    return m;
  }, {});

const mapQuercus = (c: QuercusCourse, a: QuercusAssignment): BaseAssignment => {
  const sub: any = (a as any).submission ?? null;
  const total = (a.points_possible as number | null | undefined) ?? null;
  const score = typeof sub?.score === "number" ? (sub.score as number) : null;
  const normalized = score != null && total ? Math.max(0, Math.min(1, score / total)) : null;

  return {
    id: `quercus:${a.id}`,
    src: "quercus",
    course: c.name ?? String(c.id),
    title: (a.name ?? `Assignment ${a.id}`).toString(),
    description: (a as any).description,
    points: normalized, // 0..1 when graded, else null
    dueAt: iso(a.due_at as string | undefined | null) ?? null,
    graded: typeof sub?.score === "number" || !!(sub?.graded_at || sub?.posted_at),
    average: randomQuercusAvg(),
  };
};


const indexCrowdmarkAverages = (stats?: CrowdmarkCourseStatistics) => {
  const map = new Map<string, number>();
  if (!stats?.assessments) return map;
  for (const a of stats.assessments) {
    if (a?.scoreUuid) map.set(a.scoreUuid, a.averageScore);
  }
  return map;
};

const isUuid = (s?: any) =>
  typeof s === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

const mapCrowdmark = (
  c: CrowdmarkCourse,
  a: CrowdmarkAssignment,
  titles: Record<string, string>,
  avgByScoreUuid: Map<string, number>
): BaseAssignment => {
  const at: any = a.attributes ?? a;
  const emId = a.relationships?.["exam-master"]?.data?.id;

  const scoreUuid = at?.["score-uuid"];
  const hasUuid = isUuid(scoreUuid);
  const avg = hasUuid ? num(avgByScoreUuid.get(scoreUuid)) : null;

  return {
    id: `crowdmark:${a.id}`,
    src: "crowdmark",
    course: (c as any)?.attributes?.name ?? (c as any)?.name ?? String(c.id),
    title: String(titles[emId!] ?? emId ?? `Assignment ${a.id}`),
    description:
      (at?.instructions as string | undefined) ??
      (at?.["additional-instructions"] as string | undefined) ??
      undefined,
    points: hasUuid ? (num(at?.["normalized-points"]) ?? num(at?.points) ?? null) : null,
    dueAt: iso(at?.due) ?? null,
    graded: !!(at?.["marks-sent-at"] || hasUuid),
    average: typeof avg === "number" ? avg : null,
  };
};

async function fetchQuercusAssignments(): Promise<BaseAssignment[]> {
  const out: BaseAssignment[] = [];
  const a = await isQuercusAuthenticated();
  if (!a.success || !a.data) return out;
  const cr = await getQuercusCourses();
  if (!cr.success || !cr.data) return out;
  const rs = await Promise.allSettled(
    cr.data.map(async (c) => {
      const ar = await getQuercusCourseAssignments(c.id as number);
      return ar.success && ar.data ? ar.data.map((x) => mapQuercus(c, x)) : [];
    })
  );
  for (const r of rs) if (r.status === "fulfilled") out.push(...r.value);
  return out;
}

async function fetchCrowdmarkAssignments(): Promise<BaseAssignment[]> {
  const out: BaseAssignment[] = [];
  const a = await isCrowdmarkAuthenticated();
  if (!a.success || !a.data) return out;

  const cr = await getCrowdmarkCourses();
  if (!cr.success || !cr.data) return out;

  const rs = await Promise.allSettled(
    cr.data.map(async (c) => {
      // fetch assignments
      const ar = await getCrowdmarkAssignments(String(c.id));
      if (!ar.success || !ar.data) return [];

      // fetch stats (for averages)
      const sr = await getCrowdmarkCourseStatistics(String(c.id));
      const avgIndex = indexCrowdmarkAverages(sr.success && sr.data != null ? sr.data : undefined);

      const payload = ar.data as CrowdmarkAssignmentsResponse;
      const titles = examTitleMap(payload.included);
      return (payload.data || []).map((x) => mapCrowdmark(c, x, titles, avgIndex));
    })
  );

  for (const r of rs) if (r.status === "fulfilled") out.push(...r.value);
  return out;
}

export default async function getAssignments(): Promise<BaseAssignment[]> {
  const [qs, cs] = await Promise.allSettled([
    fetchQuercusAssignments(),
    fetchCrowdmarkAssignments(),
  ]);
  const list: [...BaseAssignment[]] = [];
  if (qs.status === "fulfilled") list.push(...qs.value);
  if (cs.status === "fulfilled") list.push(...cs.value);
  list.sort((a, b) => {
    const ad = a.dueAt ? +new Date(a.dueAt) : Infinity,
      bd = b.dueAt ? +new Date(b.dueAt) : Infinity;
    return ad !== bd ? ad - bd : (b.points ?? -1) - (a.points ?? -1);
  });
  return list;
}