"use client";

import React, { useMemo, useState } from "react";
import LiquidEther from "../(home)/_components/liquid-either";
import AssignmentCard, { Assignment } from "./_components/assignment-card";
import { baseAssignments } from "./_data/assignments";
import { Filter, ArrowUpDown, Search } from "lucide-react";

type SortKey = "score" | "due" | "title";

export default function DashboardPage() {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // toolbar state
  const [query, setQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] =
    useState<"All" | "Easy" | "Medium" | "Hard">("All");
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("score");

  // filter + search + sort + re-rank
  const assignments: Assignment[] = useMemo(() => {
    const q = query.trim().toLowerCase();

    const filtered = baseAssignments.filter((a) => {
      const matchesQ =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.course.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q);
      const matchesDiff =
        difficultyFilter === "All" || a.difficulty === difficultyFilter;
      return matchesQ && matchesDiff;
    });

    const parseDue = (s: string | number | Date) => new Date(s).getTime();
    const sorted = [...filtered].sort((a, b) => {
      if (sortKey === "score") return b.score - a.score;
      if (sortKey === "due") return parseDue(a.due) - parseDue(b.due);
      if (sortKey === "title") return a.title.localeCompare(b.title);
      return 0;
    });

    return sorted.map((a, idx) => ({ ...a, rank: idx + 1 }));
  }, [query, difficultyFilter, sortKey]);

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
          <h1 className="text-2xl font-light tracking-tight">gravitas</h1>
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

        {/* Cards */}
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
              No assignments match your filters.
            </div>
          )}
        </div>
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
