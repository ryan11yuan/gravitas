"use client";

import type { AnalyzedAssignment } from "@/lib/assignments";
import { useMemo, useState } from "react";
import { computePriorityScore } from "../_utils/priority";
import AssignmentItem from "./assignment-item";
import ControlsBar from "./controls-bar";

export default function AssignmentList({
  assignments,
}: {
  assignments: AnalyzedAssignment[] | null;
}) {
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<"score" | "due">("score");
  const [onlyUpcoming, setOnlyUpcoming] = useState(false);

  const view = useMemo(() => {
    const q = query.trim().toLowerCase();

    let items = (assignments ?? []).filter((a) => {
      if (onlyUpcoming) {
        const due = a.dueAt
          ? new Date(a.dueAt).getTime()
          : Number.POSITIVE_INFINITY;
        if (due < Date.now()) return false;
      }
      if (!q) return true;
      const hay =
        `${a.title ?? ""} ${a.course ?? ""} ${a.description ?? ""}`.toLowerCase();
      return hay.includes(q);
    });

    const derivedScore = (x: AnalyzedAssignment) => {
      return typeof x.analysis?.score === "number"
        ? x.analysis?.score
        : computePriorityScore(x.dueAt, x.points);
    };

    const dueMs = (x: AnalyzedAssignment) =>
      x.dueAt ? new Date(x.dueAt).getTime() : Number.POSITIVE_INFINITY;

    return sortMode === "score"
      ? items.sort((a, b) => derivedScore(b) - derivedScore(a))
      : items.sort((a, b) => dueMs(a) - dueMs(b));
  }, [assignments, query, sortMode, onlyUpcoming]);

  return (
    <div className="max-w-[68rem] space-y-3">
      <ControlsBar
        query={query}
        setQuery={setQuery}
        sortMode={sortMode}
        setSortMode={setSortMode}
        onlyUpcoming={onlyUpcoming}
        setOnlyUpcoming={setOnlyUpcoming}
      />

      {assignments === null ? (
        <div className="max-w-full ml-5 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl border border-zinc-800/60 bg-zinc-900/40"
            />
          ))}
        </div>
      ) : view.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-400">
          No assignments found.
        </div>
      ) : (
        view.map((a, i) => <AssignmentItem key={a.id} a={a} rank={i + 1} ai={a.analysis} />)
      )}
    </div>
  );
}
