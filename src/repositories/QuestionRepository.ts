import { Client, types } from 'cassandra-driver';
import { Question } from '../models/Question';

export class QuestionRepository {
  constructor(private client: Client) {}

  async findAll(): Promise<Question[]> {
    const query = 'SELECT * FROM questions';
    const result = await this.client.execute(query);

    
    return result.rows.map(row => ({
      id: row.id.toString(),
      question_text: row.question_text,
      answers: new Map(Object.entries(row.answers))
    }));
  }

  async findById(id: string): Promise<Question | null> {
    const query = 'SELECT * FROM questions WHERE id = ?';
    const result = await this.client.execute(query, [types.Uuid.fromString(id)]);
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return {
      id: row.id.toString(),
      question_text: row.question_text,
      answers: new Map(Object.entries(row.answers))
    };
  }

  
  async create(question: Omit<Question, 'id'>): Promise<Question> {
    const id = types.Uuid.random();
    const query = 'INSERT INTO questions (id, question_text, answers) VALUES (?, ?, ?)';
    
    const answersObject = Object.fromEntries(question.answers);
    
    // Use prepared statement with proper type hints
    await this.client.execute(query, [id, question.question_text, answersObject], {
      prepare: true,
    });
    
    return {
      id: id.toString(),
      ...question
    };
  }

  async update(id: string, updates: Partial<Omit<Question, 'id'>>): Promise<Question | null> {
    // First check if question exists
    const existing = await this.findById(id);
    if (!existing) return null;

    const setClauses = [];
    const params = [];

    if (updates.question_text !== undefined) {
      setClauses.push('question_text = ?');
      params.push(updates.question_text);
    }

    if (updates.answers !== undefined) {
      setClauses.push('answers = ?');
      params.push(Object.fromEntries(updates.answers));
    }

    if (setClauses.length === 0) return existing;

    const query = `UPDATE questions SET ${setClauses.join(', ')} WHERE id = ?`;
    params.push(types.Uuid.fromString(id));

    await this.client.execute(query, params, { prepare: true });

    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM questions WHERE id = ?';
    await this.client.execute(query, [types.Uuid.fromString(id)], { prepare: true });
    return true;
  }
}
