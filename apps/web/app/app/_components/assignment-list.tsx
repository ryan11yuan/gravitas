"use client";

import getAssignments, { BaseAssignment } from "@/lib/assignments";
import { useEffect, useState } from "react";

export default function AssignmentList() {
  const [assignments, setAssignments] = useState<BaseAssignment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  if (!assignments && !error) {
    // Loading
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/50" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
        {error}
      </div>
    );
  }

  if (!assignments || assignments.length === 0) {
    return (
      <div className="rounded-xl border p-6 text-muted-foreground">
        No assignments found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {assignments.map((a) => (
        <AssignmentItem key={a.id} a={a} />
      ))}
    </div>
  );
}

function AssignmentItem({ a }: { a: BaseAssignment }) {
  const dueText = a.dueAt ? formatDue(a.dueAt) : "No due date";
  const difficulty = pickDifficulty(a.points);
  const score = computePriorityScore(a.dueAt, a.points);

  const srcChip =
    a.src === "quercus"
      ? "border-red-900/50 bg-red-900/20 text-red-300"
      : "border-blue-900/50 bg-blue-900/20 text-blue-300";

  const diffChip =
    difficulty === "Hard"
      ? "border-red-900/50 bg-red-900/20 text-red-300"
      : difficulty === "Medium"
      ? "border-amber-900/50 bg-amber-900/20 text-amber-300"
      : "border-emerald-900/50 bg-emerald-900/20 text-emerald-300";

  const fmtPct = (v: number) => `${v}%`;

  return (
    <div className="group relative rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-4 md:p-5 backdrop-blur-xl transition-all hover:border-zinc-700/70">
      <div className="flex items-start gap-4">
        {/* Priority score ring */}
        <ScoreRing value={score} />

        <div className="min-w-0 flex-1">
          {/* top row: source + course + difficulty */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs ${srcChip}`}>
              {a.src}
            </span>
            <span className="truncate text-sm text-zinc-400">{a.course}</span>
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs ${diffChip}`}
              title={`Difficulty: ${difficulty}`}
            >
              {difficulty}
            </span>
          </div>

          {/* title */}
          <div className="mt-1 truncate text-base md:text-lg font-medium text-zinc-100">{a.title}</div>

          {/* description */}
          {a.description ? (
            <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{a.description}</p>
          ) : null}

          {/* meta row */}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            <span className="rounded-lg border border-zinc-800/70 bg-zinc-900/60 px-2 py-1">{dueText}</span>

            <span className="rounded-lg border border-zinc-800/70 bg-zinc-900/60 px-2 py-1">
              {a.graded ? "Graded" : "Not graded"}
            </span>

            {typeof a.average === "number" ? (
              <span className="rounded-lg border border-zinc-800/70 bg-zinc-900/60 px-2 py-1">
                Assign Avg: {fmtPct(a.average)}
              </span>
            ) : null}

            {typeof a.points === "number" ? (
              <span className="rounded-lg border border-zinc-800/70 bg-zinc-900/60 px-2 py-1">
                {a.points >= 0 && a.points <= 1 ? `${Math.round(a.points * 100)}%` : `${a.points} pts`}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- helpers (same file) ---------- */

function ScoreRing({ value }: { value: number }) {
  const pct = clamp(value, 0, 100);
  const size = 44;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  const ring = pct >= 75 ? "stroke-emerald-400" : pct >= 40 ? "stroke-amber-400" : "stroke-red-400";

  return (
    <div className="relative h-11 w-11">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="stroke-zinc-800" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          className={ring}
          fill="none"
          strokeDasharray={`${dash} ${c - dash}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-[11px] font-medium text-zinc-200">{pct}</div>
    </div>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

type Diff = "Easy" | "Medium" | "Hard";

function pickDifficulty(points?: number | null): Diff {
  const p = points ?? 0;
  if (!isFinite(p)) return "Medium";
  if (p >= 40) return "Hard";
  if (p >= 15) return "Medium";
  return "Easy";
}

function daysUntil(dueISO?: string | null) {
  if (!dueISO) return Infinity;
  const now = Date.now();
  const t = new Date(dueISO).getTime();
  return Math.max(0, Math.ceil((t - now) / (1000 * 60 * 60 * 24)));
}

/** Closer due date + higher points ⇒ higher score (0–100). */
function computePriorityScore(dueISO?: string | null, points?: number | null) {
  const d = daysUntil(dueISO);
  const p = points ?? 0;
  const dueComponent = d === 0 ? 100 : Math.min(100, 40 / (d || 0.5));
  const pointsComponent = Math.min(100, p * 2);
  return Math.round(dueComponent * 0.6 + pointsComponent * 0.4);
}


function formatDue(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Invalid date";
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / 86400000);

  const dateStr = d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (diffDays === 0) return `Due today • ${dateStr}`;
  if (diffDays === 1) return `Due tomorrow • ${dateStr}`;
  if (diffDays > 1) return `Due in ${diffDays} days • ${dateStr}`;
  if (diffDays === -1) return `Overdue by 1 day • ${dateStr}`;
  return `Overdue by ${Math.abs(diffDays)} days • ${dateStr}`;
}
