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
  private diceTimeouts: Map<string, NodeJS.Timeout> = new Map();

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
    // Validate player name is not empty
    if (!playerName || playerName.trim().length === 0) {
      socket.emit("game-error", {
        message: "Player name cannot be empty",
      });
      return;
    }

    // Check if player name is already taken
    const existingPlayer = Array.from(this.gameState.players.values())
      .find(player => player.name.toLowerCase() === playerName.trim().toLowerCase());
    
    if (existingPlayer) {
      socket.emit("game-error", {
        message: "Player name already taken. Please choose a different name.",
      });
      return;
    }

    const player = new Player(socket.id, playerName.trim());

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

    // Clear any pending dice timeout for this player
    const timeout = this.diceTimeouts.get(socket.id);
    if (timeout) {
      clearTimeout(timeout);
      this.diceTimeouts.delete(socket.id);
    }

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

    // Set the admin who started the game
    this.gameState.setAdmin(socket.id);
    
    this.gameState.startGame();
    this.broadcastMessage({
      type: "GAME_STARTED",
      playerCount: this.gameState.players.size,
    });
    this.broadcastGameState();
    
    this.startPlayerTurn();
  }

  public restartGame(socket: any): void {
    // Clear all dice timeouts
    this.diceTimeouts.forEach(timeout => clearTimeout(timeout));
    this.diceTimeouts.clear();

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

    // Clear any existing timeout for this player
    const existingTimeout = this.diceTimeouts.get(socket.id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.diceTimeouts.delete(socket.id);
    }

    this.performDiceRoll(currentPlayer);
  }

  private performDiceRoll(player: Player): void {
    const diceValue = this.gameState.rollDice();
  
    this.broadcastMessage({
      type: "DICE_SHAKING",
      player: player.getInfo(),
    });
  
    setTimeout(() => {
      this.broadcastMessage({
        type: "DICE_ROLLED",
        player: player.getInfo(),
        diceValue: diceValue,
      });
      
      // Check if player will land on ladder or snake
      const targetPosition = player.position + diceValue;
      const hasLadderOrSnake = this.gameState.ladders.has(targetPosition) || this.gameState.snakes.has(targetPosition);
      
      if (hasLadderOrSnake) {
        // Skip question and move directly
        this.movePlayerWithAnimation(player, diceValue);
      } else {
        // Present question as normal
        this.presentQuestion();
      }
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

    // Clear any existing timeout
    const existingTimeout = this.diceTimeouts.get(currentPlayer.id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

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

    // Set timeout for automatic dice roll (6 seconds)
    const timeout = setTimeout(() => {
      console.log(`Auto-rolling dice for player ${currentPlayer.name} due to timeout`);
      
      this.broadcastMessage({
        type: "AUTO_DICE_ROLL",
        player: currentPlayer.getInfo(),
        message: `${currentPlayer.name} took too long. Auto-rolling dice...`,
      });

      this.performDiceRoll(currentPlayer);
      this.diceTimeouts.delete(currentPlayer.id);
    }, 6000);

    this.diceTimeouts.set(currentPlayer.id, timeout);
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
