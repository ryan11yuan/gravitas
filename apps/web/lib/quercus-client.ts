import { ApiResponse, fetchWithExtension } from "@/lib/extension-client";
import { QuercusAssignment, QuercusCourse, QuercusFile, QuercusUser } from "@/common/types/quercus";

const BASE_URL = "https://q.utoronto.ca";

export async function isQuercusAuthenticated(): Promise<ApiResponse<boolean>> {
  const res = await fetchWithExtension<QuercusUser>(
    `${BASE_URL}/api/v1/users/self`
  );

  if (res.success && res.data) {
    return { success: true, data: true, error: null };
  }

  if (res.error?.status === 401) {
    return { success: true, data: false, error: null };
  }

  return {
    success: false,
    data: null,
    error: res.error ?? {
      status: -1,
      statusText: "AuthCheckError",
      message: "Unknown authentication error",
    },
  };
}

export async function getQuercusCourses(): Promise<ApiResponse<QuercusCourse[]>> {
  return fetchWithExtension<QuercusCourse[]>(
    `${BASE_URL}/api/v1/users/self/courses?enrollment_type=student&enrollment_state=active`
  );
}

export async function getQuercusUser(): Promise<ApiResponse<QuercusUser>> {
  return fetchWithExtension<QuercusUser>(
    `${BASE_URL}/api/v1/users/self?include[]=uuid&include[]=last_login`
  );
}

export async function getQuercusCourseAssignments(
  courseId: number
): Promise<ApiResponse<QuercusAssignment[]>> {
  return fetchWithExtension<QuercusAssignment[]>(
    `${BASE_URL}/api/v1/users/self/courses/${courseId}/assignments?include[]=submission`
  );
}

/**
 * There are two ways to call this function:
 *
 * 1. Using `courseId` and `fileId` — directly constructs the API URL:
 *      getQuercusCourseFile(405798, 39338105)
 *      → fetches "https://q.utoronto.ca/api/v1/courses/405798/files/39338105"
 *
 * 2. Using a full URL (already extracted elsewhere):
 *      getQuercusCourseFile("https://q.utoronto.ca/api/v1/courses/405798/files/39338105")
 *
 * Background:
 * When viewing a file in Quercus (Canvas), the page’s HTML often contains a hidden
 * `<a>` tag or metadata link pointing to the *actual API route* (e.g., `/api/v1/courses/.../files/...`).
 * If we scrape or inspect that HTML and extract the URL, we can call this helper directly
 * to get structured JSON metadata about the file.
 */
export async function getQuercusCourseFile(a: number | string, b?: number): Promise<ApiResponse<QuercusFile>> {
  const url =
    typeof a === "string"
      ? a
      : `${BASE_URL}/api/v1/courses/${a}/files/${b}`;
  return fetchWithExtension<QuercusFile>(url);
}