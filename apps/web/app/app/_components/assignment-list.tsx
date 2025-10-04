"use client";

import getAssignments, { BaseAssignment } from "@/lib/assignments";
import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { Calendar, Clock, Award, TrendingUp, Search, Filter as FilterIcon, ArrowUpDown } from "lucide-react";

/* ---------------- Assignment List ---------------- */

export default function AssignmentList() {
  const [assignments, setAssignments] = useState<BaseAssignment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Controls bar state
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<"score" | "due">("score");
  const [onlyUpcoming, setOnlyUpcoming] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getAssignments();
        setAssignments(res);
      } catch (e: any) {
        setError(e?.message || "Failed to load assignments");
        setAssignments([]);
      }
    })();
  }, []);

  // ✅ Compute the derived view BEFORE any early returns to keep hook order stable
  const view = useMemo(() => {
    if (!assignments) return [];
    const q = query.trim().toLowerCase();

    let items = assignments.filter((a) => {
      if (onlyUpcoming) {
        const due = a.dueAt ? new Date(a.dueAt).getTime() : Number.POSITIVE_INFINITY;
        if (due < Date.now()) return false;
      }
      if (!q) return true;
      const hay = `${a.title ?? ""} ${a.course ?? ""} ${a.description ?? ""}`.toLowerCase();
      return hay.includes(q);
    });

    const score = (x: BaseAssignment) => computePriorityScore(x.dueAt, x.points);
    const dueMs = (x: BaseAssignment) =>
      x.dueAt ? new Date(x.dueAt).getTime() : Number.POSITIVE_INFINITY;

    items =
      sortMode === "score"
        ? items.sort((a, b) => score(b) - score(a))
        : items.sort((a, b) => dueMs(a) - dueMs(b));

    return items;
  }, [assignments, query, sortMode, onlyUpcoming]);

  // ---------------- RENDER ----------------

  if (!assignments && !error) {
    return (
      <div className="max-w-4xl space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-zinc-900/40 border border-zinc-800/60" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
        {error}
      </div>
    );
  }

  if (!view || view.length === 0) {
    return (
      <div className="max-w-4xl space-y-3">
        {/* Controls bar appears even if empty, as requested */}
        <ControlsBar
          query={query}
          setQuery={setQuery}
          sortMode={sortMode}
          setSortMode={setSortMode}
          onlyUpcoming={onlyUpcoming}
          setOnlyUpcoming={setOnlyUpcoming}
        />
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-400">No assignments found.</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-3">
      {/* Place this bar right below your “Assignments” text/title */}
      <ControlsBar
        query={query}
        setQuery={setQuery}
        sortMode={sortMode}
        setSortMode={setSortMode}
        onlyUpcoming={onlyUpcoming}
        setOnlyUpcoming={setOnlyUpcoming}
      />
      {view.map((a, i) => (
        <AssignmentItem key={a.id} a={a} rank={i + 1} />
      ))}
    </div>
  );
}

/* ---------------- Controls Bar (UI only) ---------------- */

function ControlsBar({
  query,
  setQuery,
  sortMode,
  setSortMode,
  onlyUpcoming,
  setOnlyUpcoming,
}: {
  query: string;
  setQuery: (v: string) => void;
  sortMode: "score" | "due";
  setSortMode: (v: "score" | "due") => void;
  onlyUpcoming: boolean;
  setOnlyUpcoming: (v: boolean) => void;
}) {
  return (
    <div className="ml-5 mb-5 flex items-center gap-3">
      {/* Search input */}
      <label className="flex h-11 flex-1 items-center gap-2 rounded-2xl border border-zinc-800/70 bg-zinc-900/40 px-4 text-zinc-300">
        <Search className="h-4.5 w-4.5 opacity-80" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search assignments..."
          className="w-full bg-transparent text-[14px] outline-none placeholder:text-zinc-500"
        />
      </label>

      {/* Filter button (demo: toggles upcoming only) */}
      <button
        type="button"
        onClick={() => setOnlyUpcoming(!onlyUpcoming)}
        className={`inline-flex h-11 items-center gap-2 rounded-2xl border px-4 text-[14px] ${
          onlyUpcoming
            ? "border-sky-800/60 bg-sky-900/20 text-sky-300"
            : "border-zinc-800/70 bg-zinc-900/40 text-zinc-300 hover:bg-zinc-900/60"
        }`}
        title="Filter"
      >
        <FilterIcon className="h-4.5 w-4.5" />
        <span>Filter</span>
      </button>

      {/* Sort button (score ↔ due) */}
      <button
        type="button"
        onClick={() => setSortMode(sortMode === "score" ? "due" : "score")}
        className="inline-flex h-11 items-center gap-2 rounded-2xl border border-zinc-800/70 bg-zinc-900/40 px-4 text-[14px] text-zinc-300 hover:bg-zinc-900/60"
        title="Sort"
      >
        <ArrowUpDown className="h-4.5 w-4.5" />
        <span>Sort</span>
        <span className="ml-1 text-zinc-400">({sortMode === "score" ? "Score" : "Due"})</span>
      </button>
    </div>
  );
}

