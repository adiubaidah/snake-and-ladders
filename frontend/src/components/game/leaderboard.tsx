import React from 'react';
import type { Player } from '@/schema';

interface LeaderboardMessage {
  type: string;
  player: Player;
  timestamp: string;
}

interface LeaderboardProps {
  messages: LeaderboardMessage[];
}

const Leaderboard: React.FC<LeaderboardProps> = ({ messages }) => {
  const playerJoinMessages = messages.filter(msg => msg.type === 'PLAYER_JOINED');

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 min-w-64">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Game Activity</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {playerJoinMessages.length === 0 ? (
          <p className="text-gray-500 text-sm">No players joined yet...</p>
        ) : (
          playerJoinMessages.map((message, index) => (
            <div
              key={`${message.player.id}-${index}`}
              className="flex items-center gap-3 p-2 bg-gray-50 rounded-md"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: message.player.color }}
              >
                {message.player.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">
                  {message.player.name} joined the game
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Leaderboard;