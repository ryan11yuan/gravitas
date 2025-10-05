"use client";

import type { BaseAssignment } from "@/lib/assignments";
import { useEffect, useMemo, useRef, useState } from "react";
import { computePriorityScore } from "../_utils/priority";
import AssignmentItem from "./assignment-item";
import ControlsBar from "./controls-bar";
import { analyzeAssignment } from "@/lib/ai"; // <-- make sure this path matches your project

type AIEstimate = {
  score: number;          // 0–100 difficulty from Gemini
  etaHours?: number;      // estimated hours
  summary?: string;       // brief AI explanation
};

export default function AssignmentList({
  assignments,
}: {
  assignments: BaseAssignment[] | null;
}) {
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<"score" | "due">("score");
  const [onlyUpcoming, setOnlyUpcoming] = useState(false);

  // Keep AI estimates keyed by assignment id
  const [aiById, setAiById] = useState<Record<string, AIEstimate>>({});
  const analyzingRef = useRef<Set<string>>(new Set()); // avoid duplicate analysis in rapid re-renders

  // Whenever assignments change, analyze them (idempotent per id)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!assignments || assignments.length === 0) return;

      const toAnalyze = assignments.filter((a) => a?.id && !analyzingRef.current.has(a.id) && !aiById[a.id]);
      if (toAnalyze.length === 0) return;

      // mark as in-flight
      toAnalyze.forEach((a) => analyzingRef.current.add(a.id));

      const results = await Promise.allSettled(
        toAnalyze.map(async (a) => {
          const ctx = {
            title: a.title,
            descriptionHtml: a.description ?? null,
            dueAtISO: a.dueAt ?? null,
            course: a.course ?? null,
          };
          const est = await analyzeAssignment(ctx);
          const ai: AIEstimate = {
            score: Math.max(0, Math.min(100, Math.round(Number(est.score ?? 0)))),
            etaHours: Math.max(0, Number(est.estimatedTime ?? 0)),
            summary: typeof est.summary === "string" ? est.summary : "",
          };
          return [a.id, ai] as const;
        })
      );

      if (cancelled) return;

      const next: Record<string, AIEstimate> = {};
      for (const r of results) {
        if (r.status === "fulfilled") {
          const [id, ai] = r.value;
          next[id] = ai;
        }
      }
      if (Object.keys(next).length) {
        setAiById((prev) => ({ ...prev, ...next }));
      }
    })();

    return () => {
      cancelled = true;
    };
    // include assignments and aiById so we only analyze missing ones
  }, [assignments, aiById]);

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
      const hay = `${a.title ?? ""} ${a.course ?? ""} ${a.description ?? ""}`.toLowerCase();
      return hay.includes(q);
    });

    // Prefer AI difficulty for sorting if available; fall back to your local score
    const derivedScore = (x: BaseAssignment) =>
      typeof aiById[x.id]?.score === "number"
        ? aiById[x.id]!.score
        : computePriorityScore(x.dueAt, x.points);

    const dueMs = (x: BaseAssignment) =>
      x.dueAt ? new Date(x.dueAt).getTime() : Number.POSITIVE_INFINITY;

    return sortMode === "score"
      ? items.sort((a, b) => derivedScore(b) - derivedScore(a))
      : items.sort((a, b) => dueMs(a) - dueMs(b));
  }, [assignments, query, sortMode, onlyUpcoming, aiById]);

  return (
    <div className="max-w-5xl space-y-3">
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
        view.map((a, i) => (
          <AssignmentItem
            key={a.id}
            a={a}
            rank={i + 1}
            ai={aiById[a.id]} // <-- pass AI estimates down; AssignmentItem will use/fallback
          />
        ))
      )}
    </div>
  );
}
