"use client";

import { useEffect, useState } from "react";
import {
  getCourses as getQuercusCourses,
  getUser,
  isAuthenticated as isQuercusAuthenticated,
  getCourseAssignments, // ⬅️ add this
} from "@/integrations/quercus";

import {
  getCourses as getCrowdmarkCourses,
  getAssignments,
  isAuthenticated as isCrowdmarkAuthenticated,
} from "@/integrations/crowdmark";

import { QuercusCourse, QuercusUser } from "@/types/quercus";
import { CrowdmarkCourse, CrowdmarkAssignment } from "@/types/crowdmark";

export default function DebugPage() {
  const [quercusUser, setQuercusUser] = useState<QuercusUser | null>(null);
  const [quercusCourses, setQuercusCourses] = useState<QuercusCourse[]>([]);
  const [crowdmarkCourses, setCrowdmarkCourses] = useState<CrowdmarkCourse[]>(
    []
  );
  const [crowdmarkAssignments, setCrowdmarkAssignments] = useState<
    CrowdmarkAssignment[]
  >([]);
  const [quercusAssignments, setQuercusAssignments] = useState<any[]>([]);

  const [quercusAuth, setQuercusAuth] = useState<boolean | null>(null);
  const [crowdmarkAuth, setCrowdmarkAuth] = useState<boolean | null>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        // Check Quercus auth
        const qAuth = await isQuercusAuthenticated();
        if (qAuth.success) setQuercusAuth(qAuth.data ?? false);

        // Check Crowdmark auth
        const cAuth = await isCrowdmarkAuthenticated();
        if (cAuth.success) setCrowdmarkAuth(cAuth.data ?? false);

        // Quercus User
        const userRes = await getUser();
        if (userRes.success && userRes.data) setQuercusUser(userRes.data);

        // Quercus Courses
        const qCoursesRes = await getQuercusCourses();
        if (qCoursesRes.success && qCoursesRes.data)
          setQuercusCourses(qCoursesRes.data);

        if (
          qCoursesRes.success &&
          qCoursesRes.data &&
          qCoursesRes.data.length > 0 &&
          qCoursesRes.data[0]
        ) {
          const firstCourseId = qCoursesRes.data[0].id;
          const qaRes = await getCourseAssignments(firstCourseId);
          if (qaRes.success && qaRes.data) setQuercusAssignments(qaRes.data);
        }

        // Crowdmark Courses
        const cCoursesRes = await getCrowdmarkCourses();
        if (cCoursesRes.success && cCoursesRes.data)
          setCrowdmarkCourses(cCoursesRes.data);

        // Crowdmark Assignments (for first course if available)
        if (
          cCoursesRes.success &&
          cCoursesRes.data &&
          cCoursesRes.data.length > 0 &&
          cCoursesRes.data[0]
        ) {
          const courseId = cCoursesRes.data[0].id;
          const aRes = await getAssignments(courseId);
          if (aRes.success && aRes.data) setCrowdmarkAssignments(aRes.data);
        }
      } catch (err: any) {
        setError(err.message || "Unknown error");
      }
    }

    load();
  }, []);

  const Badge = ({
    label,
    status,
  }: {
    label: string;
    status: boolean | null;
  }) => {
    let color = "gray";
    let text = "Checking...";
    if (status === true) {
      color = "green";
      text = "Authenticated";
    } else if (status === false) {
      color = "red";
      text = "Not Authenticated";
    }
    return (
      <span
        style={{
          display: "inline-block",
          marginRight: "1rem",
          padding: "0.25rem 0.5rem",
          borderRadius: "0.25rem",
          background: color,
          color: "white",
          fontWeight: "bold",
        }}
      >
        {label}: {text}
      </span>
    );
  };

  return (
    <div style={{ padding: "1rem", fontFamily: "monospace" }}>
      <h1>Raw JSON Debug</h1>

      <div style={{ marginBottom: "1rem" }}>
        <Badge label="Quercus" status={quercusAuth} />
        <Badge label="Crowdmark" status={crowdmarkAuth} />
      </div>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      <h2>Quercus User</h2>
      <pre>{JSON.stringify(quercusUser, null, 2)}</pre>

      <h2>Quercus Courses</h2>
      <pre>{JSON.stringify(quercusCourses, null, 2)}</pre>

      <h2>Quercus Assignments</h2>
      <pre>{JSON.stringify(quercusAssignments, null, 2)}</pre>

      <h2>Crowdmark Courses</h2>
      <pre>{JSON.stringify(crowdmarkCourses, null, 2)}</pre>

      <h2>Crowdmark Assignments</h2>
      <pre>{JSON.stringify(crowdmarkAssignments, null, 2)}</pre>
    </div>
  );
}
