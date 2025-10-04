"use client";

import { useState, type KeyboardEvent } from "react";
import { Calendar, Clock, Award, TrendingUp } from "lucide-react";
import { computePriorityScore, pickDifficultyFromScore } from "../_utils/priority";
import type { BaseAssignment } from "@/lib/assignments";

export default function AssignmentItem({ a, rank }: { a: BaseAssignment; rank: number }) {
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
      p-5 md:p-6 pl-7 md:pl-8 ${colors[difficulty].bar}`}
    >
      {/* header */}
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

      {/* expandable */}
      <div
        id={sectionId}
        className={`ml-15 overflow-hidden transition-[grid-template-rows,opacity] duration-200 ease-out ${
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
