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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader className="border-sidebar-border h-16 border-b">
        <NavUser user={data.user} />
      </SidebarHeader>
      <SidebarContent className="gap-0">
        <DatePicker />
        <Dates />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem className="flex flex-col gap-1.5">
            <SidebarMenuButton>
              <RefreshCcw />
              <span>Sync Calendar</span>
            </SidebarMenuButton>
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
