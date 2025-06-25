import React, { useEffect, useState } from 'react';

interface DiceProps {
  isShaking: boolean;
  value: number | null;
  onAnimationComplete?: () => void;
}

const Dice: React.FC<DiceProps> = ({ isShaking, value, onAnimationComplete }) => {
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    if (isShaking) {
      setAnimationClass('animate-bounce');
    } else if (value !== null) {
      setAnimationClass('animate-pulse');
      setTimeout(() => {
        setAnimationClass('');
        onAnimationComplete?.();
      }, 500);
    } else {
      setAnimationClass('');
    }
  }, [isShaking, value, onAnimationComplete]);

  const renderDots = (num: number) => {
    const dotPositions: { [key: number]: string[] } = {
      1: ['center'],
      2: ['top-left', 'bottom-right'],
      3: ['top-left', 'center', 'bottom-right'],
      4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
      6: ['top-left', 'top-right', 'center-left', 'center-right', 'bottom-left', 'bottom-right'],
    };

    const positions = dotPositions[num] || [];
    
    return positions.map((position, index) => (
      <div
        key={index}
        className={`absolute w-3 h-3 bg-red-600 rounded-full ${getPositionClass(position)}`}
      />
    ));
  };

  const getPositionClass = (position: string) => {
    const classes: { [key: string]: string } = {
      'top-left': 'top-2 left-2',
      'top-right': 'top-2 right-2',
      'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
      'center-left': 'top-1/2 left-2 transform -translate-y-1/2',
      'center-right': 'top-1/2 right-2 transform -translate-y-1/2',
      'bottom-left': 'bottom-2 left-2',
      'bottom-right': 'bottom-2 right-2',
    };
    return classes[position] || '';
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`relative w-16 h-16 bg-white border-2 border-gray-400 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow ${animationClass}`}
        style={{
          animation: isShaking ? 'shake 0.1s infinite' : undefined,
        }}
      >
        <div className="relative w-full h-full">
          {value && renderDots(value)}
        </div>
      </div>
      
      {isShaking && (
        <div className="text-sm font-medium text-gray-600 animate-pulse">
          Rolling...
        </div>
      )}
      
      {value && !isShaking && (
        <div className="text-lg font-bold text-gray-800">
          You rolled: {value}
        </div>
      )}
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(-5px) rotate(-5deg); }
          75% { transform: translateX(5px) rotate(5deg); }
        }
      `}</style>
    </div>
  );
};


export default Dice;