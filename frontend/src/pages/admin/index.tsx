import { useEffect, useState, useContext, useRef } from "react";
import gsap from "gsap";
import { SocketContext } from "@/provider/socket";

import { type Player } from "@/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import GameAreaComponent, { type GameAreaRef } from "@/components/game/area";
import Leaderboard from "@/components/game/leaderboard";
import useGameArea from "@/hooks/use-game-area";
import usePlayers from "@/hooks/user-players";
import StartGame from "./start-game";

function Index() {
  const [gameMessages, setGameMessages] = useState<
    Array<{ type: string; player: Player; timestamp: string }>
  >([]);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<{
    id: string;
    text: string;
    answers: string[];
  } | null>(null);
  const [currentTurnPlayer, setCurrentTurnPlayer] = useState<Player | null>(
    null
  );
  const { data: gameBoard, isLoading } = useGameArea();
  const { isConnected, socket } = useContext(SocketContext);
  const gameAreaRef = useRef<GameAreaRef>(null);
  const animations = useRef<Map<string, gsap.core.Timeline>>(new Map());

  const { refetchPlayers, players } = usePlayers({
    refetchOnWindowFocus: false,
  });

  const handlePlayerStepping = (data: {
    player: Player;
    currentPosition: number;
  }) => {
    if (!gameAreaRef.current || !gameBoard) return;

    const playerRef = gameAreaRef.current.getPlayerRef(data.player.id);
    if (!playerRef) {
      console.warn(`No ref found for player ${data.player.id}`);
      return;
    }

    const cellSize = gameAreaRef.current.getCellSize();
    const coords = gameBoard.boardNumbers[data.currentPosition];

    if (!coords) {
      console.warn(`No coordinates found for position ${data.currentPosition}`);
      return;
    }

    // Calculate target position for animation
    const targetX = coords.col * cellSize + 5; // 5px offset for styling
    const targetY = coords.row * cellSize + 5;

    if (animations.current.get(data.player.id)) {
      animations.current.get(data.player.id)?.kill();
    }

    // Create a new GSAP timeline for this player
    const tl = gsap.timeline();

    // Animate the player to the new position
    tl.to(playerRef, {
      left: targetX,
      top: targetY,
      duration: 0.3,
      ease: "power2.out",
      onComplete: () => {
        // Add a bounce effect at the end of each step
        gsap.to(playerRef, {
          y: -10,
          duration: 0.15,
          repeat: 1,
          yoyo: true,
          ease: "power2.out",
        });
      },
    });

    animations.current.set(data.player.id, tl);
  };

  const handleRestartGame = () => {
    if (isConnected && socket) {
      socket.emit("restart-game");
      setIsGameStarted(false);
      setGameMessages([]);
      setCurrentQuestion(null);
      setCurrentTurnPlayer(null);

      // Clear all animations
      animations.current.forEach((animation) => animation.kill());
      animations.current.clear();
    }
  };

  useEffect(() => {
    if (isConnected && socket) {
      const eventsRequiringRefresh = [
        "PLAYER_MOVED",
        "SNAKE_SLID",
        "LADDER_CLIMBED",
        "PLAYER_JOINED",
        "PLAYER_LEFT",
        "GAME_STARTED",
        "GAME_RESTARTED",
      ];

      socket.on(
        "game-message",
        (data: {
          type: string;
          player: Player;
          timestamp: string;
          question?: { id: string; text: string; answers: string[] };
          currentPosition?: number;
          message?: string;
          diceValue?: number;
          isCorrect?: boolean;
          selectedAnswer?: string;
          correctAnswer?: string;
        }) => {
          // Add all messages to the leaderboard
          setGameMessages((prev) => [...prev, data]);

          // Handle specific game events
          switch (data.type) {
            case "GAME_STARTED":
              setIsGameStarted(true);
              break;
            case "GAME_RESTARTED":
              setIsGameStarted(false);
              setGameMessages([]);
              setCurrentQuestion(null);
              setCurrentTurnPlayer(null);
              break;
            case "TURN_STARTED":
              setCurrentTurnPlayer(data.player);
              refetchPlayers();
              break;

            case "QUESTION_PRESENTED":
              if (data.question) {
                setCurrentQuestion(data.question);
              }
              break;
            case "ANSWER_VALIDATED":
              setCurrentQuestion(null);
              break;
            case "PLAYER_STEPPING":
              if (data.currentPosition !== undefined) {
                handlePlayerStepping({
                  player: data.player,
                  currentPosition: data.currentPosition,
                });
              }
              break;
            case "PLAYER_MOVED":
              refetchPlayers();
              break;
          }
          if (eventsRequiringRefresh.includes(data.type)) {
            setTimeout(() => {
              refetchPlayers();
            }, 500);
          }
        }
      );
    }

    return () => {
      if (socket) {
        socket.off("joined-game");
        socket.off("game-message");
      }
    };
  }, [isConnected, socket, refetchPlayers]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>

          {isGameStarted && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="lg"
                  className="bg-red-600 hover:bg-red-700"
                >
                  Restart Game
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Restart Game</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to restart the game? This will disconnect
                    all players and reset the game state. Players will need to rejoin.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleRestartGame}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Restart Game
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {!isGameStarted && (
          <div className="mb-8">
            <StartGame setIsGameStarted={setIsGameStarted} />
          </div>
        )}

        {/* Game status indicator */}
        {isGameStarted && (
          <div className="mb-6">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-700 font-medium">
                    Game is running with {players.length} players
                  </span>
                  {currentTurnPlayer && (
                    <span className="text-green-600">
                      • Current turn: {currentTurnPlayer.name}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentQuestion && (
          <div className="fixed top-4 right-4 z-50 max-w-md">
            <Card className="shadow-xl border-0 bg-white">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
                <CardTitle className="text-lg">
                  Question for {currentTurnPlayer?.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-sm mb-4 font-medium">
                  {currentQuestion.text}
                </p>
                <div className="space-y-2">
                  {currentQuestion.answers.map((answer, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 rounded-lg text-sm border"
                    >
                      <span className="font-medium text-gray-700">
                        {String.fromCharCode(65 + index)}.
                      </span>{" "}
                      {answer}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-2 text-orange-600">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <p className="text-xs font-medium">
                    Waiting for {currentTurnPlayer?.name} to answer...
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {gameBoard && !isLoading && isGameStarted && (
          <div className="flex gap-6">
            <div className="flex flex-col gap-6">
              <GameAreaComponent
                ref={gameAreaRef}
                board={gameBoard.board}
                elements={gameBoard.elements}
                players={players}
                boardNumbers={gameBoard.boardNumbers}
              />
            </div>
            <div className="flex flex-col gap-6">
              <Leaderboard messages={gameMessages} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Index;