/* ---------------- Card + helpers (unchanged layout/feel) ---------------- */

function AssignmentItem({ a, rank }: { a: BaseAssignment; rank: number }) {
  const [open, setOpen] = useState(false);

  const score = computePriorityScore(a.dueAt, a.points);
  const difficulty = pickDifficultyFromScore(score);
  const dueText = a.dueAt ? a.dueAt : "No due date";
  const srcLabel = a.src === "quercus" ? "Quercus assignment" : "Crowdmark assignment";

  const youPct =
    typeof a.points === "number"
      ? a.points >= 0 && a.points <= 1
        ? `${Math.round(a.points * 100)}%`
        : `${a.points} pts`
      : "—";
  const classAvg = typeof a.average === "number" ? `${Math.round(a.average)}%` : "—";

  const colors = {
    Easy:   { bar: "border-emerald-600/50", chip: "text-emerald-400 bg-emerald-900/15 border-emerald-800/60", pill: "border-emerald-900/50 bg-emerald-900/20 text-emerald-400" },
    Medium: { bar: "border-amber-600/60",   chip: "text-amber-300 bg-amber-900/15 border-amber-800/60",     pill: "border-amber-900/50 bg-amber-900/20 text-amber-300"   },
    Hard:   { bar: "border-red-600/60",     chip: "text-red-300 bg-red-900/15 border-red-800/60",           pill: "border-red-900/50 bg-red-900/20 text-red-300"         },
  } as const;

  const sectionId = `stats-${a.id}`;
  const toggle = () => setOpen((v) => !v);
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={open}
      aria-controls={sectionId}
      onClick={toggle}
      onKeyDown={onKey}
      className={`ml-5 group relative cursor-pointer select-none rounded-2xl border border-zinc-800/70 bg-zinc-950/70
      backdrop-blur-sm transition-colors hover:border-zinc-700/70
      p-5 md:p-6 pl-7 md:pl-8 border-l-4 ${colors[difficulty].bar}`}
    >
      <div className="flex items-stretch justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="shrink-0 grid place-items-center rounded-xl border border-zinc-800/70 bg-zinc-900/60 px-2.5 py-1.5 text-[11px] text-zinc-300">
            <span className="font-medium">#{rank}</span>
          </div>
          <div className="min-w-0 flex-1 pl-1.5 md:pl-2">
            <div className="text-[17px] md:text-[20px] font-semibold text-zinc-50 leading-snug truncate">
              {a.title}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px]">
              <span className="truncate text-zinc-400">{a.course}</span>
              <span
                className={`inline-flex items-center rounded-md border px-2.5 py-1 text-[12px] font-semibold tracking-wide uppercase ${colors[difficulty].chip}`}
                title={`Difficulty: ${difficulty}`}
              >
                {difficulty}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-zinc-400">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800/70 bg-zinc-900/50 px-2 py-1">
                <Calendar className="h-3.5 w-3.5" />
                <span className="tabular-nums">{dueText}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800/70 bg-zinc-900/50 px-2 py-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{a.dueAt ? "Scheduled" : "TBD"}</span>
              </span>
            </div>
            <p className="mt-2 text-[13px] leading-snug text-zinc-400 line-clamp-2">
              {a.description?.trim() || srcLabel}
            </p>
          </div>
        </div>
        <div className="shrink-0 self-center">
          <div className={`grid h-14 w-14 place-items-center rounded-xl border ${colors[difficulty].pill}`}>
            <span className="text-xl font-extrabold tabular-nums">{score}</span>
          </div>
        </div>
      </div>

      <div
        id={sectionId}
        className={`overflow-hidden transition-[grid-template-rows,opacity] duration-200 ease-out ${
          open ? "grid grid-rows-[1fr] opacity-100" : "grid grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0">
          <hr className="my-4 border-zinc-800/70" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Award className="h-4 w-4 text-emerald-400" />
                <span>Your Grade</span>
              </div>
              <div className="text-2xl font-semibold text-zinc-100">
                You: <span className="tabular-nums">{youPct}</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <TrendingUp className="h-4 w-4 text-sky-400" />
                <span>Class Average</span>
              </div>
              <div className="text-2xl font-semibold text-zinc-100">
                <span className="tabular-nums">{classAvg}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- helpers ---------------- */

type Diff = "Easy" | "Medium" | "Hard";
function pickDifficultyFromScore(score: number): Diff {
  if (score >= 70) return "Hard";
  if (score > 50 && score < 70) return "Medium";
  return "Easy";
}
function daysUntil(dueISO?: string | null) {
  if (!dueISO) return Infinity;
  const now = Date.now();
  const t = new Date(dueISO).getTime();
  return Math.max(0, Math.ceil((t - now) / (1000 * 60 * 60 * 24)));
}
function computePriorityScore(dueISO?: string | null, points?: number | null) {
  const d = daysUntil(dueISO);
  const p = points ?? 0;
  const dueComponent = d === 0 ? 100 : Math.min(100, 40 / (d || 0.5));
  const pointsComponent = Math.min(100, p * 2);
  return Math.round(dueComponent * 0.6 + pointsComponent * 0.4);
}
