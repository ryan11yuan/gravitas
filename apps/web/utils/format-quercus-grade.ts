import { QuercusAssignment } from "@/types/quercus";

export const pct = (score?: number | null, denom?: number | null) => {
  if (score == null || denom == null || denom === 0) return null;
  return Math.round((score / denom) * 100);
};

export const toPct = (num: number) => Math.round(num);

export const getGradeColor = (percentage?: number | null) => {
  if (percentage == null) return "text-muted-foreground";
  if (percentage >= 90) return "text-green-600";
  if (percentage >= 80) return "text-green-500";
  if (percentage >= 70) return "text-yellow-500";
  if (percentage >= 60) return "text-orange-500";
  return "text-red-500";
};


export function formatYourGrade(a: QuercusAssignment): { text: string; color: string } {
  const type = a.grading_type ?? "points";
  const score = a.submission?.score ?? null;
  const grade = a.submission?.grade ?? null;
  const pts = a.points_possible ?? null;

  switch (type) {
    case "points": {
      if (score == null || pts == null || pts === 0)
        return { text: "You: —", color: "text-muted-foreground" };
      const p = toPct((score / pts) * 100);
      return { text: `You: ${score}/${pts} (${p}%)`, color: getGradeColor(p) };
    }
    case "percent": {
      if (grade && grade.endsWith("%")) {
        const p = Number(grade.replace("%", ""));
        return { text: `You: ${grade}`, color: getGradeColor(isFinite(p) ? p : undefined) };
      }
      if (score != null && pts) {
        const p = toPct((score / pts) * 100);
        return { text: `You: ${p}%`, color: getGradeColor(p) };
      }
      return { text: "You: —", color: "text-muted-foreground" };
    }
    case "letter_grade": {
      if (grade) return { text: `You: ${grade}`, color: "text-foreground" };
      if (score != null && pts) {
        const p = toPct((score / pts) * 100);
        return { text: `You: ${score}/${pts} (${p}%)`, color: getGradeColor(p) };
      }
      return { text: "You: —", color: "text-muted-foreground" };
    }
    case "gpa_scale": {
      if (grade) return { text: `You: GPA ${grade}`, color: "text-foreground" };
      return { text: "You: —", color: "text-muted-foreground" };
    }
    case "pass_fail": {
      if (grade) {
        const g = grade.toLowerCase();
        return {
          text: `You: ${grade}`,
          color: g.includes("pass") || g.includes("complete") ? "text-green-600" : "text-red-500",
        };
      }
      return { text: "You: —", color: "text-muted-foreground" };
    }
    default: {
      if (score != null && pts) {
        const p = toPct((score / pts) * 100);
        return { text: `You: ${score}/${pts} (${p}%)`, color: getGradeColor(p) };
      }
      return { text: "You: —", color: "text-muted-foreground" };
    }
  }
}