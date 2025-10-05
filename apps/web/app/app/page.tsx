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
        const matches = [
          {
            title: "Assignment 1",
            course: "CSCA08H3 F 20259:Introduction to Computer Science I",
            pdfContent: "",
          },
          {
            title: "Assignment 4",
            course: "MATA31H3 F 20259:Calculus I for Mathematical Sciences",
            pdfContent: `
            University of Toronto Scarborough MATA31
Assignment #4-Fall 2025
Read sections 1.1 & 1.2
Solve the following problems. While all are important, submit only those
highlighted in red. Your TA will mark the assignment and return it the next
week. In addition to accuracy, ensure that your solutions include full details
and explanations to avoid losing marks. This assignment is due during the
week of October 6–October 10, at the beginning of your tutorial, and is
worth 4%.
Important note: You must include your first name, last name,
and student number at the top of your solutions and staple all pages
together before submitting. This will help prevent your work from
being lost.
1.1: 2, 6, 10, 24, 26, 28, 30, 32, 34, 38, 54, 64, 66, 78, 80
1.2: 1, 2, 7, 8, 14, 68, 69, 70
A. Consider the linear function
f (x) = 3x + 1.
We know intuitively that
lim
x→−1 f (x) = −2.
(a) How close to -1 does x have to be such that f (x) differs from -2
by less than 0.1?
(b) How close to -1 does x have to be such that f (x) differs from -2
by less than 0.01?
(c) How close to -1 does x have to be such that f (x) differs from -2
by less than 0.001?
B. Provide the formal definition of the limit
lim
x→a f (x) = L
in two ways: one using intervals and one using absolute value inequal-
ities. Use this definition to prove that
lim
x→3(2x + 4) = 10.
C. Provide the formal definition of the infinite limit
lim
x→a+ f (x) = ∞
in two ways: one using intervals and one using relevant inequalities.
Use this definition to prove that
lim
x→1+
1
x − 1 = ∞.
MATA31 page 2
D. Provide the formal definition of the limit at infinity
lim
x→∞ f (x) = L
in two ways: one using intervals and one using relevant inequalities.
Use this definition to prove that
lim
x→∞
2
x + 1 = 0.
E. Provide the formal definition of the infinite limit at infinity
lim
x→∞ f (x) = ∞
in two ways: one using intervals and one using relevant inequalities.
Use this definition to prove that
lim
x→∞(x2 + 1) = ∞.
F. Find the equation of a possible function f with f (0) = 5, limx→1+ f (x) =
∞ and limx→1− f (x) = ∞.
G. Does
lim
x→2
|x − 2|
x − 2
exist? Explain why or why not.
H. Find limx→3 f (x) if it exists. Otherwise, explain by one-sided limits.
f (x) =
 x2, if x ≤ 3
3x + 2, if x > 3
            `,
          },
          {
            title: "Assignment 3",
            course: "MATA31H3 F 20259:Calculus I for Mathematical Sciences",
            pdfContent: `
            University of Toronto Scarborough MATA31
            Assignment #3-Fall 2025
            Read sections 0.5
            Solve the following problems. While all are important, submit only those
            highlighted in red. Your TA will mark the assignment and return it the next
            week. In addition to accuracy, ensure that your solutions include full details
            and explanations to avoid losing marks. This assignment is due during the
            week of September 29–October 3, at the beginning of your tutorial, and
            is worth 4%.
            Important note: You must include your first name, last name,
            and student number at the top of your solutions and staple all
            pages together before submitting.This will help prevent your work
            from getting lost.
            0.5: 2, 4, 17, 18, 19, 20, 21, 22, 24, 26, 28, 35, 36, 48, 50, 54, 58, 60, 62,
            64, 72, 74, 76, 77, 80, 86
            1.A Prove that logk(ab) = logk(a) + logk(b), k > 0, k ̸ = 1 and a, b are any
            two positive numbers.
            1.B Provide a counter-example to show that the relation
            logk(a + b) = logk(a) + logk(b)
            is not true.
            2. Given that 0 ≤ a ≤ b, show that
            a ≤ √ab ≤ a + b
            2 ≤ b
            3. For each of the following statements, either prove it is true or give a
            counter-example to show it is false.
            (a) Let x, y ∈ R. If x, y ∈ Q, then x + y ∈ Q.
            (b) Let x, y ∈ R. If x /∈ Q and y /∈ Q, then x + y /∈ Q.
            (c) Let x, y ∈ R. If x ∈ Q and y /∈ Q, then xy /∈ Q.
            (d) Let x, y ∈ R. If x ∈ Q and y /∈ Q, then x + y /∈ Q.
            4. Let f : R → R be defined by f (x) =
             1, if x ∈ Q,
            0, if x ̸ ∈ Q.
            Prove the following statement: ∀x ∈ R, f (f (x)) = 1.
            5. Consider the following definition: A function f : R → R with domain
            R is said to be onto if
            ∀y ∈ R, ∃x ∈ R such that f (x) = y.
            MATA31 page 2
            (a) Prove f : R → R defined by f (x) = 5x − 2 is onto.
            (b) Prove f : R → R defined by f (x) = |x| is not onto.
            (c) For the following statement, prove it is true or give a counter-
            example to show it is false:
            If f and g are onto, then f + g is onto.
            `,
          },
          {
            title: "AIM Module Quiz",
            course: "PSYA01 - Fall 2025",
            pdfContent: "",
          },
          {
            title: "Quiz 5: Oct. 8",
            course: "MDSA10H3 F LEC01 20259:Media Foundations",
            pdfContent: "",
          },
          {
            title: "Quiz 6: Oct. 15",
            course: "MDSA10H3 F LEC01 20259:Media Foundations",
            pdfContent: "",
          },
        ];

        const as = await getAssignments();
        const raw = as
          .filter((a) =>
            matches.some((m) => a.title === m.title && a.course === m.course)
          )
          .map((a) => {
            const match = matches.find(
              (m) => m.title === a.title && m.course === a.course
            );
            return { ...a, pdfContent: match?.pdfContent ?? "" };
          });

        if (cancelled) return;

        const analyzed = await Promise.all(
          raw.map(async (a) => {
            try {
              const analysis = await analyzeAssignment({
                title: a.title,
                descriptionHtml: a.description ?? null,
                dueAtISO: a.dueAt ?? null,
                course: a.course ?? null,
                pdfContent: a.pdfContent,
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
        <header className="sticky top-0 z-50 flex h-16 mb-3 shrink-0 items-center justify-between gap-2 border-b px-4 bg-background/70 backdrop-blur-md">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-2xl font-light tracking-tight justify-start">
            gravitas
          </h1>
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
