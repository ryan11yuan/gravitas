import {
  SidebarGroup,
  SidebarGroupContent,
} from "@workspace/ui/components/sidebar";

type AssignmentItem = {
  course: string;      // e.g., "CSCA67"
  title: string;       // e.g., "Problem Set 2"
  href?: string;
};

const assignments: AssignmentItem[] = [
  { course: "CSCA67", title: "Problem Set 2", href: "#" },
  { course: "CSCA08", title: "Lab 3: Loops & Lists", href: "#" },
  { course: "MATA31", title: "Quiz 1: Limits", href: "#" },
];

export default function Dates() {
  return (
    <SidebarGroup className="px-0 py-0">
      <SidebarGroupContent>
        {assignments.map((a, i) => (
          <a
            key={`${a.course}-${i}`}
            href={a.href ?? "#"}
            title={`${a.title} • ${a.course}`}
            className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground block border-b last:border-b-0 px-2 py-1.5"
          >
            <div className="flex flex-col gap-0.5 leading-snug">
              <span className="font-medium text-[13px] truncate">{a.title}</span>
              <span className="text-[11px] text-muted-foreground truncate">{a.course}</span>
            </div>
          </a>
        ))}
      </SidebarGroupContent>
    </SidebarGroup>
  );
}