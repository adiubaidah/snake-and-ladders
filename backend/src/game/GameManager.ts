import { QuestionService } from '../services/QuestionService';
import { Player } from './Player';
import { GameState } from './GameState';

export class GameManager {
  private io: any;
  private questionService: QuestionService;
  private gameState: GameState;

  constructor(io: any, questionService: QuestionService) {
    this.io = io;
    this.questionService = questionService;
    this.gameState = new GameState();
  }

  public async addPlayer(socket: any, playerName: string): Promise<void> {
    const isAdmin = this.gameState.players.size === 0; // First player is admin
    const player = new Player(socket.id, playerName, isAdmin);
    
    this.gameState.addPlayer(player);
    
    socket.join('game-room');
    
    this.broadcastMessage(`${playerName} joined the game`);
    this.broadcastGameState();
    
    socket.emit('joined-game', {
      playerId: player.id,
      playerName: player.name,
      isAdmin: player.isAdmin
    });
  }

  public removePlayer(socket: any): void {
    const player = this.gameState.players.get(socket.id);
    if (!player) return;
    
    this.gameState.removePlayer(socket.id);
    this.broadcastMessage(`${player.name} left the game`);
    this.broadcastGameState();
  }
  public startGame(socket: any): void {
    const player = this.gameState.players.get(socket.id);
    if (!player || !player.isAdmin) {
      socket.emit('error', { message: 'Only admin can start the game' });
      return;
    }
    
    if (this.gameState.players.size < 2) {
      socket.emit('error', { message: 'Need at least 2 players to start' });
      return;
    }
    
    this.gameState.startGame();
    this.broadcastMessage('Game Started');
    this.broadcastGameState();
    this.startPlayerTurn();
  }

  public shakeDice(socket: any): void {
    const currentPlayer = this.gameState.getCurrentPlayer();
    if (!currentPlayer || currentPlayer.id !== socket.id) {
      socket.emit('error', { message: 'Not your turn' });
      return;
    }
    
    if (this.gameState.waitingForAnswer) {
      socket.emit('error', { message: 'Already shook dice, answer the question' });
      return;
    }
    
    const diceValue = this.gameState.rollDice();
    
    this.broadcastMessage(`${currentPlayer.name} shaking dice`);
    
    // Simulate dice animation delay
    setTimeout(() => {
      this.broadcastMessage(`${currentPlayer.name} got ${diceValue}`);
      this.presentQuestion();
    }, 1000);
  }

  public async answerQuestion(socket: any, answer: string): Promise<void> {
    const currentPlayer = this.gameState.getCurrentPlayer();
    if (!currentPlayer || currentPlayer.id !== socket.id) {
      socket.emit('error', { message: 'Not your turn' });
      return;
    }
    
    if (!this.gameState.waitingForAnswer || !this.gameState.currentQuestion) {
      socket.emit('error', { message: 'No question to answer' });
      return;
    }
    
    const isCorrect = answer === this.gameState.currentQuestion.correctAnswer;
    
    if (isCorrect) {
      this.broadcastMessage(`${currentPlayer.name} answered correctly`);
      this.movePlayerWithAnimation(currentPlayer, this.gameState.diceValue);
    } else {
      this.broadcastMessage(`${currentPlayer.name} answered wrong`);
      this.broadcastMessage(`${currentPlayer.name} stay`);
      
      setTimeout(() => {
        this.nextTurn();
      }, 2000);
    }
  }
  private async presentQuestion(): Promise<void> {
    try {
      const questions = await this.questionService.getAllQuestions();
      if (questions.length === 0) return;
        const randomQuestion = questions[Math.floor(Math.random() * questions.length)] as any;
      
      const question = {
        id: randomQuestion.id,
        question: randomQuestion.text || randomQuestion.question_text || randomQuestion.content || 'Question text missing',
        options: randomQuestion.options || randomQuestion.choices || [],
        correctAnswer: randomQuestion.correct_answer || randomQuestion.answer || ''
      };
      
      this.gameState.setQuestion(question);
      
      this.broadcastMessage(`${this.gameState.getCurrentPlayer()?.name} got question: ${question.question}`);
      this.broadcastGameState();
    } catch (error) {
      console.error('Error getting question:', error);
    }
  }

  private movePlayerWithAnimation(player: Player, steps: number): void {
    const path = this.gameState.movePlayer(player, steps);
    let stepIndex = 0;
    
    const animateStep = () => {
      if (stepIndex < path.length) {
        const position = path[stepIndex];
        this.broadcastMessage(`${player.name} step ${position}`);
        stepIndex++;
        
        setTimeout(animateStep, 500); // 500ms delay between steps
      } else {
        // Animation complete
        const finalPosition = player.position;
        this.broadcastMessage(`${player.name} stepped at ${finalPosition}`);
        
        // Check for ladder or snake
        if (this.gameState.ladders.has(finalPosition)) {
          this.broadcastMessage(`${player.name} climbing up ladder`);
          this.broadcastMessage(`${player.name} stepped at ${player.position}`);
        } else if (this.gameState.snakes.has(finalPosition)) {
          this.broadcastMessage(`${player.name} sliding down snake`);
          this.broadcastMessage(`${player.name} stepped at ${player.position}`);
        }
        
        // Check for winner
        if (this.gameState.checkWinner(player)) {
          this.broadcastMessage(`${player.name} reached finish`);
          this.broadcastMessage(`${player.name} wins the game!`);
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
    
    this.broadcastMessage(`${currentPlayer.name} turn`);
    this.broadcastGameState();
  }

  private nextTurn(): void {
    this.gameState.nextTurn();
    this.startPlayerTurn();
  }

  private broadcastMessage(message: string): void {
    this.io.to('game-room').emit('game-message', {
      message,
      timestamp: new Date().toISOString()
    });
  }

  private broadcastGameState(): void {
    this.io.to('game-room').emit('game-state-update', this.gameState.getGameStateForClient());
  }
}