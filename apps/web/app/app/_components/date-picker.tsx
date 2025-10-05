// DatePicker.tsx
"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
} from "@workspace/ui/components/sidebar";
import dynamic from "next/dynamic";
import { CalendarSkeleton } from "./calendar-skeleton";
import { AnalyzedAssignment } from "@/lib/assignments";

const ClientCalendar = dynamic(
  () => import("@workspace/ui/components/calendar").then((m) => m.Calendar),
  {
    ssr: false,
    loading: () => (
      <CalendarSkeleton className="bg-sidebar border-b select-none" />
    ),
  }
);

export function DatePicker({
  assignments,
  selected,
  onSelect,
}: {
  assignments: AnalyzedAssignment[] | null;
  selected?: Date;
  onSelect?: (date?: Date) => void;
}) {
  if (assignments == null) {
    return <CalendarSkeleton className="bg-sidebar border-b select-none" />;
  }

  const isValidDate = (d: unknown): d is Date =>
    d instanceof Date && !Number.isNaN(d.getTime());

  const highlightedDates: Date[] = Array.from(
    new Set(
      assignments
        .map((a) => (a.dueAt ? new Date(a.dueAt) : undefined))
        .filter(isValidDate)
        .map((d) => d.getTime())
    )
  ).map((t) => new Date(t));

  return (
    <SidebarGroup className="px-0 py-0">
      <SidebarGroupContent>
        <ClientCalendar
          mode="single"
          selected={selected}
          onSelect={onSelect}
          modifiers={{ hasItems: highlightedDates }}
          className="bg-sidebar select-none
                     [&_[role=gridcell]]:cursor-pointer
                     [&_[role=gridcell]]:w-[33px]"
        />
      </SidebarGroupContent>
    </SidebarGroup>
  );
}