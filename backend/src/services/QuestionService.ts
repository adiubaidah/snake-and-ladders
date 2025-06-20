import { Question, CreateQuestionRequest, UpdateQuestionRequest } from '../models/Question';
import { QuestionRepository } from '../repositories/QuestionRepository';

export class QuestionService {
  constructor(private questionRepository: QuestionRepository) {}

  async getAllQuestions(): Promise<Question[]> {
    return await this.questionRepository.findAll();
  }

  async getQuestionById(id: string): Promise<Question | null> {
    return await this.questionRepository.findById(id);
  }

  async createQuestion(request: CreateQuestionRequest): Promise<Question> {
    const correctAnswers = Object.values(request.answers).filter(isCorrect => isCorrect);
    if (correctAnswers.length !== 1) {
      throw new Error('Exactly one answer must be correct');
    }

    const question: Omit<Question, 'id'> = {
      question_text: request.question_text,
      answers: new Map(Object.entries(request.answers))
    };

    return await this.questionRepository.create(question);
  }

  async updateQuestion(id: string, request: UpdateQuestionRequest): Promise<Question | null> {
    // Validate answers if provided
    if (request.answers) {
      const correctAnswers = Object.values(request.answers).filter(isCorrect => isCorrect);
      if (correctAnswers.length !== 1) {
        throw new Error('Exactly one answer must be correct');
      }
    }

    const updates: Partial<Omit<Question, 'id'>> = {};
    
    if (request.question_text !== undefined) {
      updates.question_text = request.question_text;
    }
    
    if (request.answers !== undefined) {
      updates.answers = new Map(Object.entries(request.answers));
    }

    return await this.questionRepository.update(id, updates);
  }

  async deleteQuestion(id: string): Promise<boolean> {
    return await this.questionRepository.delete(id);
  }
}
