export interface Question {
  id: string;
  question_text: string;
  answers: Map<string, boolean>;
}

export interface CreateQuestionRequest {
  question_text: string;
  answers: { [key: string]: boolean };
}

export interface UpdateQuestionRequest {
  question_text?: string;
  answers?: { [key: string]: boolean };
}

export interface DeleteQuestionRequest {
  id: string;
}
