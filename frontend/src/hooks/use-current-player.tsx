import type { Player } from "@/schema";
import { useContext } from "react";
import { createContext, useState, type ReactNode} from "react";

interface PlayerContextType {
  player: Player | null;
  setPlayer: (player: Player | null) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<Player | null>(null);

  return (
    <PlayerContext.Provider value={{ player, setPlayer }}>
      {children}
    </PlayerContext.Provider>
  );
}

function useCurrentPlayer() {
  const context = useContext(PlayerContext);
  
  if (context === undefined) {
    throw new Error('useCurrentPlayer must be used within a PlayerProvider');
  }
  
  return context;
}

export default useCurrentPlayer;