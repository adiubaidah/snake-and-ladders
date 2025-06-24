import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer, type Server as ServerType } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { Client } from "cassandra-driver";
import { QuestionRepository } from "./repositories/QuestionRepository";
import { QuestionService } from "./services/QuestionService";
import { QuestionController } from "./controllers/QuestionController";
import { GameManager } from "./game/GameManager";

const app = express();
const server: ServerType = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(express.json());
app.use(
  cors({
    origin: "*",
  })
);
app.use(express.static("public"));

const client = new Client({
  contactPoints: [process.env.CASSANDRA_CONTACT_POINT || "localhost"],
  localDataCenter: "datacenter1",
  keyspace: process.env.CASSANDRA_KEYSPACE || "quiz_app",
  protocolOptions: {
    port: parseInt(process.env.CASSANDRA_PORT || "9042", 10),
  },
});

const questionRepository = new QuestionRepository(client);
const questionService = new QuestionService(questionRepository);
const questionController = new QuestionController(questionService);
const gameManager = new GameManager(io, questionService);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-game", ({ playerName }: { playerName: string }) => {
    if (playerName !== process.env.ADMIN_USERNAME) {
      gameManager.addPlayer(socket, playerName);
    } else {
      gameManager.adminJoin(socket);
    }
  });

  socket.on("start-game", () => {
    gameManager.startGame(socket);
  });

  socket.on("shake-dice", () => {
    gameManager.shakeDice(socket);
  });

  socket.on("answer-question", ({ answer }: { answer: string }) => {
    gameManager.answerQuestion(socket, answer);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    gameManager.removePlayer(socket);
  });
});

app.get("/questions", (req, res) =>
  questionController.getAllQuestions(req, res)
);
app.get("/questions/:id", (req, res) =>
  questionController.getQuestionById(req, res)
);
app.post("/questions", (req, res) =>
  questionController.createQuestion(req, res)
);
app.put("/questions/:id", (req, res) =>
  questionController.updateQuestion(req, res)
);
app.delete("/questions/:id", (req, res) =>
  questionController.deleteQuestion(req, res)
);

// Serve the game client
app.get("/game", (req, res) => {
  res.sendFile(__dirname + "/../../frontend/game.html");
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

client
  .connect()
  .then(() => {
    console.log("Connected to Cassandra");
    server.listen(Number(PORT), HOST, () => {
      console.log(`Server running on http://${HOST}:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to Cassandra:", err);
  });
