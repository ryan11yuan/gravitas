"use client";

import { isCrowdmarkAuthenticated as isCrowdmarkAuthenticated } from "@/lib/crowdmark-client";
import { getQuercusUser, isQuercusAuthenticated } from "@/lib/quercus-client";
import getAssignments, {
  AnalyzedAssignment,
  BaseAssignment,
} from "@/lib/assignments";

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
import { analyzeAssignment } from "@/lib/ai";

export default function Page() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<QuercusUser | null>(null);
  const [assignments, setAssignments] = useState<AnalyzedAssignment[] | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [q, c] = await Promise.allSettled([
        isQuercusAuthenticated(),
        isCrowdmarkAuthenticated(),
      ]);

      const isAuthed = (
        r: PromiseSettledResult<{
          success: boolean;
          data: boolean | null;
          error: any;
        }>
      ) =>
        r.status === "fulfilled" &&
        r.value?.success === true &&
        r.value?.data === true;

      const quercusAuthed = isAuthed(q);
      const crowdmarkAuthed = isAuthed(c);

      if (!quercusAuthed || !crowdmarkAuthed) {
        if (!cancelled) router.replace("/#steps");
        return;
      }

      try {
        const u = await getQuercusUser();
        if (u.success && u.data && !cancelled) setUser(u.data as QuercusUser);
      } catch (_) {
        /* non-fatal */
      }

      if (!cancelled) setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    const preFetch = async () => {
      try {
        const raw = await getAssignments(); // BaseAssignment[]
        if (cancelled) return;

        // Kick off all analyses in parallel, but don’t explode on a single failure.
        const analyzed = await Promise.all(
          raw.map(async (a) => {
            try {
              const analysis = await analyzeAssignment({
                title: a.title,
                descriptionHtml: a.description ?? null,
                dueAtISO: a.dueAt ?? null,
                course: a.course ?? null,
              });

              return { ...a, analysis } as AnalyzedAssignment;
            } catch {
              // fall back to null analysis on error
              return { ...a, analysis: null } as AnalyzedAssignment;
            }
          })
        );

        if (!cancelled) setAssignments(analyzed);
      } catch (e: any) {
        if (!cancelled) {
          setAssignments([]);
          setError(e?.message || "Failed to load assignments");
        }
      }
    };

    preFetch();
    return () => {
      cancelled = true;
    };
  }, []);
  
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user!} assignments={assignments} />
      <SidebarInset>
        <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 bg-background/70 backdrop-blur-md">
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
          <h3 className="ml-5 mt-3 mb-3 text-2xl font-medium">Assignments</h3>

          {error ? (
            <div className="max-w-5xl rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
              {error}
            </div>
          ) : null}

          <AssignmentList assignments={assignments} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
