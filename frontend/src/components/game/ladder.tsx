import React from 'react';

interface Coordinates {
  row: number;
  col: number;
}

interface LadderData {
  type: "ladder";
  id: string;
  bottom: number;
  top: number;
  coordinates: {
    from: Coordinates;
    to: Coordinates;
  };
  color: string;
  description: string;
}

interface LadderProps {
  ladder: LadderData;
  getPixelCoordinates: (coords: Coordinates) => { x: number; y: number };
  cellSize: number;
}

const Ladder: React.FC<LadderProps> = ({ ladder, getPixelCoordinates, cellSize }) => {
  const fromPixel = getPixelCoordinates(ladder.coordinates.from);
  const toPixel = getPixelCoordinates(ladder.coordinates.to);

  // Calculate the distance between points
  const dx = toPixel.x - fromPixel.x;
  const dy = toPixel.y - fromPixel.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  // Ladder dimensions
  const ladderWidth = cellSize * 0.15;
  const rungSpacing = cellSize * 0.3;
  const numberOfRungs = Math.floor(length / rungSpacing);

  // Calculate ladder side positions
  const perpX = (-dy / length) * (ladderWidth / 2);
  const perpY = (dx / length) * (ladderWidth / 2);

  const leftSideStart = { x: fromPixel.x + perpX, y: fromPixel.y + perpY };
  const leftSideEnd = { x: toPixel.x + perpX, y: toPixel.y + perpY };
  const rightSideStart = { x: fromPixel.x - perpX, y: fromPixel.y - perpY };
  const rightSideEnd = { x: toPixel.x - perpX, y: toPixel.y - perpY };

  // Generate rungs
  const rungs = [];
  for (let i = 1; i <= numberOfRungs; i++) {
    const t = i / (numberOfRungs + 1);
    const rungLeftX = leftSideStart.x + (leftSideEnd.x - leftSideStart.x) * t;
    const rungLeftY = leftSideStart.y + (leftSideEnd.y - leftSideStart.y) * t;
    const rungRightX = rightSideStart.x + (rightSideEnd.x - rightSideStart.x) * t;
    const rungRightY = rightSideStart.y + (rightSideEnd.y - rightSideStart.y) * t;

    rungs.push(
      <line
        key={`rung-${i}`}
        x1={rungLeftX}
        y1={rungLeftY}
        x2={rungRightX}
        y2={rungRightY}
        stroke={ladder.color}
        strokeWidth={3}
        opacity={0.9}
      />
    );
  }

  return (
    <g>
      {/* Ladder shadow for depth */}
      <line
        x1={leftSideStart.x + 2}
        y1={leftSideStart.y + 2}
        x2={leftSideEnd.x + 2}
        y2={leftSideEnd.y + 2}
        stroke="rgba(0,0,0,0.2)"
        strokeWidth={5}
        strokeLinecap="round"
      />
      <line
        x1={rightSideStart.x + 2}
        y1={rightSideStart.y + 2}
        x2={rightSideEnd.x + 2}
        y2={rightSideEnd.y + 2}
        stroke="rgba(0,0,0,0.2)"
        strokeWidth={5}
        strokeLinecap="round"
      />

      {/* Left side of ladder */}
      <line
        x1={leftSideStart.x}
        y1={leftSideStart.y}
        x2={leftSideEnd.x}
        y2={leftSideEnd.y}
        stroke={ladder.color}
        strokeWidth={5}
        strokeLinecap="round"
        opacity={0.9}
      />

      {/* Right side of ladder */}
      <line
        x1={rightSideStart.x}
        y1={rightSideStart.y}
        x2={rightSideEnd.x}
        y2={rightSideEnd.y}
        stroke={ladder.color}
        strokeWidth={5}
        strokeLinecap="round"
        opacity={0.9}
      />

      {/* Ladder rungs */}
      {rungs}

      {/* Ladder highlights for 3D effect */}
      <line
        x1={leftSideStart.x}
        y1={leftSideStart.y}
        x2={leftSideEnd.x}
        y2={leftSideEnd.y}
        stroke="rgba(255,255,255,0.4)"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <line
        x1={rightSideStart.x}
        y1={rightSideStart.y}
        x2={rightSideEnd.x}
        y2={rightSideEnd.y}
        stroke="rgba(255,255,255,0.4)"
        strokeWidth={2}
        strokeLinecap="round"
      />

      {/* Position indicators */}
      <text
        x={fromPixel.x}
        y={fromPixel.y + 20}
        textAnchor="middle"
        fontSize="10"
        fill="black"
        fontWeight="bold"
      >
        {ladder.bottom}
      </text>
      
      <text
        x={toPixel.x}
        y={toPixel.y - 10}
        textAnchor="middle"
        fontSize="10"
        fill="black"
        fontWeight="bold"
      >
        {ladder.top}
      </text>

      {/* Arrow indicator showing direction */}
      <defs>
        <marker
          id={`arrowhead-${ladder.id}`}
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill="#28a745"
            opacity={0.8}
          />
        </marker>
      </defs>
      
      <line
        x1={fromPixel.x}
        y1={fromPixel.y - 5}
        x2={toPixel.x}
        y2={toPixel.y + 5}
        stroke="#28a745"
        strokeWidth={2}
        markerEnd={`url(#arrowhead-${ladder.id})`}
        opacity={0.7}
        strokeDasharray="5,5"
      />
    </g>
  );
};

export default Ladder;