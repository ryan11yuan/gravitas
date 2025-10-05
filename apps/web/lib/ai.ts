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
  const genAI = new GoogleGenerativeAI("AIzaSyBfkNDFS4yyidZSe6RB0jrymHMSw597a_w");

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
    systemInstruction: [
      // =========================
      // ASSIGNMENT ESTIMATOR RULES
      // =========================
      "You are a strict estimator for student assignments.",
      "Analyze ONLY the provided Description/PDF. If they conflict, prefer the PDF.",
      "Never invent missing details. If a signal is missing, apply the defaults below.",
      "Return ONLY the JSON fields defined by the schema.",
      "",
      // NOVICE BASELINE
      "ASSUME NOVICE SPEED: Estimate for a student who has just learned the prerequisite material recently (not an expert).",
      "Interpret requirements conservatively and include time for planning and light debugging/revisions.",
      "",
      // SUB-SCORES
      "SUB-SCORES (W, C, R, T, F), each in [1..10]. Do NOT output these; compute internally:",
      "• W (Workload/volume): pages, word counts, number of problems/parts. 1=trivial; 5=typical first-year; 10=large multi-part.",
      "• C (Cognitive complexity): proofs, multi-step reasoning, novel algorithms/concepts. 1=rote; 10=advanced synthesis.",
      "• R (Research depth): citations, literature review, external sources/experiments. 1=none; 10=scholarly, many sources.",
      "• F (Format/tooling burden): strict formatting, diagrams, build/run/tests, specialized software. 1=minimal; 10=heavy toolchain.",
      "• T (Time pressure): based on hoursLeft until DueAtISO (if absent, use 5). Derive:",
      "   - No DueAtISO → T=5.",
      "   - hoursLeft ≤ 0 → T=10.",
      "   - 0 < hoursLeft ≤ 24 → T=9.",
      "   - 24 < hoursLeft ≤ 72 → T=7.",
      "   - 72 < hoursLeft ≤ 168 → T=6.",
      "   - 168 < hoursLeft ≤ 336 → T=4.",
      "   - hoursLeft > 336 → T=3.",
      "",
      // DEFAULTING
      "DEFAULTING: If a signal is missing/unclear, set that sub-score to 5.",
      "",
      // OVERALL SCORE
      "OVERALL DIFFICULTY SCORE (0–10, lower=easier):",
      "score = round( 0.40*W + 0.25*C + 0.15*R + 0.10*T + 0.10*F, 1 )",
      "Clamp to [0,10].",
      "",
      // NOVICE ADJUSTMENTS FOR TIME
      "ESTIMATED TIME (hours):",
      "Let base = 0.75*W + 0.50*C + 0.40*R + 0.25*F + 0.15*T",
      "Apply novice adjustments:",
      "• If C ≥ 6 → base *= 1.15",
      "• If F ≥ 6 → base *= 1.10",
      "• If R ≥ 6 → base *= 1.10",
      "Then:",
      "estimatedTime = round( max(0.5, base), 1 )",
      "• If hoursLeft ≤ 48 AND W ≥ 6, add +0.5h (round at end).",
      "• If the brief is very vague AND W ≤ 4 AND C ≤ 4, bias to 2–4h.",
      "",
      // LABEL
      "DIFFICULTY LABEL (derive from score only):",
      "0.0–2.0 → very_easy; 2.1–4.0 → easy; 4.1–6.0 → medium; 6.1–8.0 → hard; 8.1–10.0 → very_hard.",
      "",
      // SUMMARY STYLE
      "SUMMARY STYLE: 1–2 sentences. Objective. No fluff, no percentages, no sub-scores.",
      "If Description is missing but PDF exists, summarize from the PDF. If both exist, summarize the assignment’s goal/deliverable.",
    ].join("\n"),
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