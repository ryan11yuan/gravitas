// DatePicker.tsx
"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
} from "@workspace/ui/components/sidebar";
import dynamic from "next/dynamic";
import { CalendarSkeleton } from "./calendar-skeleton";

const ClientCalendar = dynamic(
  () => import("@workspace/ui/components/calendar").then((m) => m.Calendar),
  {
    ssr: false,
    loading: () => (
      <CalendarSkeleton className="bg-sidebar border-b select-none" />
    ),
  }
);

export function DatePicker() {
  const highlightedDatesJson = ["2025-10-04", "2025-10-10", "2025-10-18"];
  const highlightedDates = highlightedDatesJson.map((d) => new Date(d));

  return (
    <SidebarGroup className="px-0 py-0">
      <SidebarGroupContent>
        <ClientCalendar
          mode="single"
          modifiers={{ hasItems: highlightedDates }}
          className="bg-sidebar select-none
                     [&_[role=gridcell]]:cursor-pointer
                     [&_[role=gridcell]]:w-[33px]"
        />
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
