import {
  SidebarGroup,
  SidebarGroupContent,
} from "@workspace/ui/components/sidebar";

type AssignmentItem = {
  course: string; // e.g., "CSCA67"
  title: string; // e.g., "Problem Set 2"
  href?: string;
};

const assignments: AssignmentItem[] = [
  { course: "CSCA67", title: "Problem Set 2", href: "#" },
  { course: "CSCA08", title: "Lab 3: Loops & Lists", href: "#" },
  { course: "MATA31", title: "Quiz 1: Limits", href: "#" },
];

export default function Dates() {
  return (
    <SidebarGroup className="px-0 py-0 overflow-x-hidden">
      <SidebarGroupContent>
        <div className="flex w-full flex-col gap-1.5 px-2">
          {assignments.map((event) => (
            <div
              key={event.title}
              className="flex flex-col bg-muted after:bg-primary/70 relative rounded-md p-1 pl-6 text-sm after:absolute after:inset-y-2 after:left-2 after:w-1 after:rounded-full"
            >
              <span className="font-medium text-[13px] truncate">
                {event.title}
              </span>
              <span className="text-[11px] text-muted-foreground truncate">
                {event.course}
              </span>
            </div>
          ))}
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
