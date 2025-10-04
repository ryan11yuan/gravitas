"use client";

import React, { useMemo, useState } from "react";
import {
  Clock,
  Calendar,
  TrendingUp,
  Award,
  Filter,
  ArrowUpDown,
  Search,
} from "lucide-react";
import LiquidEther from "../(home)/_components/liquid-either";

type Assignment = {
  id: number;
  rank: number;
  title: string;
  course: string;
  difficulty: "Easy" | "Medium" | "Hard";
  due: string;
  time: string;
  summary: string;
  score: number;
  yourGrade: string;
  classAverage: string;
};

type AssignmentCardProps = {
  assignment: Assignment;
  rank: number;
  isExpanded: boolean;
  onToggle: () => void;
};

const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  rank,
  isExpanded,
  onToggle,
}) => {
  const diffStyles = {
    Easy: {
      text: "text-green-400",
      badgeBg: "bg-green-500/10",
      border: "border-green-500/30",
    },
    Medium: {
      text: "text-yellow-400",
      badgeBg: "bg-yellow-500/10",
      border: "border-yellow-500/30",
    },
    Hard: {
      text: "text-red-400",
      badgeBg: "bg-red-500/10",
      border: "border-red-500/30",
    },
  };
  const styles = diffStyles[assignment.difficulty] ?? diffStyles.Medium;

  return (
    <div
      onClick={onToggle}
      className={`relative bg-zinc-800/50 backdrop-blur-xl border border-zinc-700/50 rounded-2xl p-6 cursor-pointer transition-all duration-500 ease-out hover:border-zinc-700/50 ${
        isExpanded ? "scale-[1.02]" : "hover:scale-[1.01]"
      } font-sf`}
    >
      {/* CONTENT ROW: left meta + right score badge */}
      <div className="flex items-start justify-between gap-6">
        {/* Left: rank chip + text block */}
        <div className="flex min-w-0 flex-1 gap-4">
          {/* Rank chip with number */}
          <div className="mt-1 h-10 w-10 rounded-xl bg-zinc-800 border border-zinc-700 grid place-items-center shrink-0">
            <span className="text-sm font-semibold text-zinc-300">
              #{assignment.rank}
            </span>
          </div>

          {/* Text block */}
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-white mb-1">
              {assignment.title}
            </h3>

            <div className="flex items-center gap-3 text-sm">
              <span className="text-zinc-400">{assignment.course}</span>
              <span className={`${styles.text} font-medium`}>
                {assignment.difficulty}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-6 text-sm text-zinc-400">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{assignment.due}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{assignment.time}</span>
              </div>
            </div>

            <p className="mt-3 text-sm text-zinc-300">{assignment.summary}</p>
          </div>
        </div>

        {/* Right: difficulty-colored score BADGE (not a solid block) */}
        <div className="shrink-0">
          <div
            className={`h-14 w-14 rounded-xl grid place-items-center border ${styles.border} ${styles.badgeBg}`}
            aria-label={`Difficulty score ${assignment.score}`}
          >
            <span
              className={`font-extrabold text-lg leading-none ${styles.text}`}
            >
              {assignment.score}
            </span>
          </div>
        </div>
      </div>

      {/* Expandable Stats */}
      <div
        className={`transition-all duration-500 ease-out overflow-hidden ${
          isExpanded ? "max-h-40 opacity-100 mt-4" : "max-h-0 opacity-0"
        }`}
      >
        <div className="pt-4 border-t border-zinc-800/50 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-green-400" />
            <div>
              <p className="text-xs text-zinc-500">Your Grade</p>
              <p className="text-lg font-semibold text-white">
                {assignment.yourGrade}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <div>
              <p className="text-xs text-zinc-500">Class Average</p>
              <p className="text-lg font-semibold text-white">
                {assignment.classAverage}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function GravitasApp() {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // toolbar state
  const [query, setQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("All"); // All | Easy | Medium | Hard
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortKey, setSortKey] = useState("score"); // score | due | title
  const baseAssignments: Omit<Assignment, "rank">[] = [
    {
      id: 1,
      title: "Economics Problem Set",
      course: "ECO100",
      difficulty: "Medium",
      score: 38,
      due: "Oct 10, 2025",
      time: "2.5 hours",
      summary: "Supply and demand equilibrium analysis",
      yourGrade: "88%",
      classAverage: "82%",
    },
    {
      id: 2,
      title: "Calculus Integration Quiz",
      course: "MAT137",
      difficulty: "Hard",
      score: 42,
      due: "Oct 8, 2025",
      time: "1.5 hours",
      summary: "Advanced integration techniques and applications",
      yourGrade: "92%",
      classAverage: "78%",
    },
    {
      id: 3,
      title: "Python Data Structures Lab",
      course: "CSC148",
      difficulty: "Medium",
      score: 35,
      due: "Oct 12, 2025",
      time: "3 hours",
      summary: "Implement binary search trees and hash tables",
      yourGrade: "85%",
      classAverage: "80%",
    },
    {
      id: 4,
      title: "Chemistry Lab Report",
      course: "CHM135",
      difficulty: "Easy",
      score: 28,
      due: "Oct 15, 2025",
      time: "2 hours",
      summary: "Acid-base titration analysis and conclusions",
      yourGrade: "90%",
      classAverage: "86%",
    },
    {
      id: 5,
      title: "Literature Essay",
      course: "ENG200",
      difficulty: "Medium",
      score: 33,
      due: "Oct 14, 2025",
      time: "4 hours",
      summary: "Symbolism in modern American literature",
      yourGrade: "87%",
      classAverage: "83%",
    },
  ];

  // filter + search + sort + re-rank
  const assignments = useMemo(() => {
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

    const parseDue = (s: string | number | Date) => new Date(s); // relies on readable date strings
    const sorted = [...filtered].sort((a, b) => {
      if (sortKey === "score") return b.score - a.score; // high → low
      if (sortKey === "due")
        return parseDue(a.due).getTime() - parseDue(b.due).getTime(); // soonest first
      if (sortKey === "title") return a.title.localeCompare(b.title);
      return 0;
    });

    // reassign rank based on current order
    return sorted.map((a, idx) => ({ ...a, rank: idx + 1 }));
  }, [baseAssignments, query, difficultyFilter, sortKey]);

  return (
    <div className="min-h-screen bg-black text-white">

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
          <p className="text-zinc-500">
            Assignments ranked by urgency and impact
          </p>
        </div>
        {/* --- Toolbar: Search + Filter + Sort --- */}
        <div className="mb-4 flex items-center gap-3 relative z-40">
          {/* <— add relative z-40 */}
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

          {/* Filter Button + menu */}
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
                {/* <— z-50 */}
                {["All", "Easy", "Medium", "Hard"].map((opt) => (
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

          {/* Sort Button + menu */}
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
                {/* <— z-50 */}
                {[
                  { key: "score", label: "Score (high → low)" },
                  { key: "due", label: "Due date (soonest)" },
                  { key: "title", label: "Title (A → Z)" },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => {
                      setSortKey(opt.key);
                      setSortOpen(false);
                    }}
                    className={`w-full rounded-lg px-3 py-2 text-left hover:bg-zinc-800/60 ${
                      sortKey === opt.key ? "text-white" : "text-zinc-300"
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
          {assignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              rank={assignment.rank}
              isExpanded={expandedId === assignment.id}
              onToggle={() =>
                setExpandedId(
                  expandedId === assignment.id ? null : assignment.id
                )
              }
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
