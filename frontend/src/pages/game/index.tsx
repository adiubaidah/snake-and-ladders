import { useEffect, useState, useContext } from "react";
import { SocketContext } from "@/provider/socket";

import { type Player } from "@/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import GameAreaComponent from "@/components/game/area";
import Leaderboard from "@/components/game/leaderboard";
import GameControls from "@/components/game/game-controls";
import useGameArea from "@/hooks/use-game-area";
import JoinGame from "./join-game";
import useCurrentPlayer from "@/hooks/use-current-player";

function Index() {
  
  const {player: currentPlayer} = useCurrentPlayer()
  const [isQuestionOpen, setIsQuestionOpen] = useState(false);
  const [gameMessages, setGameMessages] = useState<Array<{type: string, player: Player, timestamp: string}>>([]);
  const [currentQuestion, setCurrentQuestion] = useState<{id: string, text: string, answers: string[]} | null>(null);
  const [currentTurnPlayer, setCurrentTurnPlayer] = useState<Player | null>(null);
  const [isDiceShaking, setIsDiceShaking] = useState(false);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [canRollDice, setCanRollDice] = useState(false);
  const { data: gameBoard, isLoading } = useGameArea();
  const { isConnected, socket } = useContext(SocketContext);


   useEffect(() => {
    if (isConnected && socket) {
      socket.on("game-message", (data: {type: string, player: Player, timestamp: string, question?: {id: string, text: string, answers: string[]}, currentPosition?: number, message?: string, diceValue?: number, isCorrect?: boolean, selectedAnswer?: string, correctAnswer?: string}) => {
        // Add all messages to the leaderboard
        setGameMessages(prev => [...prev, data]);

        // Handle specific game events
        switch (data.type) {
          case 'TURN_STARTED':
            setCurrentTurnPlayer(data.player);
            setIsDiceShaking(false);
            setDiceValue(null);
            setCanRollDice(false);
            break;
            
          case 'YOUR_TURN':
            setCurrentTurnPlayer(data.player);
            setCanRollDice(true);
            break;
            
          case 'DICE_SHAKING':
            setIsDiceShaking(true);
            setDiceValue(null);
            setCanRollDice(false);
            break;
            
          case 'DICE_ROLLED':
            setIsDiceShaking(false);
            setDiceValue(data.diceValue || null);
            break;
            
          case 'QUESTION_PRESENTED':
            if (data.question) {
              setCurrentQuestion(data.question);
              // Only show alert dialog for current player
              if (data.player.id === currentPlayer?.id) {
                setIsQuestionOpen(true);
              }
            }
            break;
            
          case 'ANSWER_VALIDATED':
            setIsQuestionOpen(false);
            setCurrentQuestion(null);
            break;
            
          case 'PLAYER_MOVED':
          case 'PLAYER_STAYS':
            // Reset dice state after movement
            setTimeout(() => {
              setIsDiceShaking(false);
              setDiceValue(null);
              setCanRollDice(false);
            }, 2000);
            break;
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



  // const handleAnswerQuestion = (answer: string) => {
  //   if (isConnected && socket && currentQuestion) {
  //     socket.emit("answer-question", { answer });
  //     setIsQuestionOpen(false);
  //     setCurrentQuestion(null);
  //   }
  // };

  const handleRollDice = () => {
    if (!socket || !isConnected || !canRollDice) return;
    
    socket.emit('shake-dice');
  };

  return (
    <div>

      <JoinGame />
      {currentQuestion&& (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Question for {currentTurnPlayer?.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">{currentQuestion.text}</p>
              <div className="space-y-2">
                {currentQuestion.answers.map((answer, index) => (
                  <div
                    key={index}
                    className="p-2 bg-gray-100 rounded text-sm"
                  >
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
              board={gameBoard.board}
              elements={gameBoard.elements}
              players={gameBoard.players}
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
