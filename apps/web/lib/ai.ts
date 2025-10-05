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
  score: number;
  difficulty: "very_easy" | "easy" | "medium" | "hard" | "very_hard";
};

export async function analyzeAssignment(
  ctx: AssignmentContext,
  opts?: { model?: string }
): Promise<LLMEstimate> {
  const modelName = opts?.model ?? "gemini-2.0-flash-lite";
  const descriptionText = extractText(ctx.descriptionHtml);
  const pdfRaw = await extractPdfs(ctx.descriptionHtml as any);
  console.log(pdfRaw);
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
    (pdfText || "").slice(0, MAX_CHARS)
  ].join("\n");

  // const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY as string);
  const genAI = new GoogleGenerativeAI("AIzaSyDVLnetWTzHdcJAtEgDaeLecPXFWHOAq9I");
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          summary: { type: SchemaType.STRING, description: "Concise summary of 1-2 sentences using the description/instructions of the assignment" },
          estimatedTime: { type: SchemaType.NUMBER, description: `Estimated time in hours (can be fractional) that it would take an average first year university student to complete,
            assuming medium focused, some research and studying, and double checking` },
          score: { type: SchemaType.NUMBER, description: `0 should be like i can just hand it in with no material, 100 being i will cry before submitting it it. I should rarely see
            single digit numbers or high 90s. do NOT include %.
            Use the following factors: Workload, Complexity, Research, Time, Format, scored 1-10
            mind you, an AVERAGE assignment would score 50% on each category.
            Compute the overall score using weights: Workload 0.5, Complexity 0.15, Research 0.15, Time 0.10, Format 0.1
            Refer to examples in ./examples.txt for guidance ${examplesText} `},
          difficulty: {
            type: SchemaType.STRING,
            format: "enum",
            enum: ["very_easy", "easy", "medium", "hard", "very_hard"]
          }
        },
        required: ["summary", "estimatedTime", "score", "difficulty"]
      }
    }
  });

  const prompt = [
    "You are estimating effort and expected performance for a student assignment.",
    "Return concise JSON following the provided schema. Be realistic and avoid overconfidence.",
    "",
    "Guidelines:",
    "- summary: 2-4 sentences max.",
    "- estimatedTime: hours to complete (planning + work + review).",
    "- score: expected percentage if the student works at an average pace.",
    "- difficulty: one of very_easy, easy, medium, hard, very_hard.",
    "follow ./examples.txt for guidance",
    "Assignment Context:",
    merged
  ].join("\n");

  try {
    const res = await model.generateContent([{ text: prompt }]);
    const txt = res.response.text();
    const parsed = JSON.parse(txt) as LLMEstimate;

    return {
      summary: parsed.summary,
      estimatedTime : parsed.estimatedTime,
      score: parsed.score,
      difficulty: parsed.difficulty
    };
  } catch {
    return {
      summary: "Could not confidently analyze this assignment. Try again after providing more details or smaller attachments.",
      estimatedTime: 2,
      score: 75,
      difficulty: "medium"
    };
  }
}