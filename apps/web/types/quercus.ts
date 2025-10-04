export interface QuercusUser {
  id: number;
  name: string;
  sortable_name: string;
  last_name: string;
  first_name: string;
  short_name: string;
  email?: string;
}

export interface QuercusCourse {
  id: number;
  name: string;
  course_code: string;
  original_name?: string;
  total_students?: number;
  teachers?: Array<{
    id: number;
    display_name: string;
    avatar_image_url: string;
    html_url: string;
  }>;
}

export interface QuercusAssignment {
  id: number;
  course_id: number;

  name: string;
  description?: string | null;

  html_url?: string;
  created_at?: string;
  updated_at?: string;

  due_at?: string | null;
  lock_at?: string | null;
  unlock_at?: string | null;

  points_possible?: number;
  grading_type?:
    | "pass_fail"
    | "percent"
    | "letter_grade"
    | "gpa_scale"
    | "points";

  submission?: QuercusSubmission | null;
}

export interface QuercusSubmission {
  assignment_id: number;
  user_id: number;

  attempt?: number;
  body?: string | null;

  grade?: string | null; // translated grade (e.g. letter, % depending on scheme)
  score?: number | null; // raw numeric score
  grader_id?: number | null;
  graded_at?: string | null;

  submitted_at?: string | null;
  workflow_state?: "submitted" | "unsubmitted" | "graded" | string;

  late?: boolean;
  missing?: boolean;
  excused?: boolean;

  html_url?: string;
  preview_url?: string;

  assignment_visible?: boolean;
  posted_at?: string | null;
}