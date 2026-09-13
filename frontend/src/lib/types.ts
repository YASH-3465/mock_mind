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

export type InterviewResult = {
  session_id: number;
  status: string;
  completed_at: string;
  total_questions: number;
  answered_questions: number;
  evaluated_answers: number;
  technical_score: number;
  communication_score: number;
  confidence_score: number;
  overall_score: number;
};
