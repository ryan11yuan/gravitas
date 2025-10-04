import { cn } from "@workspace/ui/lib/utils";

export function CalendarSkeleton({
  className,
}: { className?: string }) {
  // 7 columns × (caption bar + weekday row + 6 weeks)
  const Day = () => (
    <div className="h-[var(--cell-size)] w-[var(--cell-size)] rounded-md bg-muted/50" />
  );

  return (
    <div
      data-slot="calendar"
      className={cn(
        "w-fit bg-background p-3 animate-pulse",
        // keep sizing identical to the real Calendar
        "[--cell-size:--spacing(8)]", // matches your Calendar default
        className
      )}
    >
      {/* Nav / caption */}
      <div className="relative h-[var(--cell-size)] w-full px-[var(--cell-size)]">
        <div className="absolute inset-x-0 top-0 flex items-center justify-between">
          <div className="h-[var(--cell-size)] w-[var(--cell-size)] rounded-md bg-muted/50" />
          <div className="h-5 w-24 rounded bg-muted/50" />
          <div className="h-[var(--cell-size)] w-[var(--cell-size)] rounded-md bg-muted/50" />
        </div>
      </div>

      {/* Weekday headers */}
      <div className="mt-2 grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={`wd-${i}`}
            className="h-4 rounded bg-muted/40"
          />
        ))}
      </div>

      {/* 6 weeks × 7 days */}
      <div className="mt-2 grid grid-rows-6 gap-1">
        {Array.from({ length: 6 }).map((_, r) => (
          <div key={`row-${r}`} className="grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }).map((_, c) => (
              <Day key={`d-${r}-${c}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}