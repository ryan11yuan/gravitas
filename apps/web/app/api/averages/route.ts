import { neon } from "@neondatabase/serverless";
import {
  getCourseAssignments,
  getCourses,
  getUser,
} from "@workspace/quercus-client/api";
import { NextResponse } from "next/server";
import crypto from "node:crypto";

function userHash(id: number | string) {
  const secret = process.env.USER_HASH_SECRET!;
  return crypto.createHmac("sha256", secret).update(String(id)).digest("hex");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const assignmentId = Number(searchParams.get("assignmentId"));

  if (!assignmentId || Number.isNaN(assignmentId)) {
    return NextResponse.json(
      { error: "assignmentId required" },
      { status: 400 }
    );
  }

  try {
    const sql = neon(process.env.NEON_DATABASE_URL!);

    const rows = await sql`
      select
        round(avg(percent))::int       as avg,
        count(distinct user_hash)::int as count
      from assignment_scores
      where assignment_id = ${assignmentId}
        and percent is not null
    `;

    const { avg, count } = rows?.[0] ?? { avg: null, count: 0 };
    return NextResponse.json({ assignmentId, avgPercent: avg, count });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "DB error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  type Body = { cookie?: string };

  let body: Body | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const cookie = (body?.cookie ?? "").trim();
  if (!cookie) {
    return NextResponse.json({ error: "cookie required" }, { status: 400 });
  }

  try {
    const sql = neon(process.env.NEON_DATABASE_URL!);

    const userRes = await getUser({ headers: { cookie } });
    if (!userRes.success || !userRes.data) {
      return NextResponse.json(
        { error: userRes.error?.message || "Failed to fetch user" },
        { status: 502 }
      );
    }
    const userId = userRes.data.id;
    const uhash = userHash(userId);

    const coursesRes = await getCourses({ headers: { cookie } });
    if (!coursesRes.success || !coursesRes.data) {
      return NextResponse.json(
        { error: coursesRes.error?.message || "Failed to fetch courses" },
        { status: 502 }
      );
    }
    const courses = coursesRes.data;

    let processed = 0;
    let upserts = 0;
    let skippedNoScore = 0;

    for (const course of courses) {
      const courseId = course.id;

      const aRes = await getCourseAssignments(courseId, {
        headers: { cookie },
      });
      if (!aRes.success || !aRes.data) {
        continue;
      }

      for (const a of aRes.data) {
        processed++;

        const score = a?.submission?.score ?? null;
        const pts = a?.points_possible ?? null;

        if (score == null || pts == null || pts === 0) {
          skippedNoScore++;
          continue;
        }

        let percent = Math.round((score / pts) * 100);
        if (percent < 0) percent = 0;
        if (percent > 100) percent = 100;

        await sql`
          insert into assignment_scores (user_hash, course_id, assignment_id, percent)
          values (${uhash}, ${courseId}, ${a.id}, ${percent})
          on conflict (assignment_id, user_hash)
          do update set
            percent    = excluded.percent,
            course_id  = excluded.course_id,
            updated_at = now();
        `;

        upserts++;
      }
    }

    return NextResponse.json({
      ok: true,
      processed,
      upserts,
      skippedNoScore,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
