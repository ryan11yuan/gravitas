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
  const due = a.dueAt ? formatDue(a.dueAt) : "No due date";

  const fmtPct = (v: number) => `${v}%`;

  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border p-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs ${
              a.src === "quercus"
                ? "bg-red-500/10 text-red-600 dark:text-red-400"
                : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
            }`}
          >
            {a.src}
          </span>
          <span className="truncate text-sm text-muted-foreground">
            {a.course}
          </span>
        </div>

        <div className="mt-1 truncate text-base font-medium">{a.title}</div>

        {a.description ? (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {a.description}
          </p>
        ) : null}

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-md border px-2 py-0.5">{due}</span>

          <span className="rounded-md border px-2 py-0.5">
            {a.graded ? "Graded" : "Not graded"}
          </span>

          {typeof a.average === "number" ? (
            <span className="rounded-md border px-2 py-0.5 bg-blue-500/30 text-white">
              Assign Avg: {fmtPct(a.average)}
            </span>
          ) : null}

          {typeof a.points === "number" ? (
            <span className="rounded-md border px-2 py-0.5 bg-blue-500/70 text-white">
              {a.points >= 0 && a.points <= 1
                ? `${Math.round(a.points * 100)}%`
                : `${a.points} pts`}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
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
