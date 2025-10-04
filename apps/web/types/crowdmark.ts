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
    "retrieved-at": string;
    "penalty-period": string; // e.g. "day"
    "penalty-value": number;
    due: string; // ISO datetime
    "marks-sent-at": string | null;
    "is-locked": boolean;
    "normalized-points": number | string; // sometimes numeric, sometimes string
    "group-id": number;
    "is-part-of-group": boolean;
    "populate-exam-questions-id": string | null;
    "score-uuid": string | null;
    "additional-instructions": string | null;
    "is-facilitator": boolean;
    "penalty-override": string | null;
  };
  relationships: {
    "exam-master": {
      data: {
        type: "exam-masters";
        id: string;
      };
    };
    course: {
      meta: {
        included: boolean;
      };
    };
    questions: {
      meta: {
        included: boolean;
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
    title: string;
    type: string; // e.g. "ExamMaster::AtHome"
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