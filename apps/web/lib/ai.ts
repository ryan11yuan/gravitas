import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { extractPdfs, extractText } from "./content-extraction";
import { examplesText } from "./examples";

export type AssignmentContext = {
  title: string;
  descriptionHtml: string | null;
  dueAtISO?: string | null;
  course?: string | null;
};

export type LLMEstimate = {
  summary: string;
  estimatedTime: number;
  score: number; // 0–10 (lower = easier)
  difficulty: "very_easy" | "easy" | "medium" | "hard" | "very_hard";
};

export async function analyzeAssignment(
  ctx: AssignmentContext,
  opts?: { model?: string }
): Promise<LLMEstimate> {
  const modelName = opts?.model ?? "gemini-2.0-flash-lite";

  const descriptionText = extractText(ctx.descriptionHtml);
  const pdfRaw = await extractPdfs(ctx.descriptionHtml as any);
  const pdfText = Array.isArray(pdfRaw) ? pdfRaw.join("\n\n") : (pdfRaw ?? "");

  const MAX_CHARS = 40_000;
  const merged = [
    `Title: ${ctx.title}`,
    ctx.course ? `Course: ${ctx.course}` : "",
    ctx.dueAtISO ? `Due At (ISO): ${ctx.dueAtISO}` : "",
    "",
    "Description:",
    descriptionText,
    "",
    "Attached PDF Content (truncated if long):",
    (pdfText || "").slice(0, MAX_CHARS),
  ].join("\n");
  
  const genAI = new GoogleGenerativeAI("xxx");
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      // Make outputs more repeatable/consistent:
      temperature: 0.2,
      topP: 0.9,
      topK: 32,
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          summary: {
            type: SchemaType.STRING,
            description:
              "1–2 sentences summarizing the assignment’s goal and deliverable. No fluff.",
          },
          estimatedTime: {
            type: SchemaType.NUMBER,
            description:
              "Estimated total hours to complete (can be fractional). Include planning + work + review.",
          },
          score: {
            type: SchemaType.NUMBER,
            description:
              [
                "Overall difficulty on a 0–10 scale (lower = easier, higher = harder).",
                "Compute using the formula below. Do NOT output a percentage.",
              ].join(" "),
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
  });

  // ====== Strong, formula-based prompt ======
  const prompt = [
    "You estimate effort and expected difficulty for a student assignment.",
    "Return concise JSON following the schema. Be consistent and follow the formulas exactly.",
    "",
    "DEFINITIONS (rate each 1–10 internally; do not output these sub-scores):",
    "- Workload (W): volume of work (pages to read, problems, code to write, slides, etc.).",
    "- Complexity (C): conceptual depth, tricky reasoning, multi-step integration.",
    "- Research (R): external sources/search, citations, literature review effort.",
    "- Time Sensitivity (T): coordination/scheduling/iteration cycles that add time (e.g., multi-part submissions, peer review).",
    "- Format Demands (F): strict formatting, tooling, environment setup, rubric compliance, presentation polish.",
    "",
    "SUB-SCORE RUBRICS (anchor the 1, 5, 10 points):",
    "- 1 ≈ trivial/minimal; 5 ≈ average first-year assignment; 10 ≈ extremely demanding for first-year.",
    "  Examples:",
    "  • Workload 1: a short post or 2–3 MCQs. 5: a normal weekly set or 3–5 pages. 10: major project or >15 pages.",
    "  • Complexity 1: rote recall/simple routine. 5: standard multi-step reasoning. 10: novel synthesis/advanced theory.",
    "  • Research 1: none/internal materials only. 5: a few credible sources. 10: extensive sources with evaluation.",
    "  • Time (T) 1: single sitting, few iterations. 5: plan+draft+revise. 10: many checkpoints or reviews.",
    "  • Format 1: free-form. 5: common academic format. 10: strict tooling/rubric, citations/figures/code packaging.",
    "",
    "FINAL SCORE FORMULA (0–10, lower = easier):",
    "  score = round( 0.50*W + 0.15*C + 0.15*R + 0.10*T + 0.10*F , 1 )",
    "  - Clamp sub-scores to [1,10] before combining.",
    "  - If information is missing, assume the first-year average = 5 for that sub-score.",
    "",
    "ESTIMATED TIME FORMULA (hours, can be fractional):",
    "  estimatedTime = round( max(1, 0.6*W + 0.4*C + 0.4*R + 0.3*T + 0.2*F ), 1 )",
    "  - Add +0.5 hours if due within 48 hours (ctx.dueAtISO present and close) AND W ≥ 6.",
    "  - If little detail is provided, bias toward 2–4 hours unless W or C clearly suggests otherwise.",
    "",
    "DIFFICULTY LABEL (derive from final score):",
    "  0.0–2.0 → very_easy",
    "  2.1–4.0 → easy",
    "  4.1–6.0 → medium",
    "  6.1–8.0 → hard",
    "  8.1–10.0 → very_hard",
    "",
    "STYLE & CONSTRAINTS:",
    "- Use the provided text only. Do not hallucinate course-specific facts.",
    "- Keep summary to 1–2 sentences.",
    "- Output only fields required by the schema.",
    "- Use the formulas exactly for score and estimatedTime.",
    "",
    "REFERENCE EXAMPLES (guidance, not data to copy):",
    examplesText,
    "",
    "ASSIGNMENT CONTEXT:",
    merged,
  ].join("\n");

  try {
    const res = await model.generateContent([{ text: prompt }]);
    const txt = res.response.text();

    let parsed = JSON.parse(txt) as LLMEstimate;

    // ---- Post-parse sanity & normalization ----
    // Clamp score to [0,10]
    if (typeof parsed.score !== "number" || Number.isNaN(parsed.score)) {
      parsed.score = 5; // neutral default
    } else {
      parsed.score = Math.max(0, Math.min(10, parsed.score));
      parsed.score = Math.round(parsed.score * 10) / 10;
    }

    // Ensure estimatedTime is reasonable (>= 0.5h)
    if (typeof parsed.estimatedTime !== "number" || Number.isNaN(parsed.estimatedTime)) {
      parsed.estimatedTime = 3; // sensible default
    } else {
      parsed.estimatedTime = Math.max(0.5, parsed.estimatedTime);
      parsed.estimatedTime = Math.round(parsed.estimatedTime * 10) / 10;
    }

    // Map difficulty from score if missing or inconsistent
    const s = parsed.score;
    const band =
      s <= 2 ? "very_easy" :
      s <= 4 ? "easy" :
      s <= 6 ? "medium" :
      s <= 8 ? "hard" : "very_hard";

    if (!parsed.difficulty || !["very_easy","easy","medium","hard","very_hard"].includes(parsed.difficulty)) {
      parsed.difficulty = band as LLMEstimate["difficulty"];
    }

    return {
      summary: parsed.summary || "No summary provided.",
      estimatedTime: parsed.estimatedTime,
      score: parsed.score,
      difficulty: parsed.difficulty,
    };
  } catch {
    // Conservative fallback
    return {
      summary:
        "Could not confidently analyze this assignment from the provided context.",
      estimatedTime: 3,
      score: 5,
      difficulty: "medium",
    };
  }
}