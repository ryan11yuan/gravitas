"use client";

import { ArrowUpDown, Filter as FilterIcon, Search } from "lucide-react";

export default function ControlsBar({
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
      <label className="flex h-11 flex-1 items-center gap-2 rounded-2xl border border-zinc-800/70 bg-zinc-900/40 px-4 text-zinc-300">
        <Search className="h-4.5 w-4.5 opacity-80" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search assignments..."
          className="w-full bg-transparent text-[14px] outline-none placeholder:text-zinc-500"
        />
      </label>

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
