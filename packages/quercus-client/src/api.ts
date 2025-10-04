import { QuercusAssignment, QuercusCourse, QuercusUser } from "./types";

const BASE_URL = "https://q.utoronto.ca";

type ApiError = {
  status: number;
  statusText: string;
  message: string;
};

type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: ApiError | null;
};

const isBrowser = typeof window !== "undefined";

/**
 * Generic fetch wrapper for Quercus API
 * @param path API path, e.g. `/api/v1/users/self`
 * @param options fetch options
 * @returns ApiResponse<T>
 */
export async function fetchQuercus<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response: Response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      // Only include cookies in the browser; avoid server/SSR surprises & CORS issues.
      credentials: isBrowser ? "include" : "omit",
    });

    if (!response.ok) {
      return {
        success: false,
        data: null,
        error: {
          status: response.status,
          statusText: response.statusText,
          message: `Quercus API error: ${response.status} ${response.statusText}`,
        },
      };
    }

    const data: T = await response.json();
    return { success: true, data, error: null };
  } catch (err: any) {
    return {
      success: false,
      data: null,
      error: {
        status: -1,
        statusText: "FetchError",
        message: err?.message || "Unknown error",
      },
    };
  }
}

/** Fetch the current user’s assignments in a course */
export async function getCourseAssignments(
  courseId: number,
  options: RequestInit = {}
): Promise<ApiResponse<QuercusAssignment[]>> {
  return fetchQuercus<QuercusAssignment[]>(
    `/api/v1/users/self/courses/${courseId}/assignments?include[]=submission`,
    options
  );
}

/** Fetch the current user’s active student courses */
export async function getCourses(
  options: RequestInit = {}
): Promise<ApiResponse<QuercusCourse[]>> {
  return fetchQuercus<QuercusCourse[]>(
    "/api/v1/users/self/courses" +
      "?include[]=needs_grading_count" +
      "&include[]=syllabus_body" +
      "&include[]=public_description" +
      "&include[]=total_scores" +
      "&include[]=current_grading_period_scores" +
      "&include[]=grading_periods" +
      "&include[]=term" +
      "&include[]=account" +
      "&include[]=course_progress" +
      "&include[]=sections" +
      "&include[]=storage_quota_used_mb" +
      "&include[]=total_students" +
      "&include[]=passback_status" +
      "&include[]=favorites" +
      "&include[]=teachers" +
      "&include[]=observed_users" +
      "&include[]=course_image" +
      "&include[]=banner_image" +
      "&include[]=concluded" +
      "&include[]=post_manually" +
      "&enrollment_type=student" +
      "&enrollment_state=active",
    options
  );
}

/** Fetch the current user’s profile information */
export async function getUser(
  options: RequestInit = {}
): Promise<ApiResponse<QuercusUser>> {
  return fetchQuercus<QuercusUser>(
    "/api/v1/users/self?include[]=uuid&include[]=last_login",
    options
  );
}
