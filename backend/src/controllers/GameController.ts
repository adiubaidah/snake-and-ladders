import { Request, Response } from "express";
import { GameManager } from "../game/GameManager";

export class GameController {
  private gameManager: GameManager;

  constructor(gameManager: GameManager) {
    this.gameManager = gameManager;
  }

  public getGameBoard = (req: Request, res: Response): void => {
    try {
      const boardData = {
        boardSize: 100,
        grid: {
          rows: 10,
          columns: 10
        },
        snakes: Array.from(this.gameManager['gameState'].snakes.entries()).map(([head, tail]) => ({
          id: `snake_${head}`,
          head: head,
          tail: tail,
          color: this.getSnakeColor(head)
        })),
        ladders: Array.from(this.gameManager['gameState'].ladders.entries()).map(([bottom, top]) => ({
          id: `ladder_${bottom}`,
          bottom: bottom,
          top: top,
          color: this.getLadderColor(bottom)
        })),
        specialSquares: this.getSpecialSquares(),
        boardLayout: this.generateBoardLayout()
      };

      res.status(200).json(boardData);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  public getGamePlot = (req: Request, res: Response): void => {
    try {
      const gameState = this.gameManager['gameState'].getGameStateForClient();
      
      const plotData = {
        board: {
          size: 100,
          grid: { rows: 10, columns: 10 }
        },
        elements: {
          snakes: Array.from(this.gameManager['gameState'].snakes.entries()).map(([head, tail]) => ({
            type: "snake",
            id: `snake_${head}`,
            head: head,
            tail: tail,
            coordinates: this.getCoordinates(head, tail),
            color: this.getSnakeColor(head),
            description: `Snake from ${head} to ${tail}`
          })),
          ladders: Array.from(this.gameManager['gameState'].ladders.entries()).map(([bottom, top]) => ({
            type: "ladder",
            id: `ladder_${bottom}`,
            bottom: bottom,
            top: top,
            coordinates: this.getCoordinates(bottom, top),
            color: this.getLadderColor(bottom),
            description: `Ladder from ${bottom} to ${top}`
          }))
        },
        players: gameState.players.map(player => ({
          id: player.id,
          name: player.name,
          position: player.position,
          coordinates: this.getSquareCoordinates(player.position),
          isCurrentPlayer: player.name === gameState.currentPlayer,
        })),
        gameInfo: {
          status: gameState.status,
          currentPlayer: gameState.currentPlayer,
          diceValue: gameState.diceValue,
          waitingForAnswer: gameState.waitingForAnswer,
          winner: gameState.winner,
          totalPlayers: gameState.players.length
        },
        boardNumbers: this.generateBoardNumbers()
      };

      res.status(200).json(plotData);
    } catch (error) {
      res.status(500).json({error: error instanceof Error ? error.message : "Unknown error"});
    }
  };

  private generateBoardLayout(): number[][] {
    const board: number[][] = [];
    let num = 100;
    
    for (let row = 0; row < 10; row++) {
      const currentRow: number[] = [];
      
      if (row % 2 === 0) {
        // Even rows: left to right (100-91, 80-71, etc.)
        for (let col = 0; col < 10; col++) {
          currentRow.push(num--);
        }
      } else {
        // Odd rows: right to left (90-81, 70-61, etc.)
        for (let col = 9; col >= 0; col--) {
          currentRow[col] = num--;
        }
      }
      
      board.push(currentRow);
    }
    
    return board;
  }

  private generateBoardNumbers(): { [key: number]: { row: number, col: number } } {
    const positions: { [key: number]: { row: number, col: number } } = {};
    let num = 100;
    
    for (let row = 0; row < 10; row++) {
      if (row % 2 === 0) {
        for (let col = 0; col < 10; col++) {
          positions[num] = { row, col };
          num--;
        }
      } else {
        for (let col = 9; col >= 0; col--) {
          positions[num] = { row, col };
          num--;
        }
      }
    }
    
    return positions;
  }

  private getCoordinates(from: number, to: number): { from: { row: number, col: number }, to: { row: number, col: number } } {
    return {
      from: this.getSquareCoordinates(from),
      to: this.getSquareCoordinates(to)
    };
  }

  private getSquareCoordinates(square: number): { row: number, col: number } {
    if (square < 1 || square > 100) return { row: -1, col: -1 };
    
    const adjustedSquare = square - 1;
    const row = 9 - Math.floor(adjustedSquare / 10);
    let col: number;
    
    if ((9 - row) % 2 === 0) {
      col = adjustedSquare % 10;
    } else {
      col = 9 - (adjustedSquare % 10);
    }
    
    return { row, col };
  }

  private getSnakeColor(head: number): string {
    const colors = ["#FF4444", "#FF6B6B", "#FF8E8E", "#FFB1B1"];
    return colors[head % colors.length];
  }

  private getLadderColor(bottom: number): string {
    const colors = ["#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"];
    return colors[bottom % colors.length];
  }


  private getSpecialSquares(): Array<{ position: number, type: string, description: string }> {
    const special = [];
    
    // Add snake heads
    for (const [head] of this.gameManager['gameState'].snakes) {
      special.push({
        position: head,
        type: "snake_head",
        description: `Snake head at ${head}`
      });
    }
    
    // Add ladder bottoms
    for (const [bottom] of this.gameManager['gameState'].ladders) {
      special.push({
        position: bottom,
        type: "ladder_bottom",
        description: `Ladder bottom at ${bottom}`
      });
    }
    
    return special;
  }
}