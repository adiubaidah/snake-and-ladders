import React from 'react';

interface Coordinates {
  row: number;
  col: number;
}

interface SnakeData {
  type: "snake";
  id: string;
  head: number;
  tail: number;
  coordinates: {
    from: Coordinates;
    to: Coordinates;
  };
  color: string;
  description: string;
}

interface SnakeProps {
  snake: SnakeData;
  getPixelCoordinates: (coords: Coordinates) => { x: number; y: number };
  cellSize: number;
}

const Snake: React.FC<SnakeProps> = ({ snake, getPixelCoordinates, cellSize }) => {
  const fromPixel = getPixelCoordinates(snake.coordinates.from);
  const toPixel = getPixelCoordinates(snake.coordinates.to);

  // Calculate the distance between points
  const dx = toPixel.x - fromPixel.x;
  const dy = toPixel.y - fromPixel.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  // Create curved path for snake body
  const midX = (fromPixel.x + toPixel.x) / 2;
  const midY = (fromPixel.y + toPixel.y) / 2;
  
  // Add some curve to make it look more snake-like
  const curveOffset = Math.min(cellSize * 0.8, length * 0.3);
  const perpX = -dy / length * curveOffset;
  const perpY = dx / length * curveOffset;
  
  const controlX = midX + perpX;
  const controlY = midY + perpY;

  // Create the curved path
  const pathData = `M ${fromPixel.x} ${fromPixel.y} Q ${controlX} ${controlY} ${toPixel.x} ${toPixel.y}`;

  // Snake head size and tail size
  const headRadius = cellSize * 0.15;
  const tailRadius = cellSize * 0.08;
  const bodyWidth = cellSize * 0.12;

  return (
    <g>
      {/* Snake body path */}
      <path
        d={pathData}
        stroke={snake.color}
        strokeWidth={bodyWidth}
        fill="none"
        strokeLinecap="round"
        opacity={0.8}
      />
      
      {/* Snake pattern/texture */}
      <path
        d={pathData}
        stroke="rgba(0,0,0,0.3)"
        strokeWidth={bodyWidth * 0.6}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${cellSize * 0.2} ${cellSize * 0.1}`}
        opacity={0.6}
      />

      {/* Snake head */}
      <circle
        cx={fromPixel.x}
        cy={fromPixel.y}
        r={headRadius}
        fill={snake.color}
        stroke="rgba(0,0,0,0.4)"
        strokeWidth={2}
      />
      
      {/* Snake eyes */}
      <circle
        cx={fromPixel.x - headRadius * 0.3}
        cy={fromPixel.y - headRadius * 0.4}
        r={headRadius * 0.2}
        fill="white"
      />
      <circle
        cx={fromPixel.x + headRadius * 0.3}
        cy={fromPixel.y - headRadius * 0.4}
        r={headRadius * 0.2}
        fill="white"
      />
      <circle
        cx={fromPixel.x - headRadius * 0.3}
        cy={fromPixel.y - headRadius * 0.4}
        r={headRadius * 0.1}
        fill="black"
      />
      <circle
        cx={fromPixel.x + headRadius * 0.3}
        cy={fromPixel.y - headRadius * 0.4}
        r={headRadius * 0.1}
        fill="black"
      />

      {/* Snake tail */}
      <circle
        cx={toPixel.x}
        cy={toPixel.y}
        r={tailRadius}
        fill={snake.color}
        stroke="rgba(0,0,0,0.3)"
        strokeWidth={1}
      />

      {/* Position indicators */}
      <text
        x={fromPixel.x}
        y={fromPixel.y + headRadius + 15}
        textAnchor="middle"
        fontSize="10"
        fill="black"
        fontWeight="bold"
      >
        {snake.head}
      </text>
      
      <text
        x={toPixel.x}
        y={toPixel.y + tailRadius + 15}
        textAnchor="middle"
        fontSize="10"
        fill="black"
        fontWeight="bold"
      >
        {snake.tail}
      </text>
    </g>
  );
};

export default Snake;