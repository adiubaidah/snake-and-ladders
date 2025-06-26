import { Player } from './Player';
import { Question } from 'models/Question';

export enum GameStatus {
  WAITING = 'waiting',
  IN_PROGRESS = 'in_progress',
  FINISHED = 'finished'
}

export class GameState {
  public players: Map<string, Player> = new Map();
  public status: GameStatus = GameStatus.WAITING;
  public currentPlayerIndex: number = 0;
  public currentQuestion: Question | null = null;
  public waitingForAnswer: boolean = false;
  public diceValue: number = 0;
  public turnOrder: string[] = [];
  public winner: Player | null = null;
  public adminId: string | null = null;
  
  public ladders: Map<number, number> = new Map([
    [4, 14], [9, 31], [7, 17], [20, 38], [28, 84], [40, 59], [51, 67], [63, 81], [71, 91]
  ]);
  
  public snakes: Map<number, number> = new Map([
  [64, 60], [62, 19], [56, 53], [49, 11], [48, 26], [16, 6]
  ]);

  public addPlayer(player: Player): void {
    this.players.set(player.id, player);
  }

  public removePlayer(playerId: string): void {
    this.players.delete(playerId);
    this.turnOrder = this.turnOrder.filter(id => id !== playerId);
    if (this.turnOrder.length === 0) {
      this.status = GameStatus.WAITING;
    }
  }

  public setAdmin(playerId: string): void {
    this.adminId = playerId;
  }

  public isAdmin(playerId: string): boolean {
    return this.adminId === playerId;
  }

  public startGame(): void {
    if (this.players.size < 2) return;
    
    this.status = GameStatus.IN_PROGRESS;
    this.turnOrder = Array.from(this.players.keys());
    this.shuffleArray(this.turnOrder);
    this.currentPlayerIndex = 0;
  }

  public getCurrentPlayer(): Player | null {
    if (this.turnOrder.length === 0) return null;
    const currentPlayerId = this.turnOrder[this.currentPlayerIndex];
    return this.players.get(currentPlayerId) || null;
  }

  public nextTurn(): void {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.turnOrder.length;
    this.waitingForAnswer = false;
    this.currentQuestion = null;
    this.diceValue = 0;
  }

  public setQuestion(question: Question): void {
    this.currentQuestion = question;
    this.waitingForAnswer = true;
  }

  public rollDice(): number {
    this.diceValue = Math.floor(Math.random() * 6) + 1;
    return this.diceValue;
  }

  public movePlayer(player: Player, steps: number): number[] {
    const path: number[] = [];
    let currentPos = player.position;
    
    // Move step by step
    for (let i = 0; i < steps; i++) {
      currentPos++;
      path.push(currentPos);
    }
    
    // Check for snake or ladder
    if (this.ladders.has(currentPos)) {
      const ladderTop = this.ladders.get(currentPos)!;
      path.push(ladderTop);
      currentPos = ladderTop;
    } else if (this.snakes.has(currentPos)) {
      const snakeBottom = this.snakes.get(currentPos)!;
      path.push(snakeBottom);
      currentPos = snakeBottom;
    }
    
    player.moveToPosition(currentPos);
    return path;
  }

  public checkWinner(player: Player): boolean {
    if (player.hasWon()) {
      this.winner = player;
      this.status = GameStatus.FINISHED;
      return true;
    }
    return false;
  }

  private shuffleArray(array: string[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  public getGameStateForClient() {
    return {
      status: this.status,
      players: Array.from(this.players.values()).map(p => ({
        id: p.id,
        name: p.name,
        position: p.position,
      })),
      currentPlayer: this.getCurrentPlayer()?.name || null,
      currentQuestion: this.currentQuestion,
      waitingForAnswer: this.waitingForAnswer,
      diceValue: this.diceValue,
      winner: this.winner?.name || null,
      hasAdmin: this.adminId !== null
    };
  }
}