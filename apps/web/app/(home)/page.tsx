"use client";

import React, { useEffect, useRef, useState } from "react";
import LiquidEther from "./_components/liquid-either";
import { ChevronDown, LogIn, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { isAuthenticated as isQuercusAuthenticated } from "@/integrations/quercus";
import { isAuthenticated as isCrowdmarkAuthenticated } from "@/integrations/crowdmark";

export default function LandingPage() {
  const learnRef = useRef<HTMLDivElement | null>(null);
  const [quercusSignedIn, setQuercusSignedIn] = useState(false);
  const [crowdmarkSignedIn, setCrowdmarkSignedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const quercusRes = await isQuercusAuthenticated();
      if (quercusRes.success && quercusRes.data) setQuercusSignedIn(true);

      const crowdmarkRes = await isCrowdmarkAuthenticated();
      if (crowdmarkRes.success && crowdmarkRes.data) setCrowdmarkSignedIn(true);
    };
    checkAuth();
  }, []);

  const scrollToLearn = () => {
    learnRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
          <LiquidEther
            colors={["#5227FF", "#FF9FFC", "#B19EEF"]}
            mouseForce={20}
            cursorSize={100}
            isViscous={false}
            viscous={30}
            iterationsViscous={32}
            iterationsPoisson={32}
            resolution={0.6}
            isBounce={false}
            autoDemo
            autoSpeed={0.5}
            autoIntensity={2.2}
            takeoverDuration={0.25}
            autoResumeDelay={3000}
            autoRampDuration={0.6}
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-white/6" />
      </div>

      {/* HERO */}
      <main className="relative z-10">
        <section className="h-screen max-w-5xl mx-auto px-6 pt-28 pb-20 text-center font-sf">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
            <span className="opacity-80">Productivity for students</span>
          </div>

          <h1 className="mt-6 text-4xl md:text-6xl font-semibold leading-[1.1] tracking-tight">
            The web, made fluid at your
            <br className="hidden md:block" />
            <span className="inline-block"> fingertips.</span>
          </h1>

          <p className="mt-5 text-zinc-300/80 max-w-2xl mx-auto">
            Gravitas ranks your assignments by urgency and difficulty—so you
            focus on what moves your grade the most.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-full bg-white text-black px-6 py-3 text-sm font-semibold hover:bg-zinc-200 transition-colors"
            >
              Get Started
            </Link>

            <button
              onClick={scrollToLearn}
              className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm text-white/90 hover:border-white/20 transition-colors"
            >
              Learn More
            </button>
          </div>

          <button
            onClick={scrollToLearn}
            className="mt-14 inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronDown className="h-5 w-5" />
            <span>Scroll</span>
          </button>
        </section>

        {/* REQUIREMENTS / LOGIN SECTION */}
        <section
          ref={learnRef}
          className="h-screen relative z-10 border-t border-white/10 bg-black/30 backdrop-blur-xl"
        >
          <div className="max-w-5xl mx-auto px-6 py-16 font-sf">
            <h2 className="text-2xl md:text-3xl font-semibold">Before you begin</h2>
            <p className="mt-3 text-zinc-400 max-w-2xl">
              To import assignments and compute priorities, please make sure
              you&apos;re signed into both{" "}
              <span className="text-white/90">Quercus</span> and{" "}
              <span className="text-white/90">Crowdmark</span>.
            </p>

            <div className="mt-8 grid md:grid-cols-3 gap-4">
              {/* Quercus */}
              <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5">
                <h3 className="text-lg font-semibold">Quercus</h3>
                <p className="mt-2 text-sm text-zinc-400">
                  Connect to sync courses, due dates, and posted assignments.
                </p>

                {quercusSignedIn ? (
                  <button
                    disabled
                    aria-label="Quercus connected"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-500 text-black px-4 py-2 text-sm font-semibold cursor-default"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Connected
                  </button>
                ) : (
                  <Link
                    href="https://q.utoronto.ca" /* TODO: adjust to your auth route */
                    target="_blank"
                    aria-label="Sign in to Quercus"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/90 hover:border-white/20"
                  >
                    <LogIn className="h-4 w-4" />
                    Sign in to Quercus
                  </Link>
                )}
              </div>

              {/* Crowdmark */}
              <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5">
                <h3 className="text-lg font-semibold">Crowdmark</h3>
                <p className="mt-2 text-sm text-zinc-400">
                  Pull grades and feedback to calibrate difficulty scores.
                </p>

                {crowdmarkSignedIn ? (
                  <button
                    disabled
                    aria-label="Crowdmark connected"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-500 text-black px-4 py-2 text-sm font-semibold cursor-default"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Connected
                  </button>
                ) : (
                  <Link
                    href="https://app.crowdmark.com/sign-in/utoronto" /* TODO: adjust to your auth route */
                    aria-label="Sign in to Crowdmark"
                    target="_blank"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/90 hover:border-white/20"
                  >
                    <LogIn className="h-4 w-4" />
                    Sign in to Crowdmark
                  </Link>
                )}
              </div>

              {/* Optional: Status summary card */}
              <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5">
                <h3 className="text-lg font-semibold">Status</h3>
                <p className="mt-2 text-sm text-zinc-400">
                  {quercusSignedIn ? "Quercus connected" : "Quercus not connected"}
                  {" • "}
                  {crowdmarkSignedIn ? "Crowdmark connected" : "Crowdmark not connected"}
                </p>
              </div>
            </div>

            <div className="mt-10">
              <Link
                href="/dashboard"
                className="inline-block rounded-full bg-white text-black px-6 py-3 text-sm font-semibold hover:bg-zinc-200 transition-colors"
              >
                Continue to app
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* SF Pro utility */}
      <style>{`
        .font-sf {
          font-family:
            "SF Pro", "SF Pro Text", "SF Pro Display",
            -apple-system, BlinkMacSystemFont, "Segoe UI",
            Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue",
            Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol",
            sans-serif;
        }
      `}</style>
    </div>
  );
}