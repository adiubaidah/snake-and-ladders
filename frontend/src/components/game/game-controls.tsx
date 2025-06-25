import React, { useState, useEffect, useContext } from 'react';
import { SocketContext } from '@/provider/socket';
import { Button } from '@/components/ui/button';
import Dice from './dice';
import type { Player } from '@/schema';

interface GameControlsProps {
  currentPlayer?: Player;
  isCurrentPlayerTurn: boolean;
}

const GameControls: React.FC<GameControlsProps> = ({ currentPlayer, isCurrentPlayerTurn }) => {
  const [isDiceShaking, setIsDiceShaking] = useState(false);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [canRollDice, setCanRollDice] = useState(true);
  const { socket, isConnected } = useContext(SocketContext);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleGameMessage = (data: {type: string, diceValue?: number, player?: Player}) => {
      switch (data.type) {
        case 'DICE_SHAKING':
          setIsDiceShaking(true);
          setDiceValue(null);
          setCanRollDice(false);
          break;
          
        case 'DICE_ROLLED':
          setIsDiceShaking(false);
          setDiceValue(data.diceValue as number);
          break;
          
        case 'TURN_STARTED':
          // Reset dice state for new turn
          setIsDiceShaking(false);
          setDiceValue(null);
          setCanRollDice(true);
          break;
          
        case 'ANSWER_VALIDATED':
        case 'PLAYER_MOVED':
        case 'PLAYER_STAYS':
          // Reset for next turn
          setTimeout(() => {
            setIsDiceShaking(false);
            setDiceValue(null);
            setCanRollDice(true);
          }, 2000);
          break;
      }
    };

    socket.on('game-message', handleGameMessage);

    return () => {
      socket.off('game-message', handleGameMessage);
    };
  }, [socket, isConnected]);

  const handleRollDice = () => {
    if (!socket || !isConnected || !canRollDice || !isCurrentPlayerTurn) return;
    
    socket.emit('shake-dice');
  };

  const handleDiceAnimationComplete = () => {
    // Dice animation is complete, ready for next action
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 min-w-64">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Game Controls</h3>
      
      {currentPlayer && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: currentPlayer.color }}
            >
              {currentPlayer.name.charAt(0).toUpperCase()}
            </div>
            <span className="font-medium">{currentPlayer.name}'s Turn</span>
          </div>
          <p className="text-sm text-gray-600">
            Position: {currentPlayer.position}
          </p>
        </div>
      )}

      <div className="flex flex-col items-center gap-4">
        <Dice 
          isShaking={isDiceShaking}
          value={diceValue}
          onAnimationComplete={handleDiceAnimationComplete}
        />
        
        <Button
          onClick={handleRollDice}
          disabled={!isCurrentPlayerTurn || !canRollDice || isDiceShaking}
          className="w-full"
          variant={isCurrentPlayerTurn && canRollDice ? "default" : "secondary"}
        >
          {isDiceShaking ? "Rolling..." : "Roll Dice"}
        </Button>
        
        {!isCurrentPlayerTurn && (
          <p className="text-sm text-gray-500 text-center">
            Wait for your turn
          </p>
        )}
        
        {isCurrentPlayerTurn && !canRollDice && diceValue && (
          <p className="text-sm text-blue-600 text-center">
            Answer the question to move!
          </p>
        )}
      </div>
    </div>
  );
};

export default GameControls;