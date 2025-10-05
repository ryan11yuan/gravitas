// dates.tsx
"use client";

import { useMemo } from "react";
import {
  SidebarGroup,
  SidebarGroupContent,
} from "@workspace/ui/components/sidebar";
import { AnalyzedAssignment } from "@/lib/assignments";

function isSameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function DatesSkeleton() {
  return (
    <div className="flex w-full flex-col gap-1.5 px-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="relative rounded-md p-1 pl-6 after:absolute after:inset-y-2 after:left-2 after:w-1 after:rounded-full after:bg-muted-foreground/30"
        >
          <div className="animate-pulse space-y-1">
            <div className="h-3 w-3/4 rounded bg-muted-foreground/20" />
            <div className="h-2.5 w-1/2 rounded bg-muted-foreground/15" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Dates({
  assignments,
  selectedDate,
}: {
  assignments: AnalyzedAssignment[] | null;
  selectedDate?: Date;
}) {
  // Show skeleton while loading assignments
  if (assignments === null) {
    return (
      <SidebarGroup className="px-0 py-0 overflow-x-hidden mt-2">
        <SidebarGroupContent>
          <DatesSkeleton />
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  const items = useMemo(() => {
    if (!selectedDate || !assignments?.length) return [];
    return assignments.filter((a) => {
      if (!a.dueAt) return false;
      const d = new Date(a.dueAt);
      return !Number.isNaN(d.getTime()) && isSameLocalDay(d, selectedDate);
    });
  }, [assignments, selectedDate]);

  return (
    <SidebarGroup className="px-0 py-0 overflow-x-hidden">
      <SidebarGroupContent>
        {!selectedDate ? (
          <div className="px-3 py-2 text-xs text-muted-foreground">
            Pick a date to see what’s due.
          </div>
        ) : items.length === 0 ? (
          <div className="px-3 py-2 text-xs text-muted-foreground">
            Nothing due on this day.
          </div>
        ) : (
          <div className="flex w-full flex-col gap-1.5 px-2">
            {items.map((a) => (
              <div
                key={`${a.title}-${a.dueAt ?? "na"}`}
                className="flex flex-col bg-muted after:bg-primary/70 relative rounded-md p-1 pl-6 text-sm after:absolute after:inset-y-2 after:left-2 after:w-1 after:rounded-full"
              >
                <span className="font-medium text-[13px] truncate">
                  {a.title}
                </span>
                <span className="text-[11px] text-muted-foreground truncate">
                  {a.course}
                </span>
              </div>
            ))}
          </div>
        )}
      </SidebarGroupContent>
    </SidebarGroup>
  );
}