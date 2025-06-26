import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import Snake from './snake';
import Ladder from './ladder';
import type { Coordinates, GameArea, Player as PlayerType } from '@/schema';
import { useContext } from 'react';
import { SocketContext } from '@/provider/socket';

const GameAreaComponent: React.FC<GameArea> = ({ board, elements, players, boardNumbers }) => {
  const cellSize = 60;
  const boardWidth = board.grid.columns * cellSize;
  const boardHeight = board.grid.rows * cellSize;
  
  // Create refs for player animations
  const playerRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const { socket, isConnected } = useContext(SocketContext);
  
  const [animations, setAnimations] = useState<Map<string, gsap.core.Timeline>>(new Map());

  const getPixelCoordinates = (coords: Coordinates) => ({
    x: coords.col * cellSize + cellSize / 2,
    y: coords.row * cellSize + cellSize / 2
  });
  useEffect(() => {
    if (!isConnected || !socket) {
      console.error("Socket is not connected game Area" );
      return;
    }
    
    const handleGameMessage = (data: any) => {
      console.log("Game message received:", data);
      if (data.type === "PLAYER_STEPPING") {
        console.log("Player stepping received:", data);
        
        const playerRef = playerRefs.current.get(data.player.id);
        if (!playerRef) {
          console.warn(`No ref found for player ${data.player.id}`);
          return;
        }
        
        // Get coordinates for the current position from boardNumbers
        const positionKey = data.currentPosition;
        const coords = boardNumbers[positionKey];
        
        if (!coords) {
          console.warn(`No coordinates found for position ${positionKey}`);
          return;
        }
        
        // Calculate pixel position for animation
        const targetX = coords.col * cellSize + 5; // 5px offset for styling
        const targetY = coords.row * cellSize + 5;
        
        // Kill any existing animation for this player
        if (animations.get(data.player.id)) {
          animations.get(data.player.id)?.kill();
        }
        
        // Create new animation
        const tl = gsap.timeline();
        tl.to(playerRef, {
          left: targetX,
          top: targetY,
          duration: 0.3,
          ease: "power2.out",
          onComplete: () => {
            // Add a small bounce effect
            gsap.to(playerRef, {
              y: -5,
              duration: 0.1,
              repeat: 1,
              yoyo: true
            });
          }
        });
        
        // Save the timeline for potential future control
        setAnimations(prev => {
          const newMap = new Map(prev);
          newMap.set(data.player.id, tl);
          return newMap;
        });
      }
    };
  
    socket.on("game-message", handleGameMessage);
      return () => {
      if (socket) {
        socket.off("game-message");
      }
    };
    
  }, [socket, isConnected, boardNumbers, animations]);

  const renderBoardCells = () => {
    // Existing renderBoardCells implementation
    const cells = [];
    for (let row = 0; row < board.grid.rows; row++) {
      for (let col = 0; col < board.grid.columns; col++) {
        const number = Object.entries(boardNumbers).find(
          ([, coords]) => coords.row === row && coords.col === col
        )?.[0];

        cells.push(
          <div
            key={`${row}-${col}`}
            className="absolute border border-gray-300 flex items-center justify-center bg-white text-sm font-semibold"
            style={{
              left: col * cellSize,
              top: row * cellSize,
              width: cellSize,
              height: cellSize,
            }}
          >
            {number}
          </div>
        );
      }
    }
    return cells;
  };

  const renderPlayers = () => {
    return players.map((player) => (
      <div
        key={player.id}
        ref={(el) => {
          if (el) playerRefs.current.set(player.id, el);
        }}
        className={`absolute rounded-full flex items-center justify-center text-white text-xs font-bold border-2 ${
          player.isCurrentPlayer ? 'border-yellow-400 shadow-lg' : 'border-white'
        }`}
        style={{
          left: player.coordinates.col * cellSize + 5,
          top: player.coordinates.row * cellSize + 5,
          width: cellSize - 10,
          height: cellSize - 10,
          backgroundColor: player.color,
          zIndex: 100,
          transition: 'none', // Disable default transitions as GSAP will handle them
        }}
        title={`${player.name} (Position: ${player.position})`}
      >
        {player.name.charAt(0).toUpperCase()}
      </div>
    ));
  };

  // Rest of the component remains the same
  return (
    <div className="relative bg-gray-50 rounded-lg shadow-lg p-4">
      <div
        className="relative mx-auto border-2 border-gray-400"
        style={{
          width: boardWidth,
          height: boardHeight,
        }}
      >
        {/* Board cells with numbers */}
        {renderBoardCells()}

        {/* SVG overlay for snakes and ladders */}
        <svg
          className="absolute top-0 left-0 pointer-events-none"
          width={boardWidth}
          height={boardHeight}
          style={{ zIndex: 50 }}
        >
          {/* Render ladders first (behind snakes) */}
          {elements.ladders.map((ladder) => (
            <Ladder
              key={ladder.id}
              ladder={ladder}
              getPixelCoordinates={getPixelCoordinates}
              cellSize={cellSize}
            />
          ))}

          {/* Render snakes */}
          {elements.snakes.map((snake) => (
            <Snake
              key={snake.id}
              snake={snake}
              getPixelCoordinates={getPixelCoordinates}
              cellSize={cellSize}
            />
          ))}
        </svg>

        {renderPlayers()}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-400 rounded"></div>
          <span>Snakes</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-400 rounded"></div>
          <span>Ladders</span>
        </div>
        {players.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-400 rounded border-2 border-yellow-600"></div>
            <span>Current Player</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameAreaComponent;