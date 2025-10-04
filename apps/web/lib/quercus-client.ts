import { ApiResponse, fetchWithExtension } from "@/lib/extension-client";
import { QuercusAssignment, QuercusCourse, QuercusUser } from "@/common/types/quercus";

const BASE_URL = "https://q.utoronto.ca";

export async function isAuthenticated(): Promise<ApiResponse<boolean>> {
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

export async function getCourses(): Promise<ApiResponse<QuercusCourse[]>> {
  return fetchWithExtension<QuercusCourse[]>(
    `${BASE_URL}/api/v1/users/self/courses?enrollment_type=student&enrollment_state=active`
  );
}

export async function getUser(): Promise<ApiResponse<QuercusUser>> {
  return fetchWithExtension<QuercusUser>(
    `${BASE_URL}/api/v1/users/self?include[]=uuid&include[]=last_login`
  );
}

export async function getCourseAssignments(
  courseId: number
): Promise<ApiResponse<QuercusAssignment[]>> {
  return fetchWithExtension<QuercusAssignment[]>(
    `${BASE_URL}/api/v1/users/self/courses/${courseId}/assignments?include[]=submission`
  );
}