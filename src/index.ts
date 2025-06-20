import express from 'express';
import { Client } from 'cassandra-driver';
import { QuestionRepository } from './repositories/QuestionRepository';
import { QuestionService } from './services/QuestionService';
import { QuestionController } from './controllers/QuestionController';

const app = express();
app.use(express.json());

const client = new Client({
  contactPoints: [process.env.CASSANDRA_CONTACT_POINT || 'localhost'],
  localDataCenter: 'datacenter1',
  keyspace: process.env.CASSANDRA_KEYSPACE || "quiz_app",
  protocolOptions: {
    port: parseInt(process.env.CASSANDRA_PORT || '9042', 10)
  }
});

const questionRepository = new QuestionRepository(client);
const questionService = new QuestionService(questionRepository);
const questionController = new QuestionController(questionService);

app.get('/questions', (req, res) => questionController.getAllQuestions(req, res));
app.get('/questions/:id', (req, res) => questionController.getQuestionById(req, res));
app.post('/questions', (req, res) => questionController.createQuestion(req, res));
app.put("/questions/:id", (req, res) => questionController.updateQuestion(req, res));
app.delete("/questions/:id", (req, res) => questionController.deleteQuestion(req, res));

const PORT = process.env.PORT || 3000;

client.connect()
  .then(() => {
    console.log('Connected to Cassandra');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to Cassandra:', err);
  });
