export class Player {
  public id: string;
  public name: string;
  public position: number;
  public isAdmin: boolean;

  constructor(socketId: string, name: string, isAdmin: boolean = false) {
    this.id = socketId;
    this.name = name;
    this.position = 0;
    this.isAdmin = isAdmin;
  }

  public moveToPosition(newPosition: number): void {
    this.position = newPosition;
  }

  public hasWon(): boolean {
    return this.position >= 100;
  }
}