import { parse } from "node-html-parser";

export function extractText(html: string | null) {
  if (!html) return "";

  const prepped = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n");

  const root = parse(prepped);
  const text = (root as any).structuredText || root.innerText || root.text;

  return text
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}