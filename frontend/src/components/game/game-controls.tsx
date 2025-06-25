import React from 'react';
import { Button } from '@/components/ui/button';
import Dice from './dice';
import type { Player } from '@/schema';

interface GameControlsProps {
  whoIsCurrentPlayer?: Player;
  isCurrentPlayerTurn: boolean;
  isDiceShaking: boolean;
  diceValue: number | null;
  canRollDice: boolean;
  onRollDice: () => void;
}

const GameControls: React.FC<GameControlsProps> = ({ 
  whoIsCurrentPlayer, 
  isCurrentPlayerTurn, 
  isDiceShaking, 
  diceValue, 
  canRollDice, 
  onRollDice 
}) => {
  const handleDiceAnimationComplete = () => {
    // Dice animation is complete, ready for next action
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 min-w-64">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Game Controls</h3>
      
      {whoIsCurrentPlayer && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: whoIsCurrentPlayer.color }}
            >
              {whoIsCurrentPlayer.name.charAt(0).toUpperCase()}
            </div>
            <span className="font-medium">{whoIsCurrentPlayer.name}'s Turn</span>
          </div>
          <p className="text-sm text-gray-600">
            Position: {whoIsCurrentPlayer.position}
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
          onClick={onRollDice}
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