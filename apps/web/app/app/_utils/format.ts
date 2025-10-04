export function formatDue(dueISO?: string | null) {
  if (!dueISO) return "No due date";
  const d = new Date(dueISO);

  // Use the user's local time. We'll drop AM/PM and seconds.
  const parts = new Intl.DateTimeFormat(undefined, {
    month: "short",   // "Sep"
    day: "numeric",   // "15"
    year: "numeric",  // "2025"
    hour: "numeric",  // "11"
    minute: "2-digit",// "59"
    hour12: true,     // get 12h but we'll remove AM/PM below
  }).formatToParts(d);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  // Build "Sep 15, 2025 11:59" (no AM/PM)
  let month = get("month");
  // optional: make "Sep" → "Sept" if you prefer that spelling
  if (month === "Sep") month = "Sept";

  const day = get("day");
  const year = get("year");
  const hour = get("hour");
  const minute = get("minute");

  return `${month} ${day}, ${year} ${hour}:${minute}`;
}
