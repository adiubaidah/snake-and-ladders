import { useEffect, useState, useContext } from "react";
import { SocketContext } from "@/provider/socket";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { playerNameSchema, type Player, type PlayerName } from "@/schema";
import { Button } from "@/components/ui/button";
import GameAreaComponent from "@/components/game/area";
import Leaderboard from "@/components/game/leaderboard";
import GameControls from "@/components/game/game-controls";
import useGameArea from "@/hooks/use-game-area";

function Index() {
   const [isOpen, setIsOpen] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>('');
  const [gameMessages, setGameMessages] = useState<Array<{type: string, player: Player, timestamp: string}>>([]);
  const { data: gameBoard, isLoading } = useGameArea();
  const { isConnected, socket } = useContext(SocketContext);

  const form = useForm<PlayerName>({
    resolver: zodResolver(playerNameSchema),
    defaultValues: {
      playerName: "",
    },
  });

   useEffect(() => {
    setIsOpen(true);

    if (isConnected && socket) {
      socket.on("joined-game", (data: Player) => {
        setIsJoined(true);
        setIsOpen(false);
        setCurrentPlayerId(data.id);
        console.log(`Player ${data.name} has joined the game.`);
      });

      socket.on("game-message", (data: {type: string, player: Player, timestamp: string}) => {
        if (data.type === 'PLAYER_JOINED') {
          setGameMessages(prev => [...prev, data]);
        }
      });
    }

    return () => {
      if (socket) {
        socket.off("joined-game");
        socket.off("game-message");
      }
    };
  }, [isConnected, socket]);

    const onSubmit = (data: PlayerName) => {
    if (isConnected) {
      socket.emit("join-game", { playerName: data.playerName });
    } else {
      console.error("Socket is not connected");
    }
  };

  return (
    <div>
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Welcome to the Game!</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            Please enter your name to join the game.
          </AlertDialogDescription>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="playerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit">Join Game</Button>
            </form>
          </Form>
        </AlertDialogContent>
      </AlertDialog>

      {isJoined && gameBoard && !isLoading && (
        <div className="flex gap-6 p-6">
          <div className="flex flex-col gap-6">
            <GameAreaComponent
              board={gameBoard.board}
              elements={gameBoard.elements}
              players={gameBoard.players}
              boardNumbers={gameBoard.boardNumbers}
            />
          </div>
          <div className="flex flex-col gap-6">
            <GameControls 
              currentPlayer={gameBoard.players.find(p => p.isCurrentPlayer)}
              isCurrentPlayerTurn={gameBoard.players.some(p => p.isCurrentPlayer && p.id === currentPlayerId)}
            />
            <Leaderboard messages={gameMessages} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Index;
