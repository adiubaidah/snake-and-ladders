import { Request, Response } from "express";
import { QuestionService } from "../services/QuestionService";
import { CreateQuestionRequest, UpdateQuestionRequest } from "../models/Question";

export class QuestionController {
  constructor(private questionService: QuestionService) {}

  async getAllQuestions(req: Request, res: Response): Promise<void> {
    try {
      const questions = await this.questionService.getAllQuestions();
      const serializedQuestions = questions.map((q) => ({
        ...q,
        answers: Object.fromEntries(q.answers),
      }));
      res.json(serializedQuestions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  }

  async getQuestionById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const question = await this.questionService.getQuestionById(id);

      if (!question) {
        res.status(404).json({ error: "Question not found" });
        return;
      }

      res.json({
        ...question,
        answers: Object.fromEntries(question.answers),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch question" });
    }
  }

  async createQuestion(req: Request, res: Response): Promise<void> {
    try {
      const request: CreateQuestionRequest = req.body;
      const question = await this.questionService.createQuestion(request);
      res.status(201).json(question);
    } catch (error) {
      console.log("Error creating question:", error);
      if (
        error instanceof Error &&
        error.message === "Exactly one answer must be correct"
      ) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: "Failed to create question" });
    }
  }

  async updateQuestion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const request: UpdateQuestionRequest = req.body;

      const updatedQuestion = await this.questionService.updateQuestion(
        id,
        request
      );

      if (!updatedQuestion) {
        res.status(404).json({ error: "Question not found" });
        return;
      }

      res.json({
        ...updatedQuestion,
        answers: Object.fromEntries(updatedQuestion.answers),
      });
    } catch (error) {
      console.log("Error updating question:", error);
      if (
        error instanceof Error &&
        error.message === "Exactly one answer must be correct"
      ) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: "Failed to update question" });
    }
  }

  async deleteQuestion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await this.questionService.deleteQuestion(id);

      if (!deleted) {
        res.status(404).json({ error: "Question not found" });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.log("Error deleting question:", error);
      res.status(500).json({ error: "Failed to delete question" });
    }
  }
}
