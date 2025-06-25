import { Socket, DefaultEventsMap } from "socket.io";
import { QuestionService } from "../services/QuestionService";
import { Player } from "./Player";
import { GameState } from "./GameState";

type GameMessage = {
  type: string;
  playerName?: string;
  playerId?: string;
  timestamp: string;
  [key: string]: any;
};

export class GameManager {
  private io: any;
  private questionService: QuestionService;
  private gameState: GameState;

  constructor(io: any, questionService: QuestionService) {
    this.io = io;
    this.questionService = questionService;
    this.gameState = new GameState();
  }

  public async adminJoin(
    socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
  ): Promise<void> {
    socket.join("game-room");
    socket.emit("admin-joined", {
      message: "Admin joined the game",
    });
  }

  public async addPlayer(
    socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
    playerName: string
  ): Promise<void> {
    const player = new Player(socket.id, playerName);

    this.gameState.addPlayer(player);

    socket.join("game-room");

    this.broadcastMessage({
      type: "PLAYER_JOINED",
      player: player.getInfo(),
    });
    this.broadcastGameState();

    socket.emit("joined-game" , player.getInfo());
  }

  public removePlayer(socket: any): void {
    const player = this.gameState.players.get(socket.id);
    if (!player) return;

    this.gameState.removePlayer(socket.id);
    this.broadcastMessage({
      type: "PLAYER_LEFT",
      player: player.getInfo(),
    });
    this.broadcastGameState();
  }

  public startGame(socket: any): void {
    if (this.gameState.players.size < 2) {
      socket.emit("game-error", {
        message: "Need at least 2 players to start",
      });
      return;
    }

    this.gameState.startGame();
    this.broadcastMessage({
      type: "GAME_STARTED",
      playerCount: this.gameState.players.size,
    });
    this.broadcastGameState();
    this.startPlayerTurn();
  }

  public restartGame(socket: any): void {
    this.broadcastMessage({
      type: "GAME_RESTARTED",
      message: "Game has been restarted by admin",
    });

    this.io.to("game-room").disconnectSockets();

    this.gameState = new GameState();

    this.broadcastGameState();
  }

  public shakeDice(socket: any): void {
    const currentPlayer = this.gameState.getCurrentPlayer();
    if (!currentPlayer || currentPlayer.id !== socket.id) {
      socket.emit("game-error", { message: "Not your turn" });
      return;
    }

    if (this.gameState.waitingForAnswer) {
      socket.emit("game-error", {
        message: "Already shook dice, answer the question",
      });
      return;
    }

    const diceValue = this.gameState.rollDice();

    this.broadcastMessage({
      type: "DICE_SHAKING",
      player: currentPlayer.getInfo(),
    });

    setTimeout(() => {
      this.broadcastMessage({
        type: "DICE_ROLLED",
        player: currentPlayer.getInfo(),
        diceValue: diceValue,
      });
      this.presentQuestion();
    }, 1000);
  }

  public async answerQuestion(socket: any, answer: string): Promise<void> {
    const currentPlayer = this.gameState.getCurrentPlayer();
    if (!currentPlayer || currentPlayer.id !== socket.id) {
      socket.emit("game-error", { message: "Not your turn" });
      return;
    }

    if (!this.gameState.waitingForAnswer || !this.gameState.currentQuestion) {
      socket.emit("game-error", { message: "No question to answer" });
      return;
    }
    const correctAnswer = Array.from(
      this.gameState.currentQuestion.answers.entries()
    ).find(([_, value]) => value === true)?.[0];
    const isCorrect = answer === correctAnswer;

    this.broadcastMessage({
      type: "ANSWER_VALIDATED",
      player: currentPlayer.getInfo(),
      isCorrect: isCorrect,
      selectedAnswer: answer,
      correctAnswer: correctAnswer,
    });

    if (isCorrect) {
      this.movePlayerWithAnimation(currentPlayer, this.gameState.diceValue);
    } else {
      this.broadcastMessage({
        type: "PLAYER_STAYS",
        player: currentPlayer.getInfo(),
        playerId: currentPlayer.id,
        reason: "WRONG_ANSWER",
      });

      setTimeout(() => {
        this.nextTurn();
      }, 2000);
    }
  }

