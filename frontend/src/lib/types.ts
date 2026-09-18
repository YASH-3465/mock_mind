export type Question = {
  id: number;
  interview_session_id: number;
  question_number: number;
  question: string;
  ideal_answer: string;
  category: string;
  difficulty: string;
  expected_topics: string;
};

export type InterviewData = {
  session_id: number;
  questions: Question[];
};

export type InterviewQuestionResult = {
  question_number: number;
  question_id: number;
  question: string;
  answer: string | null;
  answer_duration: number | null;
  technical_score: number;
  communication_score: number;
  confidence_score: number;
  overall_score: number;
  feedback: string | null;
};

export type InterviewResult = {
  session_id: number;
  status: string;
  started_at: string;
  completed_at: string | null;
  total_questions: number;
  answered_questions: number;
  evaluated_answers: number;
  technical_score: number;
  communication_score: number;
  confidence_score: number;
  overall_score: number;
  questions: InterviewQuestionResult[];
};
export type InterviewHistoryItem = {
  session_id: number;
  status: string;
  started_at: string;
  completed_at: string | null;
  total_questions: number;
  answered_questions: number;
  technical_score: number;
  communication_score: number;
  confidence_score: number;
  overall_score: number;
};

export type ResumeAnalysis = {
  id: number;
  resume_id: number;
  summary: string | null;
  skills: string | null;
  projects: string | null;
  experience: string | null;
  education: string | null;
  certifications: string | null;
  strengths: string | null;
  weaknesses: string | null;
  created_at: string;
};


export type Resume = {
  id: number;
  file_name: string;
  uploaded_at: string;
  has_analysis?: boolean;
};