import { useContext, useEffect } from "react";
import { SocketContext } from "@/provider/socket";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type Player, type PlayerName, playerNameSchema } from "@/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useState } from "react";
import useCurrentPlayer from "@/hooks/use-current-player";
function JoinGame() {
  const { isConnected, socket } = useContext(SocketContext);
  const { setPlayer } = useCurrentPlayer();

  const [isJoined, setIsJoined] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<PlayerName>({
    resolver: zodResolver(playerNameSchema),
    defaultValues: {
      playerName: "",
    },
  });

  useEffect(() => {
    if (!isConnected || !socket) {
      console.error("Socket is not connected");
      return;
    }

    if (!isJoined) {
      setIsOpen(true);
      setIsJoined(true);
    }

    socket.on("joined-game", (data: Player) => {
      setIsOpen(false);
      setPlayer(data);
      console.log(`Player ${data.name} has joined the game.`);
    });

    return () => {
      socket.off("joined-game");
      setIsJoined(false);
      setIsOpen(false);
    };
  }, [isConnected, socket, isJoined]);

  const onSubmit = (data: PlayerName) => {
    if (isConnected) {
      socket.emit("join-game", { playerName: data.playerName });
    } else {
      console.error("Socket is not connected");
    }
  };
  return (
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
  );
}

export default JoinGame;