  private async presentQuestion(): Promise<void> {
    try {
      const questions = await this.questionService.getAllQuestions();
      if (questions.length === 0) return;
      const randomQuestion =
        questions[Math.floor(Math.random() * questions.length)];

      this.gameState.setQuestion(randomQuestion);

      this.broadcastMessage({
        type: "QUESTION_PRESENTED",
        player: this.gameState.getCurrentPlayer()?.getInfo(),
        question: {
          id: randomQuestion.id,
          text: randomQuestion.question_text,
          answers: Array.from(randomQuestion.answers.entries()).map(
            ([key, _]) => key
          ),
        },
      });
      this.broadcastGameState();
    } catch (error) {
      console.error("Error getting question:", error);
    }
  }

  private movePlayerWithAnimation(player: Player, steps: number): void {
    const path = this.gameState.movePlayer(player, steps);
    let stepIndex = 0;

    const animateStep = () => {
      if (stepIndex < path.length) {
        const position = path[stepIndex];
        this.broadcastMessage({
          type: "PLAYER_STEPPING",
          player: player.getInfo(),
          stepNumber: stepIndex + 1,
          totalSteps: path.length,
          currentPosition: position,
        });
        stepIndex++;

        setTimeout(animateStep, 500); // 500ms delay between steps
      } else {
        // Animation complete
        const finalPosition = player.position;
        this.broadcastMessage({
          type: "PLAYER_MOVED",
          player: player.getInfo(),
          finalPosition: finalPosition,
          stepsCount: steps,
        });

        // Check for ladder or snake
        if (this.gameState.ladders.has(finalPosition)) {
          this.broadcastMessage({
            type: "LADDER_CLIMBED",
            player: player.getInfo(),
            fromPosition: finalPosition,
            toPosition: player.position,
          });
        } else if (this.gameState.snakes.has(finalPosition)) {
          this.broadcastMessage({
            type: "SNAKE_SLID",
            player: player.getInfo(),
            fromPosition: finalPosition,
            toPosition: player.position,
          });
        }

        // Check for winner
        if (this.gameState.checkWinner(player)) {
          this.broadcastMessage({
            type: "GAME_FINISHED",
            player: player.getInfo(),
            finalPosition: player.position,
          });
          this.broadcastMessage({
            type: "WINNER_ANNOUNCED",
            player: player.getInfo(),
          });
          this.broadcastGameState();
        } else {
          setTimeout(() => {
            this.nextTurn();
          }, 2000);
        }
      }
    };

    animateStep();
  }

  private startPlayerTurn(): void {
    const currentPlayer = this.gameState.getCurrentPlayer();
    if (!currentPlayer) return;

    // Broadcast to all players that a turn has started
    this.broadcastMessage({
      type: "TURN_STARTED",
      player: currentPlayer.getInfo(),
      currentPosition: currentPlayer.position,
    });

    // Send specific message to the current player
    this.io.to(currentPlayer.id).emit("game-message", {
      type: "YOUR_TURN",
      player: currentPlayer.getInfo(),
      message: "It's your turn! Roll the dice.",
      timestamp: new Date().toISOString(),
    });

    this.broadcastGameState();
  }

  private nextTurn(): void {
    this.gameState.nextTurn();
    this.startPlayerTurn();
  }

  private broadcastMessage(
    messageData: Omit<GameMessage, "timestamp" | "type"> & { type: string }
  ): void {
    const message: GameMessage = {
      ...messageData,
      timestamp: new Date().toISOString(),
    };

    this.io.to("game-room").emit("game-message", message);
  }

  private broadcastGameState(): void {
    this.io
      .to("game-room")
      .emit("game-state-update", this.gameState.getGameStateForClient());
  }
}
