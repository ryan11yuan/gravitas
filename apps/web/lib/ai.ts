import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { extractText } from "./content-extraction";
import { examplesText } from "./examples";

export type AssignmentContext = {
  title: string;
  descriptionHtml: string | null;
  pdfContent: string;
  dueAtISO?: string | null;
  course?: string | null;
};

export type LLMEstimate = {
  summary: string;
  estimatedTime: number; // hours
  score: number;         // 0–10 (lower = easier)
  difficulty: "very_easy" | "easy" | "medium" | "hard" | "very_hard";
};

export async function analyzeAssignment(
  ctx: AssignmentContext,
  opts?: { model?: string }
): Promise<LLMEstimate> {
  const modelName = opts?.model ?? "gemini-2.0-flash-lite";

  const descriptionText = extractText(ctx.descriptionHtml)?.trim() || "";
  const hasDesc = descriptionText.length > 0;
  const hasPdf = (ctx.pdfContent?.trim()?.length ?? 0) > 0;

  // ---- NO-CONTENT SHORT CIRCUIT (no speculation) ----
  if (!hasDesc && !hasPdf) {
    return {
      summary: "No description available.",
      estimatedTime: 0,
      score: 0,
      difficulty: "very_easy", // schema requires a label; use neutral floor
    };
  }

  const merged = [
    `Title: ${ctx.title}`,
    ctx.course ? `Course: ${ctx.course}` : "",
    ctx.dueAtISO ? `DueAtISO: ${ctx.dueAtISO}` : "",
    "",
    "Description:",
    hasDesc ? descriptionText : "(none)",
    "",
    "PDF:",
    hasPdf ? ctx.pdfContent : "(none)",
  ].join("\n");

  // ⚠️ Consider moving this key to an env var in real usage.
  const genAI = new GoogleGenerativeAI("");

  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.05,
      topP: 0.9,
      topK: 32,
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          summary: {
            type: SchemaType.STRING,
            description: "1–2 sentences; objective; no fluff.",
          },
          estimatedTime: {
            type: SchemaType.NUMBER,
            description: "Total hours (can be fractional). Include plan + work + review.",
          },
          score: {
            type: SchemaType.NUMBER,
            description: "Overall difficulty 0–10 (lower = easier). Compute with the formula.",
          },
          difficulty: {
            type: SchemaType.STRING,
            format: "enum",
            enum: ["very_easy", "easy", "medium", "hard", "very_hard"],
          },
        },
        required: ["summary", "estimatedTime", "score", "difficulty"],
      },
    },
    systemInstruction: [`
You are a first-year university assignment evaluator.
Use only the assignment DESCRIPTION to evaluate the assignment.
Do NOT open links unless they are PDFs.
If the DESCRIPTION does not contain instructions on what to do, return exactly:
'NOT ENOUGH DATA: MANUALLY SUBMIT ASSIGNMENT TEXT'.
if there is some sort of instruction, do not return not enough info, BUT if its just a title then yes, return not enough info.
only return no info IFF its only the assignment title.
Rate assignments using these factors: Workload, Complexity, Research, Time, Format (1-10 each).
Compute Overall score (1-10) using weights: Workload 0.5, Complexity 0.15, Research 0.15, Time 0.10, Format 0.10.
DOUBLE CHECK THE OVERALL SCORE, 0 should be like i can just hadn it in with no material, 100 being i will cry before submitting it it. again, i should rarely see less than 1 or high 9s.
if you think assignment is way too hard for a first year uni student, make it 9+ if you think its wayy to easy for a uni student make it 2-.
Estimate time assuming medium focus, fast pace, some studying/research, and double-checking.
Do NOT include anything else. Only return one of the following:
1) The 11-item list, or 2) 'NOT ENOUGH DATA: MANUALLY SUBMIT ASSIGNMENT TEXT'.

---
Assignment: STARR Story Bank
Full Assignment:
The STARR Story Bank assignment requires students to write at least two detailed STARR stories demonstrating key skills. Each story must clearly address: Situation, Task, Action, Result, and Result. Stories should be concise, professional, and measurable where possible. The submission should reflect a range of skills relevant to career goals. Clarity, professional tone, and variety in the stories will be evaluated.
Student Example Submission:
Story 1: Describes leading a team in a robotics club to complete a project on time. Mentions tasks, actions taken (dividing responsibilities, scheduling meetings), results (finished early, project won first place), and final impact (team members learned skills). Story follows STARR framework clearly.
Story 2: Describes tutoring younger students in math. Mentions Situation (students struggling), Task (help improve their grades), Actions (used tailored exercises), Results (students improved by 10–15%), Final impact (confidence gained).
Grading:
Clarity & STARR Adherence: Strong
Specificity & Impact: Strong
Professional Tone: Strong
Quantity & Variety: Strong
Overall Difficulty Rating: 3.5/10
Notes: Easy, minimal thinking required, focus mostly on following the STARR framework correctly. Some light writing and formatting required.

---
Assignment: CSCA67 Homework Assignment #1
Full Assignment:
Questions 1–3 include logical equivalence, tautology/contradiction identification, and deductive reasoning. Students must provide proofs without truth tables for equivalence, identify truth values, and demonstrate validity of arguments with rules of inference and truth tables. Covers multiple logical concepts with repetitive and tricky wording. Requires careful reading, analysis, and correct logical reasoning.
Student Example Submission:
- Q1: Correct proofs for equivalences 1–10, minor wording mistakes in explanation.
- Q2: Correctly identifies tautologies and contradictions, some proofs verbose but accurate.
- Q3: Deductive reasoning arguments A–E mostly correct, some minor errors in truth table setup, generally complete.
Grading:
Clarity & Correctness: Developing
Workload & Time: Hard
Conceptual Difficulty: Hard
Overall Difficulty Rating: 8.8/10
Notes: Very long, covers many concepts, highly repetitive, tricky wording. High conceptual demand.

---
FOLLOW EXAMPLES CALIBRATION, DO NOT COPY CONTENT.
Assignment: CSCA08 Assignment 1: Ice Hockey Fantasy Draft
Full Assignment:
Students complete a Python program to manage a fantasy hockey draft. Must implement several functions (get_player_id, get_position, can_select, compute_fantasy_score, etc.) according to the Function Design Recipe. Starter code and constants provided. Requires understanding Python basics (variables, conditionals, strings), but mostly tedious repetitive work filling out functions and testing. No advanced logic beyond course concepts from weeks 1–3.
Student Example Submission:
- All functions implemented correctly, docstrings provided with examples. Minor typos in comments. Checker passes for style and types. Program works as expected with starter files.
Grading:
Coding Style: Strong
Correctness: Strong
Workload & Tediousness: Developing
Conceptual Difficulty: Medium
Overall Difficulty Rating: 6.4/10
Notes: Medium-length, tedious, uses repetitive concepts. Straightforward if methodical, not conceptually hard.

---
Assignment: CSC A67 Tutorial 1 — Introduction to Propositional Logic
Full Assignment:
Tutorial exercises / questions posted online before Monday. In tutorial, TA may review material, present solutions, give guidance. Students work independently or with partners. Solutions submitted on Crowdmark by Tuesday 9 a.m. Grading: 0 = no attempt, 1 = attempt with serious flaws, 2 = solid attempt. Exercises include logical connectives (∨, ∧, ¬), analyzing logical forms of statements, translating formulas to English, and deductive arguments.
Grading:
Clarity & Correctness: Strong
Workload & Time: Low
Conceptual Difficulty: Easy
Overall Difficulty Rating: 4.0/10
Notes: Minimal studying required; concepts are easy; exercises are short and straightforward.

---
Assignment: CSC A67 Tutorial 2 — Introduction to Propositional Logic (Harder Version)
Full Assignment:
Similar to the previous tutorial, but includes more complex exercises requiring analysis of logical forms, translation of formulas, and reasoning about deductive arguments. Students must carefully interpret statements and reason about validity. Submission is the same: Crowdmark by Tuesday 9 a.m.
Grading:
Clarity & Correctness: Developing
Workload & Time: Medium
Conceptual Difficulty: Moderate
Overall Difficulty Rating: 5/10
Notes: Slightly harder to wrap your head around; requires some studying; not too long.

---
Assignment: CSC/MAT A67 Tutorial 4 — Quantifiers
Full Assignment:
Focus on quantifiers, negation, and translation between English statements and logical expressions. Exercises include:
- Quantifier basics (truth values of statements like ∀x, P(x) or ∃x, Q(x))
- Translating specifications into English and logical notation
- Negating statements and re-expressing them positively
- Analyzing logical forms of classroom statements
Submission required for some exercises; others are practice.
Grading:
Clarity & Correctness: Developing
Workload & Time: Medium-High
Conceptual Difficulty: Hard
Overall Difficulty Rating: 6.0/10.0
Notes: Requires a lot of pre-existing knowledge and careful thinking; content not long, but conceptually dense; exercises require reasoning through multiple logical steps.
`].join("\n"),
  });

  const prompt = [
    "ASSIGNMENT CONTEXT (analyze this only):",
    merged,
    "",
    "REFERENCE EXAMPLES (for calibration; never copy content):",
    examplesText,
  ].join("\n");

  try {
    const res = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const txt = res.response.text();

    // ---- Parse JSON, even if wrapped ----
    let parsed: Partial<LLMEstimate> = {};
    try {
      parsed = JSON.parse(txt);
    } catch {
      const m = txt.match(/\{[\s\S]*\}$/);
      if (m) parsed = JSON.parse(m[0]);
    }

    // ---- Post-parse guards & consistency ----
    const clamp = (n: number, lo: number, hi: number) =>
      Math.max(lo, Math.min(hi, n));

    const safeScore =
      typeof parsed.score === "number" && Number.isFinite(parsed.score)
        ? clamp(Math.round(parsed.score * 10) / 10, 0, 10)
        : 5;

    let safeTime =
      typeof parsed.estimatedTime === "number" && Number.isFinite(parsed.estimatedTime)
        ? Math.max(0.5, Math.round(parsed.estimatedTime * 10) / 10)
        : 3;

    // Always derive difficulty label from score to guarantee consistency.
    const label =
      safeScore <= 2
        ? "very_easy"
        : safeScore <= 4
          ? "easy"
          : safeScore <= 6
            ? "medium"
            : safeScore <= 8
              ? "hard"
              : "very_hard";

    return {
      summary:
        (parsed.summary && String(parsed.summary).trim()) ||
        // If model somehow returned an empty summary (shouldn't), backstop it:
        (hasDesc || hasPdf ? "Summary unavailable." : "No description available."),
      estimatedTime: safeTime,
      score: safeScore,
      difficulty: label as LLMEstimate["difficulty"],
    };
  } catch {
    // Conservative fallback (model error)
    return {
      summary: hasDesc || hasPdf ? "Summary unavailable." : "No description available.",
      estimatedTime: hasDesc || hasPdf ? 3 : 0,
      score: hasDesc || hasPdf ? 5 : 0,
      difficulty: hasDesc || hasPdf ? "medium" : "very_easy",
    };
  }
}