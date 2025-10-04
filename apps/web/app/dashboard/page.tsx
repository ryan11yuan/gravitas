"use client";

import React, { useEffect, useMemo, useState } from "react";
import LiquidEther from "../(home)/_components/liquid-either";
import AssignmentCard, { Assignment } from "./_components/assignment-card";
import { Filter, ArrowUpDown, Search } from "lucide-react";

// Quercus
import {
  getCourses as getQuercusCourses,
  getCourseAssignments,
  isAuthenticated as isQuercusAuthenticated,
} from "@/integrations/quercus";

// Crowdmark
import {
  getCourses as getCrowdmarkCourses,
  getAssignments as getCrowdmarkAssignments,
  getCourseStatistics as getCrowdmarkCourseStatistics,
  isAuthenticated as isCrowdmarkAuthenticated,
} from "@/integrations/crowdmark";
import { formatYourGrade } from "@/utils/format-quercus-grade";

type SortKey = "score" | "due" | "title";
type Difficulty = "Easy" | "Medium" | "Hard";

export default function DashboardPage() {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // toolbar state
  const [query, setQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] =
    useState<"All" | Difficulty>("All");
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("score");

  // data state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawAssignments, setRawAssignments] = useState<Assignment[]>([]);
  const [quercusSignedIn, setQuercusSignedIn] = useState(false);
  const [crowdmarkSignedIn, setCrowdmarkSignedIn] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // Check auth first (non-fatal if one is false)
        const [qAuth, cAuth] = await Promise.all([
          isQuercusAuthenticated(),
          isCrowdmarkAuthenticated(),
        ]);
        if (mounted) {
          setQuercusSignedIn(Boolean(qAuth.success && qAuth.data));
          setCrowdmarkSignedIn(Boolean(cAuth.success && cAuth.data));
        }

        const results: Assignment[] = [];

        // ==== QUERCUS ====
        if (qAuth.success && qAuth.data) {
          const qCoursesRes = await getQuercusCourses();
          if (qCoursesRes.success && qCoursesRes.data) {
            const qAssignmentsArrays = await Promise.all(
              qCoursesRes.data.map((course) => getQuercusAssignmentsNormalized(course.id, course.name))
            );
            qAssignmentsArrays.forEach((arr) => results.push(...arr));
          }
        }

        // ==== CROWDMARK ====
        if (cAuth.success && cAuth.data) {
          const cmCoursesRes = await getCrowdmarkCourses();
          if (cmCoursesRes.success && cmCoursesRes.data) {
            // Fetch stats per course once, then assignments, then map
            const perCourseData = await Promise.all(
              cmCoursesRes.data.map(async (course) => {
                const [statsRes, assignsRes] = await Promise.all([
                  getCrowdmarkCourseStatistics(course.id),
                  getCrowdmarkAssignments(course.id),
                ]);
                return {
                  course,
                  stats: statsRes.success ? statsRes.data : null,
                  assignments: assignsRes.success ? assignsRes.data : [],
                };
              })
            );

            perCourseData.forEach(({ course, stats, assignments }) => {
              const mapped = mapCrowdmarkAssignmentsToUI(
                course.attributes.name,
                assignments ?? [],
                stats ?? null
              );
              results.push(...mapped);
            });
          }
        }

        // If neither signed in, show helpful error
        if (!qAuth.data && !cAuth.data) {
          setError(
            "Not signed in to Quercus or Crowdmark. Open each site once in this browser so the extension can fetch with your cookies."
          );
        }

        if (mounted) setRawAssignments(results);
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Failed to load assignments.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  // filter + search + sort + re-rank
  const assignments: Assignment[] = useMemo(() => {
    const q = query.trim().toLowerCase();

    const filtered = rawAssignments.filter((a) => {
      const matchesQ =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.course.toLowerCase().includes(q) ||
        (a.summary ?? "").toLowerCase().includes(q);
      const matchesDiff =
        difficultyFilter === "All" || a.difficulty === difficultyFilter;
      return matchesQ && matchesDiff;
    });

    const parseDue = (s: string | number | Date | undefined) =>
      s ? new Date(s).getTime() : Number.POSITIVE_INFINITY;

    const sorted = [...filtered].sort((a, b) => {
      if (sortKey === "score") return b.score - a.score;
      if (sortKey === "due") return parseDue(a.due) - parseDue(b.due);
      if (sortKey === "title") return a.title.localeCompare(b.title);
      return 0;
    });

    return sorted.map((a, idx) => ({ ...a, rank: idx + 1 }));
  }, [query, difficultyFilter, sortKey, rawAssignments]);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background (same as home) */}
      <div className="fixed inset-0 -z-10">
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
          <LiquidEther
            colors={["#5227FF", "#FF9FFC", "#B19EEF"]}
            mouseForce={20}
            cursorSize={100}
            isViscous={false}
            viscous={30}
            iterationsViscous={32}
            iterationsPoisson={32}
            resolution={0.6}
            isBounce={false}
            autoDemo
            autoSpeed={0.5}
            autoIntensity={2.2}
            takeoverDuration={0.25}
            autoResumeDelay={3000}
            autoRampDuration={0.6}
          />
        </div>
        <div className="absolute inset-0 bg-white/6 pointer-events-none" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/50 bg-zinc-900/10 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-light tracking-tight">gravitas</h1>

            {/* tiny auth badges */}
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`rounded-md px-2 py-1 border ${
                  quercusSignedIn
                    ? "border-green-500/40 text-green-400"
                    : "border-zinc-700/60 text-zinc-400"
                }`}
                title="Quercus"
              >
                Quercus {quercusSignedIn ? "✓" : "•"}
              </span>
              <span
                className={`rounded-md px-2 py-1 border ${
                  crowdmarkSignedIn
                    ? "border-green-500/40 text-green-400"
                    : "border-zinc-700/60 text-zinc-400"
                }`}
                title="Crowdmark"
              >
                Crowdmark {crowdmarkSignedIn ? "✓" : "•"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8 font-sf">
          <h2 className="text-3xl font-semibold mb-2">Priority Queue</h2>
          <p className="text-zinc-500">Assignments ranked by urgency and impact</p>
        </div>

        {/* Toolbar: Search + Filter + Sort */}
        <div className="mb-4 flex items-center gap-3 relative z-40">
          {/* Search */}
          <div className="relative flex-1 max-w-100px">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search assignments…"
              className="w-full rounded-xl border border-zinc-700/60 bg-zinc-800/60 pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-700"
            />
          </div>

          {/* Filter */}
          <div className="relative">
            <button
              onClick={() => {
                setFilterOpen((v) => !v);
                setSortOpen(false);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-700/60 bg-zinc-800/60 px-3 py-2 text-sm text-zinc-200 hover:border-zinc-700"
              aria-haspopup="menu"
              aria-expanded={filterOpen}
            >
              <Filter className="h-4 w-4" />
              Filter
            </button>
            {filterOpen && (
              <div className="absolute right-0 mt-2 w-40 rounded-xl border border-zinc-700/60 bg-zinc-800/80 backdrop-blur-xl p-1 text-sm shadow-xl z-50">
                {(["All", "Easy", "Medium", "Hard"] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setDifficultyFilter(opt);
                      setFilterOpen(false);
                    }}
                    className={`w-full rounded-lg px-3 py-2 text-left hover:bg-zinc-800/60 ${
                      difficultyFilter === opt ? "text-white" : "text-zinc-300"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort */}
          <div className="relative">
            <button
              onClick={() => {
                setSortOpen((v) => !v);
                setFilterOpen(false);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-700/60 bg-zinc-800/60 px-3 py-2 text-sm text-zinc-200 hover:border-zinc-700"
              aria-haspopup="menu"
              aria-expanded={sortOpen}
            >
              <ArrowUpDown className="h-4 w-4" />
              Sort
            </button>
            {sortOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-zinc-800/60 bg-zinc-900/80 backdrop-blur-xl p-1 text-sm shadow-xl z-50">
                {[
                  { key: "score", label: "Score (high → low)" },
                  { key: "due", label: "Due date (soonest)" },
                  { key: "title", label: "Title (A → Z)" },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => {
                      setSortKey(opt.key as SortKey);
                      setSortOpen(false);
                    }}
                    className={`w-full rounded-lg px-3 py-2 text-left hover:bg-zinc-800/60 ${
                      sortKey === (opt.key as SortKey) ? "text-white" : "text-zinc-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        {loading && (
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-6 text-zinc-400">
            Loading assignments…
          </div>
        )}
        {error && !loading && (
          <div className="rounded-xl border border-red-900/60 bg-red-950/30 p-6 text-red-300">
            {error}
          </div>
        )}

        {/* Cards */}
        {!loading && !error && (
          <div className="space-y-4">
            {assignments.map((a) => (
              <AssignmentCard
                key={a.id}
                assignment={a}
                isExpanded={expandedId === a.id}
                onToggle={() => setExpandedId(expandedId === a.id ? null : a.id)}
              />
            ))}
            {assignments.length === 0 && (
              <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-6 text-zinc-400">
                No assignments found. Try signing into Quercus and Crowdmark in this browser.
              </div>
            )}
          </div>
        )}
      </main>

      {/* SF Pro utility */}
      <style>{`
        .font-sf {
          font-family:
            "SF Pro", "SF Pro Text", "SF Pro Display",
            -apple-system, BlinkMacSystemFont, "Segoe UI",
            Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue",
            Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol",
            sans-serif;
        }
      `}</style>
    </div>
  );
}

/* =========================
   Normalizers / Mappers
   ========================= */

function hashToNumber(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function stripHtml(html?: string | null) {
  if (!html) return "";
  if (typeof window === "undefined") return html.replace(/<[^>]*>/g, " ");
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || div.innerText || "").trim();
}

function toPct(n?: number | null) {
  if (n == null || !isFinite(n)) return "—";
  return Math.round(n);
}

function daysUntil(dueISO?: string | null) {
  if (!dueISO) return Infinity;
  const now = Date.now();
  const t = new Date(dueISO).getTime();
  return Math.max(0, Math.ceil((t - now) / (1000 * 60 * 60 * 24)));
}

function pickDifficulty(points?: number | string | null): "Easy" | "Medium" | "Hard" {
  const p = typeof points === "string" ? Number(points) : points ?? 0;
  if (!isFinite(p)) return "Medium";
  if (p >= 40) return "Hard";
  if (p >= 15) return "Medium";
  return "Easy";
}

/** Simple heuristic: closer due date + higher points → higher score */
function computePriorityScore(dueISO?: string | null, points?: number | string | null) {
  const d = daysUntil(dueISO);
  const p = typeof points === "string" ? Number(points) : points ?? 0;
  const dueComponent = d === 0 ? 100 : Math.min(100, 40 / (d || 0.5)); // today = max urgency
  const pointsComponent = Math.min(100, p * 2); // scale points
  return Math.round(dueComponent * 0.6 + pointsComponent * 0.4);
}

/* ---------- Quercus ---------- */

async function getQuercusAssignmentsNormalized(courseId: number, courseName: string) {
  const res = await getCourseAssignments(courseId);
  if (!res.success || !res.data) return [] as Assignment[];

  return res.data.map<Assignment>((a) => {
    const g = formatYourGrade(a); // { text, color }, we use text
    const pts = a.points_possible ?? undefined;
    const dueISO = a.due_at ?? undefined;

    return {
      id: hashToNumber(`q-${a.id}`),
      title: a.name ?? "Untitled",
      course: courseName || `Course ${courseId}`,
      difficulty: pickDifficulty(pts),
      score: computePriorityScore(dueISO, pts),
      due: dueISO ?? "",
      time: "", // unknown from API
      summary: "Quercus assignment",
      yourGrade: g.text,
      classAverage: "—", // Canvas doesn't expose class avg here
      rank: 0, // filled later
    };
  });
}

/* ---------- Crowdmark ---------- */

function mapCrowdmarkAssignmentsToUI(
  courseName: string,
  assignments: import("@/types/crowdmark").CrowdmarkAssignment[] | { data?: any } | null | undefined,
  stats: import("@/types/crowdmark").CrowdmarkCourseStatistics | null
): Assignment[] {
  // Normalize: accept [] or { data: [] } or null
  const list: import("@/types/crowdmark").CrowdmarkAssignment[] = Array.isArray(assignments)
    ? assignments
    : assignments && typeof assignments === "object" && Array.isArray((assignments as any).data)
    ? (assignments as any).data
    : [];

  // Safety: if shape was unexpected, warn once (doesn't break UI)
  if (!Array.isArray(assignments) && !(assignments && Array.isArray((assignments as any).data))) {
    console.warn("[Crowdmark] Unexpected assignments payload shape:", assignments);
  }

  // Build lookup from scoreUuid -> { my, avg }
  const scoreMap = new Map<string, { myScore: number | null; averageScore: number | null }>();
  if (stats?.assessments && Array.isArray(stats.assessments)) {
    for (const a of stats.assessments) {
      if (!a?.scoreUuid) continue;
      scoreMap.set(a.scoreUuid, {
        myScore: a.myScore ?? null,
        averageScore: a.averageScore ?? null,
      });
    }
  }

  return list.map<Assignment>((a) => {
    const at = a.attributes;
    const dueISO = at.due;
    const normalized = at["normalized-points"];
    const diff = pickDifficulty(normalized);

    let yourGrade = "You: —";
    let classAvg = "—";
    const uuid = at["score-uuid"];
    if (uuid && scoreMap.has(uuid)) {
      const rec = scoreMap.get(uuid)!;
      const my = rec.myScore ?? null;
      const avg = rec.averageScore ?? null;
      yourGrade = my == null ? "You: —" : `You: ${toPct(my)}%`;
      classAvg = avg == null ? "—" : `${toPct(avg)}%`;
    }

    return {
      id: hashToNumber(`c-${a.id}`),
      title: a.relationships["exam-master"].data.id ?? "Crowdmark assessment",
      course: courseName,
      difficulty: diff,
      score: computePriorityScore(dueISO, normalized),
      due: dueISO ?? "",
      time: "",
      summary: "Crowdmark assessment",
      yourGrade,
      classAverage: classAvg,
      rank: 0,
    };
  });
}