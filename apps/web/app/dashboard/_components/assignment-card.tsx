"use client";

import React from "react";
import { Clock, Calendar, TrendingUp, Award } from "lucide-react";

export type Assignment = {
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
  isExpanded: boolean;
  onToggle: () => void;
};

const diffStyles = {
  Easy: { text: "text-green-400", badgeBg: "bg-green-500/10", border: "border-green-500/30" },
  Medium:{ text: "text-yellow-400", badgeBg:"bg-yellow-500/10", border:"border-yellow-500/30"},
  Hard: { text: "text-red-400",   badgeBg: "bg-red-500/10",  border: "border-red-500/30" },
} as const;

export default function AssignmentCard({ assignment, isExpanded, onToggle }: AssignmentCardProps) {
  const styles = diffStyles[assignment.difficulty] ?? diffStyles.Medium;

  return (
    <div
      onClick={onToggle}
      className={`relative bg-zinc-800/50 backdrop-blur-xl border border-zinc-700/50 rounded-2xl p-6 cursor-pointer transition-all duration-500 ease-out hover:border-zinc-700/50 ${
        isExpanded ? "scale-[1.02]" : "hover:scale-[1.01]"
      } font-sf`}
    >
      {/* Row: left meta + right score badge */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex min-w-0 flex-1 gap-4">
          {/* Rank chip */}
          <div className="mt-1 h-10 w-10 rounded-xl bg-zinc-800 border border-zinc-700 grid place-items-center shrink-0">
            <span className="text-sm font-semibold text-zinc-300">#{assignment.rank}</span>
          </div>

          {/* Text block */}
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-white mb-1">{assignment.title}</h3>

            <div className="flex items-center gap-3 text-sm">
              <span className="text-zinc-400">{assignment.course}</span>
              <span className={`${styles.text} font-medium`}>{assignment.difficulty}</span>
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

        {/* Score badge */}
        <div className="shrink-0">
          <div
            className={`h-14 w-14 rounded-xl grid place-items-center border ${styles.border} ${styles.badgeBg}`}
            aria-label={`Difficulty score ${assignment.score}`}
          >
            <span className={`font-extrabold text-lg leading-none ${styles.text}`}>{assignment.score}</span>
          </div>
        </div>
      </div>

      {/* Expandable stats */}
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
              <p className="text-lg font-semibold text-white">{assignment.yourGrade}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <div>
              <p className="text-xs text-zinc-500">Class Average</p>
              <p className="text-lg font-semibold text-white">{assignment.classAverage}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
