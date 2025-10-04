// DatePicker.tsx
"use client";

import dynamic from "next/dynamic";
import {
  SidebarGroup,
  SidebarGroupContent,
} from "@workspace/ui/components/sidebar";

const ClientCalendar = dynamic(
  () => import("@workspace/ui/components/calendar").then(m => m.Calendar),
  { ssr: false }
);

export function DatePicker() {
  // Example JSON (ISO strings). Replace with your actual data source.
  const highlightedDatesJson = ["2025-10-04", "2025-10-10", "2025-10-18"];

  // Convert to Date[]
  const highlightedDates = highlightedDatesJson.map(d => new Date(d));

  return (
    <SidebarGroup className="px-0 py-0">
      <SidebarGroupContent>
        <ClientCalendar
          mode="single"
          // 👇 feed the dates to a custom modifier named "hasItems"
          modifiers={{ hasItems: highlightedDates }}
          className="bg-sidebar border-b select-none
                     [&_[role=gridcell]]:cursor-pointer
                     [&_[role=gridcell]]:w-[33px]"
        />
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
