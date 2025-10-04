"use client";

import { isCrowdmarkAuthenticated as isCrowdmarkAuthenticated } from "@/lib/crowdmark-client";
import { getQuercusUser, isQuercusAuthenticated } from "@/lib/quercus-client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@workspace/ui/components/breadcrumb";
import { Separator } from "@workspace/ui/components/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar";
import { Spinner } from "@workspace/ui/components/spinner";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppSidebar } from "./_components/app-sidebar";
import { QuercusUser } from "@/common/types/quercus";
import { Badge } from "@workspace/ui/components/badge";
import { Check } from "lucide-react";
import AssignmentList from "./_components/assignment-list";

export default function Page() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<QuercusUser | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [q, c] = await Promise.allSettled([
        isQuercusAuthenticated(),
        isCrowdmarkAuthenticated(),
      ]);

      const quercusErrored =
        q.status === "rejected" ||
        (q.status === "fulfilled" && (!q.value.success || q.value.error));

      const crowdmarkErrored =
        c.status === "rejected" ||
        (c.status === "fulfilled" && (!c.value.success || c.value.error));

      if (quercusErrored || crowdmarkErrored) {
        if (!cancelled) router.replace("/#steps");
        return;
      }

      if (!quercusErrored && !crowdmarkErrored) {
        const u = await getQuercusUser();
        if (u.success && u.data && !cancelled) {
          setUser(u.data as QuercusUser);
        }
      }

      if (!cancelled) {
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user!} />
      <SidebarInset>
        <header
          className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 
  bg-background/70 backdrop-blur-md"
        >
          <SidebarTrigger className="-ml-1" />
          <div className="flex gap-2">
            <Badge className="bg-red-900/30">
              Connected to Quercus <Check />
            </Badge>
            <Badge className="bg-blue-900/30">
              Crowdmark <Check />
            </Badge>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <h3 className="text-2xl font-medium ml-5 mb-3 mt-3">Assignments</h3>
          <AssignmentList />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
