// lib/export-calendar.ts
import { createEvents, EventAttributes } from "ics";
import type { AnalyzedAssignment } from "@/lib/assignments";

/**
 * Convert a JS Date -> [YYYY, M, D, H, m] in UTC for ICS.
 */
function dateToUTCArray(d: Date): [number, number, number, number, number] {
  return [
    d.getUTCFullYear(),
    d.getUTCMonth() + 1,
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
  ];
}

/**
 * Build ICS text for the given assignments.
 * Each assignment becomes a 1-hour event at its dueAt time.
 * If you want all-day events instead, pass `asAllDay = true`.
 */
export function buildAssignmentsICS(
  assignments: AnalyzedAssignment[],
  opts?: {
    calendarName?: string;
    asAllDay?: boolean;
    includeAlarms?: boolean;
  }
): { error?: string; value?: string } {
  const { calendarName = "Quercus Assignments", asAllDay = false, includeAlarms = true } =
    opts || {};

  const events: EventAttributes[] = assignments
    .filter((a) => !!a.dueAt)
    .map((a) => {
      const due = new Date(a.dueAt!);
      if (Number.isNaN(due.getTime())) return null;

      if (asAllDay) {
        // All-day event on the due date (no time component)
        return {
          title: a.title || "Assignment",
          startInputType: "utc",
          endInputType: "utc",
          // all-day uses date arrays without H/M
          start: [due.getUTCFullYear(), due.getUTCMonth() + 1, due.getUTCDate()],
          end: [due.getUTCFullYear(), due.getUTCMonth() + 1, due.getUTCDate() + 1],
          description:
            a.analysis?.summary ||
            a.description ||
            "Assignment due",
          categories: a.course ? ["Assignment", a.course] : ["Assignment"],
          calName: calendarName,
          status: "CONFIRMED",
          alarms: includeAlarms
            ? [
                {
                  action: "display",
                  trigger: { hours: 24, minutes: 0, before: true }, // 24h before
                  description: "Assignment due tomorrow",
                },
              ]
            : undefined,
        } as EventAttributes;
      }

      // Timed 1-hour event at the due time
      const startArr = dateToUTCArray(due);
      const endDate = new Date(due.getTime() + 60 * 60 * 1000);
      const endArr = dateToUTCArray(endDate);

      return {
        title: a.title || "Assignment",
        startInputType: "utc",
        endInputType: "utc",
        start: startArr,
        end: endArr,
        description:
          a.analysis?.summary ||
          a.description ||
          "Assignment due",
        categories: a.course ? ["Assignment", a.course] : ["Assignment"],
        calName: calendarName,
        status: "CONFIRMED",
        // add a default 1h-before reminder
        alarms: includeAlarms
          ? [
              {
                action: "display",
                trigger: { hours: 1, minutes: 0, before: true },
                description: "Assignment due in 1 hour",
              },
            ]
          : undefined,
      } as EventAttributes;
    })
    .filter(Boolean) as EventAttributes[];

  if (events.length === 0) return { error: "No assignments with valid due dates." };

  const { error, value } = createEvents(events);
  if (error) return { error: String(error) };
  return { value: value as string };
}

/**
 * Trigger a download of the ICS text in the browser.
 */
export function downloadICS(icsText: string, filename = "quercus-assignments.ics") {
  const blob = new Blob([icsText], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}