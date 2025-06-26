import { useContext, useEffect, useState } from "react";
import { SocketContext } from "@/provider/socket";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Users, Play, Loader2 } from "lucide-react";

function StartGame({ setIsGameStarted }: { setIsGameStarted: (isStarted: boolean) => void }) {
  const { isConnected, socket } = useContext(SocketContext);
  const [hasJoinedGame, setHasJoinedGame] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (!isConnected || !socket) {
      console.error("Socket is not connected");
      return;
    }

    socket.on("admin-joined", (data) => {
      console.log("Admin has joined the game", data);
      console.log("Admin has joined the game");
      setHasJoinedGame(true);
      setIsJoining(false);
    });

    return () => {
      socket.off("admin-joined");
    };
  }, [isConnected, socket]);

  const handleJoinGame = () => {
    if (isConnected && socket) {
      setIsJoining(true);
      socket.emit("join-game", { playerName: "admin" });
    } else {
      console.error("Socket is not connected");
    }
  };

  const handleStartGame = () => {
    if (isConnected && socket && hasJoinedGame) {
      setIsStarting(true);
      socket.emit("start-game");
      setTimeout(() => {
        setIsStarting(false);
        setIsGameStarted(true);
      }, 2000);
    } else {
      console.error("Socket is not connected or admin hasn't joined");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Game Control Panel
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Manage your Snake & Ladder game session
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className={`text-sm font-medium ${isConnected ? 'text-green-700' : 'text-red-700'}`}>
              {isConnected ? 'Connected to server' : 'Disconnected from server'}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                hasJoinedGame ? 'bg-green-500' : 'bg-gray-400'
              }`}>
                {hasJoinedGame ? <CheckCircle className="w-4 h-4" /> : '1'}
              </div>
              <span className="font-semibold text-gray-700">Join as Administrator</span>
              {hasJoinedGame && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Joined
                </Badge>
              )}
            </div>
            
            {!hasJoinedGame && (
              <Button 
                onClick={handleJoinGame}
                disabled={!isConnected || isJoining}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Joining Game...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    Join Game as Admin
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Step 2: Start Game */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                hasJoinedGame ? 'bg-blue-500' : 'bg-gray-400'
              }`}>
                {hasJoinedGame ? <Play className="w-4 h-4" /> : '2'}
              </div>
              <span className="font-semibold text-gray-700">Start the Game</span>
            </div>
            
            <Button 
              onClick={handleStartGame}
              disabled={!isConnected || !hasJoinedGame || isStarting}
              className={`w-full font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 ${
                hasJoinedGame 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isStarting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Starting Game...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Game
                </>
              )}
            </Button>
            
            {!hasJoinedGame && (
              <p className="text-sm text-gray-500 text-center">
                You must join the game first before starting
              </p>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Instructions:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• First, join the game as an administrator</li>
              <li>• Wait for other players to join</li>
              <li>• Start the game when ready (minimum 2 players required)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default StartGame;
