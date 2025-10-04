import {
  CrowdmarkAssignment,
  CrowdmarkAssignmentsResponse,
  CrowdmarkCourse,
  CrowdmarkCourseStatistics,
  CrowdmarkResponse,
} from "@/common/types/crowdmark";
import { ApiResponse, fetchWithExtension } from "@/lib/extension-client";

const BASE_URL = "https://app.crowdmark.com";

export async function isCrowdmarkAuthenticated(): Promise<ApiResponse<boolean>> {
  const res = await fetchWithExtension<CrowdmarkResponse<CrowdmarkCourse> | string>(
    `${BASE_URL}/api/v2/student/courses?filter[is_archived]=false&page[number]=1`
  );

  if (!res.success) {
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

  if (typeof res.data === "string") {
    return { success: true, data: false, error: null };
  }

  return { success: true, data: true, error: null };
}


export async function getCrowdmarkCourses(): Promise<ApiResponse<CrowdmarkCourse[]>> {
  return fetchAllPages<CrowdmarkCourse>(
    `${BASE_URL}/api/v2/student/courses`,
    "?filter[is_archived]=false"
  );
}

export async function getCrowdmarkAssignments(
  courseId: string
): Promise<ApiResponse<CrowdmarkAssignmentsResponse>> {
  return fetchWithExtension<CrowdmarkAssignmentsResponse>(
    `${BASE_URL}/api/v2/student/assignments?fields[exam-masters][]=type&fields[exam-masters][]=title&filter[course]=${courseId}`
  );
}

export async function getCrowdmarkCourseStatistics(
  courseId: string
): Promise<ApiResponse<CrowdmarkCourseStatistics>> {
  return fetchWithExtension<CrowdmarkCourseStatistics>(
    `${BASE_URL}/api/v2/student/courses/${courseId}/statistics`
  );
}

export async function fetchAllPages<T>(
  baseUrl: string,
  query: string
): Promise<ApiResponse<T[]>> {
  const allItems: T[] = [];
  let currentPage = 1;
  let hasNext = true;

  try {
    while (hasNext) {
      const res = await fetchWithExtension<CrowdmarkResponse<T>>(
        `${baseUrl}${query}${query.includes("?") ? "&" : "?"}page[number]=${currentPage}`
      );

      if (!res.success || !res.data) {
        return {
          success: false,
          data: null,
          error: res.error,
        };
      }

      allItems.push(...res.data.data);

      const { pagination } = res.data.meta;
      hasNext = pagination["next-page"] !== null;
      if (hasNext) {
        currentPage = pagination["next-page"]!;
      }
    }

    return {
      success: true,
      data: allItems,
      error: null,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: {
        status: -1,
        statusText: "ExtensionFetchError",
        message: error?.message || String(error),
      },
    };
  }
}
