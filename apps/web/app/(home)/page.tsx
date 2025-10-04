"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import LiquidEther from "@workspace/ui/components/liquid-ether";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  LogIn,
  Sparkles,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

import { isAuthenticated as isCrowdmarkAuthenticated } from "@/lib/crowdmark-client";
import { isAuthenticated as isQuercusAuthenticated } from "@/lib/quercus-client";
import { cn } from "@workspace/ui/lib/utils";

export default function Page() {
  const [quercusAuthed, setQuercusAuthed] = useState<boolean | null>(null);
  const [crowdmarkAuthed, setCrowdmarkAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const q = await isQuercusAuthenticated();
        setQuercusAuthed(Boolean(q?.success && q?.data));
      } catch {
        setQuercusAuthed(false);
      }
      try {
        const c = await isCrowdmarkAuthenticated();
        setCrowdmarkAuthed(Boolean(c?.success && c?.data));
      } catch {
        setCrowdmarkAuthed(false);
      }
    };
    checkAuth();
  }, []);

  const bothConnected = quercusAuthed === true && crowdmarkAuthed === true;

  return (
    <div className="relative min-h-screen overflow-hidden container">
      <div className="absolute inset-0 -z-10">
        <LiquidEther
          colors={["#5227FF", "#FF9FFC", "#B19EEF"]}
          mouseForce={20}
          cursorSize={100}
          isViscous={false}
          viscous={30}
          iterationsViscous={32}
          iterationsPoisson={32}
          resolution={0.5}
          isBounce={false}
          autoDemo={true}
          autoSpeed={0.5}
          autoIntensity={2.2}
          takeoverDuration={0.25}
          autoResumeDelay={100}
          autoRampDuration={0.6}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_40%,transparent_0%,transparent_50%,rgba(0,0,0,0.6)_100%)]" />
      </div>

      <div>
        {/* Hero */}
        <main className="min-h-screen mx-auto flex max-w-4xl flex-col items-center justify-center px-6 text-center">
          <Badge variant="outline" className="mb-6 gap-2">
            <Wand2 className="h-3.5 w-3.5" />
            Education Reimagined
          </Badge>

          <h1 className="mx-auto text-balance text-4xl font-bold leading-tight tracking-[-0.02em] sm:text-5xl md:text-6xl">
            The web, made fluid at your
            <br />
            fingertips.
          </h1>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <Button size="lg">
              Install Chrome Extension <ChevronRight />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => redirect("#steps")}
            >
              Get Started <ChevronDown />
            </Button>
          </div>
        </main>

        {/* Steps */}
        <section id="steps" className="mx-auto mb-40 max-w-4xl px-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">
              Getting set up
            </h2>
            <p className="text-sm text-muted-foreground">
              Connect your accounts, then launch the app.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Step 1: Quercus */}
            <Card
              className={cn(
                "flex flex-col transition-colors",
                quercusAuthed && "border-green-500/40 bg-green-500/10"
              )}
            >
              <CardHeader className="space-y-1">
                <div className="flex items-center justify-between">
                  <Badge
                    variant={quercusAuthed ? "default" : "outline"}
                    className={cn(
                      "gap-1",
                      quercusAuthed && "bg-green-600 text-white"
                    )}
                  >
                    {quercusAuthed ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Connected
                      </>
                    ) : (
                      <>
                        <CircleAlert className="h-3.5 w-3.5" />
                        Not connected
                      </>
                    )}
                  </Badge>

                  <span className="text-xs text-muted-foreground">Step 1</span>
                </div>

                <CardTitle>Login to Quercus</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Authorize access so we can pull your course list and due dates
                  securely.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Status:
                  <b>
                    {" "}
                    {quercusAuthed === null
                      ? "Checking..."
                      : quercusAuthed
                        ? "Signed in"
                        : "Not signed in"}
                  </b>
                </div>
              </CardContent>

              <CardFooter className="mt-auto justify-between">
                <div className="text-xs text-muted-foreground">
                  Uses your existing Quercus session via the extension.
                </div>

                {quercusAuthed ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href="https://q.utoronto.ca/" target="_blank">
                      Manage
                    </Link>
                  </Button>
                ) : (
                  <Button size="sm" asChild>
                    {/* Replace with your actual auth route */}
                    <Link href="https://q.utoronto.ca/" target="_blank">
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign in
                    </Link>
                  </Button>
                )}
              </CardFooter>
            </Card>

            {/* Step 2: Crowdmark */}
            <Card
              className={cn(
                "flex flex-col transition-colors",
                crowdmarkAuthed && "border-green-500/40 bg-green-500/10"
              )}
            >
              <CardHeader className="space-y-1">
                <div className="flex items-center justify-between">
                  <Badge
                    variant={crowdmarkAuthed ? "default" : "outline"}
                    className={cn(
                      "gap-1",
                      crowdmarkAuthed && "bg-green-600 text-white"
                    )}
                  >
                    {crowdmarkAuthed ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Connected
                      </>
                    ) : (
                      <>
                        <CircleAlert className="h-3.5 w-3.5" />
                        Not connected
                      </>
                    )}
                  </Badge>

                  <span className="text-xs text-muted-foreground">Step 2</span>
                </div>

                <CardTitle>Login to Crowdmark</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Link your account to fetch assignments and class averages.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Status:
                  <b>
                    {" "}
                    {crowdmarkAuthed === null
                      ? "Checking..."
                      : crowdmarkAuthed
                        ? "Signed in"
                        : "Not signed in"}
                  </b>
                </div>
              </CardContent>

              <CardFooter className="mt-auto justify-between">
                <div className="text-xs text-muted-foreground">
                  Securely reads only what's needed for your dashboard.
                </div>

                {crowdmarkAuthed ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href="https://app.crowdmark.com/student/courses"
                      target="_blank"
                    >
                      Manage
                    </Link>
                  </Button>
                ) : (
                  <Button size="sm" asChild>
                    <Link
                      href="https://app.crowdmark.com/sign-in/utoronto"
                      target="_blank"
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign in
                    </Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>

          {/* Proceed */}
          <div className="mt-6 flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {bothConnected
                ? "You're all set—launch the app."
                : "Connect both services to continue."}
            </p>
            <Button size="lg" disabled={!bothConnected} asChild>
              <Link href={bothConnected ? "/app" : "#steps"}>
                Proceed to app <ChevronRight />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
