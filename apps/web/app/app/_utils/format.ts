export function formatDue(dueISO?: string | null) {
  if (!dueISO) return "No due date";
  const d = new Date(dueISO);

  const parts = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(d);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  let month = get("month");
  if (month === "Sep") month = "Sept";

  const day = get("day");
  const year = get("year");
  const hour = get("hour");
  const minute = get("minute");

  // Prefer the locale's dayPeriod; fallback computes am/pm if missing.
  const fromParts = get("dayPeriod");
  const fallback = d.getHours() < 12 ? "am" : "pm";
  const period = (fromParts || fallback).toLowerCase();

  return `${month} ${day}, ${year} ${hour}:${minute} ${period}`;
}
