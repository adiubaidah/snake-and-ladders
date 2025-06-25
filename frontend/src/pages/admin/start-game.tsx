import { Button } from "@/components/ui/button";
import { socket } from "@/lib/utils";

function StartGame() {
  const handleStartGame = () => {
    socket.emit("start-game");
  };
  return (
    <div>
      <h1 className="text-3xl font-bold">Start Game</h1>
      <Button className="mt-4" onClick={handleStartGame}>
        Start
      </Button>
    </div>
  );
}

export default StartGame;
