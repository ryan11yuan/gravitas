export interface CrowdmarkCourseStatistics {
  assessments: {
    scoreUuid: string;
    title: string;
    myScore: number;
    averageScore: number;
  }[];
  bestQuestions: {
    examMasterQuestionId: number;
    scoreUuid: string;
    title: string;
    myScore: number;
    averageScore: number;
    topics: string[];
  }[];
  worstQuestions: {
    examMasterQuestionId: number;
    scoreUuid: string;
    title: string;
    myScore: number;
    averageScore: number;
    topics: string[];
  }[];
  topics: string[];
  bestTopics: string[];
  worstTopics: string[];
}

export interface CrowdmarkAssignment {
  id: string;
  type: "assignments";
  attributes: {
    "submitted-at": string | null;
    "retrieved-at": string;                 // ISO8601, sometimes with offset
    "penalty-period": string;               // e.g., "day"
    "penalty-value": number;                // e.g., 100
    due: string;                            // ISO8601 (Z or offset)
    "marks-sent-at": string | null;
    "is-locked": boolean;
    "normalized-points": number | string;   // can be number (0) or string ("1.0")
    "group-id": number;
    "is-part-of-group": boolean;
    "populate-exam-questions-id": string | null;
    "score-uuid": string | null;            // may be a UUID or a non-UUID string (e.g., "nope")
    "additional-instructions": string | null;
    "is-facilitator": boolean;
    "penalty-override": string | null;
  };
  relationships: {
    "exam-master": {
      data: {
        type: "exam-masters";
        id: string;                         // e.g., "tutorial-exercise-4-e8511"
      };
    };
    course: {
      meta: {
        included: boolean;                  // false in your sample
      };
    };
    questions: {
      meta: {
        included: boolean;                  // false in your sample
      };
    };
  };
  links: {
    self: string;
  };
}

export interface CrowdmarkExamMaster {
  id: string;
  type: "exam-masters";
  attributes: {
    title: string;                          // e.g., "tutorial exercise 4"
    type: string;                           // e.g., "ExamMaster::AtHome"
  };
}

/**
 * Response shape for the assignments list endpoint that returns:
 * - data: assignments[]
 * - included: exam-masters[]
 * - meta: can be empty object
 * - jsonapi: version
 */
export interface CrowdmarkAssignmentsResponse {
  data: CrowdmarkAssignment[];
  included?: CrowdmarkExamMaster[];         // present in your sample
  meta: Record<string, unknown>;            // {} in your sample
  jsonapi: {
    version: string;                        // "1.0" in your sample
  };
}

export interface CrowdmarkCourse {
  id: string;
  type: "courses";
  attributes: {
    name: string;
    "exam-master-count": number;
  };
  relationships: {
    "course-archivation": {
      data: null | {
        id: string;
        type: string;
      };
    };
  };
}

export interface CrowdmarkPagination {
  "total-records": number;
  "total-pages": number;
  "page-size": number;
  "current-page": number;
  "prev-page": number | null;
  "next-page": number | null;
}

export interface CrowdmarkResponse<T> {
  data: T[];
  meta: {
    pagination: CrowdmarkPagination;
  };
  jsonapi: {
    version: string;
  };
}