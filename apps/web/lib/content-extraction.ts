import { QuercusFile } from "@/common/types/quercus";
import { fetchWithExtension, rawDownloadViaExtension } from "@/lib/extension-client";
import { getQuercusCourseFile } from "@/lib/quercus-client";
import { parse } from "node-html-parser";

let _pdfjsPromise: Promise<any> | null = null;
async function ensurePDFJS(): Promise<any> {
  if (typeof window === "undefined") {
    // Running on the server – pdfjs + atob won't work. Choose your behavior:
    // return Promise.reject(new Error("extractPdfs must run in the browser"));
    return null;
  }
  if (!_pdfjsPromise) {
    _pdfjsPromise = require("pdfjs-dist/webpack.mjs");
  }
  return _pdfjsPromise;
}

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

export async function extractPdfs(html: string | null): Promise<Array<QuercusFile & { content: string }>> {
  const files = await getPdfs(html);

  const pdfjs = await ensurePDFJS();
  if (!pdfjs) return [];

  const out = await Promise.all(
    files.map(async (f) => {
      const url =
        (f as any).url ||
        `https://q.utoronto.ca/files/${f.id}/download?download_frd=1`;

      const res = await rawDownloadViaExtension(url, {
        headers: { Accept: "application/pdf" },
      });

      console.log(res)

      if (!res.success || typeof res.data !== "string") return null;

      try {
        const bytes = b64ToU8(res.data);

        if (String.fromCharCode(...bytes.slice(0, 4)) !== "%PDF") {
          return null;
        }

        const loadingTask = pdfjs.getDocument({ data: bytes });
        const pdf = await loadingTask.promise;

        const parts: string[] = [];
        for (let p = 1; p <= pdf.numPages; p++) {
          const page = await pdf.getPage(p);
          const tc = await page.getTextContent();
          parts.push(
            tc.items
              .map((it: any) => (it?.str ?? it?.item?.str ?? ""))
              .join(" ")
          );
        }
        await pdf.destroy();

        const text = parts
          .join("\n\n")
          .replace(/[ \t]+\n/g, "\n")
          .replace(/\n{3,}/g, "\n\n")
          .trim();

        return { ...f, content: text };
      } catch {
        return null;
      }
    })
  );

  return out.filter(
    (x): x is QuercusFile & { content: string } => !!x && typeof x.content === "string"
  );
}

export async function getPdfs(html: string | null): Promise<QuercusFile[]> {
  if (!html) return [];

  const urls = getPdfUrlsFromHtml(html);
  if (urls.length === 0) return [];

  const results = await Promise.allSettled(
    urls.map(async (u) => {
      const res = await getQuercusCourseFile(u);
      if (!res.success || !res.data) return null;

      const f = res.data as QuercusFile & {
        ["content-type"]?: string;
        mime_class?: string;
      };

      const isPdf =
        f?.mime_class === "pdf" ||
        (typeof f?.["content-type"] === "string" &&
          /pdf/i.test(f["content-type"]));

      return isPdf ? f : null;
    })
  );

  const byId = new Map<number, QuercusFile>();
  for (const r of results) {
    if (r.status === "fulfilled" && r.value && typeof r.value.id === "number") {
      byId.set(r.value.id, r.value);
    }
  }

  return Array.from(byId.values());
}

function getPdfUrlsFromHtml(html: string | null) {
  const pdfUrls = new Set<string>();
  if(html == null) return [];

  const root = parse(html);

  root.querySelectorAll("a").forEach(a => {
    const href = a.getAttribute("href") || "";
    if (/\.pdf(\?|#|$)/i.test(href)) pdfUrls.add(href);

    const title = a.getAttribute("title") || "";
    if (/\.pdf$/i.test(title)) {
      const api = a.getAttribute("data-api-endpoint");
      if (api) pdfUrls.add(api);
    }
  });

  return [...pdfUrls];
}

const b64ToU8 = (b64: string) => {
  const norm = b64.replace(/[\r\n\s]/g, "").replace(/-/g, "+").replace(/_/g, "/");
  const pad = "=".repeat((4 - (norm.length % 4)) % 4);
  const bin = atob(norm + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};