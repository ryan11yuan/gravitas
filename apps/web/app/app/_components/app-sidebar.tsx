import { FileUp, Plus, RefreshCcw } from "lucide-react";
import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@workspace/ui/components/sidebar";
import { DatePicker } from "./date-picker";
import Dates from "./dates";
import { NavUser } from "./nav-user";
import { QuercusUser } from "@/common/types/quercus";
import { AnalyzedAssignment } from "@/lib/assignments";

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  calendars: [
    {
      name: "My Calendars",
      items: ["Personal", "Work", "Family"],
    },
    {
      name: "Favorites",
      items: ["Holidays", "Birthdays"],
    },
    {
      name: "Other",
      items: ["Travel", "Reminders", "Deadlines"],
    },
  ],
};

export function AppSidebar({ user, assignments, ...props }: React.ComponentProps<typeof Sidebar> & {user: QuercusUser, assignments: AnalyzedAssignment[] | null}) {
  const [selected, setSelected] = React.useState<Date | undefined>(undefined);
  
  return (
    <Sidebar {...props}>
      <SidebarHeader className="border-sidebar-border h-16 border-b">
        <NavUser user={{
          name: user.name,
          email: "q.utoronto.ca",
          avatar: user.avatar_url
        }} />
      </SidebarHeader>
      <SidebarContent className="gap-0">
        <DatePicker
          assignments={assignments}
          selected={selected}
          onSelect={(d) => setSelected(d ?? undefined)}
        />
        <Dates assignments={assignments} selectedDate={selected} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem className="flex flex-col gap-1.5">
            <SidebarMenuButton className="bg-primary hover:bg-primary/90 active:bg-primary/90">
              <FileUp />
              <span>Export Calendar</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
