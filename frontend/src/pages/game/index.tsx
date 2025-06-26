import { useEffect, useState, useContext, useRef } from "react";
import gsap from "gsap"
import { SocketContext } from "@/provider/socket";

import { type Player } from "@/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import GameAreaComponent, {type GameAreaRef} from "@/components/game/area";
import Leaderboard from "@/components/game/leaderboard";
import GameControls from "@/components/game/game-controls";
import useGameArea from "@/hooks/use-game-area";
import usePlayers from "@/hooks/user-players";
import JoinGame from "./join-game";
import useCurrentPlayer from "@/hooks/use-current-player";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function Index() {
  const { player: currentPlayer } = useCurrentPlayer();
  const [isQuestionOpen, setIsQuestionOpen] = useState(false);
  const [gameMessages, setGameMessages] = useState<
    Array<{ type: string; player: Player; timestamp: string }>
  >([]);
  const [currentQuestion, setCurrentQuestion] = useState<{
    id: string;
    text: string;
    answers: string[];
  } | null>(null);
  const [currentTurnPlayer, setCurrentTurnPlayer] = useState<Player | null>(
    null
  );
  const [isDiceShaking, setIsDiceShaking] = useState(false);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [canRollDice, setCanRollDice] = useState(false);
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
    console.log("Handling player stepping:", data);
    
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
          ease: "power2.out"
        });
      }
    });
    
     animations.current.set(data.player.id, tl);
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
            case "TURN_STARTED":
              setCurrentTurnPlayer(data.player);
              setIsDiceShaking(false);
              setDiceValue(null);
              setCanRollDice(false);
              refetchPlayers();
              break;

            case "YOUR_TURN":
              setTimeout(() => {
                setCanRollDice(true);
              }, 100);
              break;

            case "DICE_SHAKING":
              setIsDiceShaking(true);
              setDiceValue(null);
              setCanRollDice(false);
              break;

            case "DICE_ROLLED":
              setIsDiceShaking(false);
              setDiceValue(data.diceValue || null);
              break;

            case "QUESTION_PRESENTED":
              if (data.question) {
                setCurrentQuestion(data.question);
                // Only show alert dialog for current player
                if (data.player.id === currentPlayer?.id) {
                  setIsQuestionOpen(true);
                }
              }
              break;
            case "ANSWER_VALIDATED":
              setIsQuestionOpen(false);
              setCurrentQuestion(null);
              break;
            case "PLAYER_STEPPING":
               console.log("Player stepping received:", data);
              if (data.currentPosition !== undefined) {
                handlePlayerStepping({
                  player: data.player,
                  currentPosition: data.currentPosition
                });
              }
              break;
            case "PLAYER_MOVED":
              refetchPlayers();
              break;
            case "PLAYER_STAYS":
              setTimeout(() => {
                setIsDiceShaking(false);
                setDiceValue(null);
                setCanRollDice(false);
              }, 2000);
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
  }, [isConnected, socket, currentPlayer, refetchPlayers]);

  const handleAnswerQuestion = (answer: string) => {
    if (isConnected && socket && currentQuestion) {
      socket.emit("answer-question", { answer });
      setIsQuestionOpen(false);
      setCurrentQuestion(null);
    }
  };

  const handleRollDice = () => {
    if (!socket || !isConnected || !canRollDice) return;

    socket.emit("shake-dice");
  };

  return (
    <div>
      <JoinGame />

      <AlertDialog open={isQuestionOpen} onOpenChange={setIsQuestionOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Answer the Question</AlertDialogTitle>
          </AlertDialogHeader>
          {currentQuestion && (
            <div className="space-y-4">
              <AlertDialogDescription className="text-sm">{currentQuestion.text}</AlertDialogDescription>
              <div className="space-y-2">
                {currentQuestion.answers.map((answer, index) => (
                  <button
                    key={index}
                    className="w-full p-2 bg-gray-100 rounded hover:bg-gray-200"
                    onClick={() => handleAnswerQuestion(answer)}
                  >
                    {answer}
                  </button>
                ))}
              </div>
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>

      {currentQuestion && currentTurnPlayer?.id !== currentPlayer?.id && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Question for {currentTurnPlayer?.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">{currentQuestion.text}</p>
              <div className="space-y-2">
                {currentQuestion.answers.map((answer, index) => (
                  <div key={index} className="p-2 bg-gray-100 rounded text-sm">
                    {answer}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Waiting for {currentTurnPlayer?.name} to answer...
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {gameBoard && !isLoading && (
        <div className="flex gap-6 p-6">
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
            <GameControls
              whoIsCurrentPlayer={currentTurnPlayer || undefined}
              isCurrentPlayerTurn={currentTurnPlayer?.id === currentPlayer?.id}
              isDiceShaking={isDiceShaking}
              diceValue={diceValue}
              canRollDice={canRollDice}
              onRollDice={handleRollDice}
            />
            <Leaderboard messages={gameMessages} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Index;
