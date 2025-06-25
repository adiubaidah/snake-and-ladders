export class Player {
  public id: string;
  public name: string;
  public position: number;
  public color: string;

  constructor(socketId: string, name: string) {
    this.id = socketId;
    this.name = name;
    this.position = 0;
    this.color = this.generateRandomColor();

  }

  public moveToPosition(newPosition: number): void {
    this.position = newPosition;
  }

  public hasWon(): boolean {
    return this.position >= 100;
  }

  private generateRandomColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  public getInfo(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      position: this.position,
      color: this.color
    };
  }
}