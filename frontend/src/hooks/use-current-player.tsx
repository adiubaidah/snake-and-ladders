import type { Player } from "@/schema";
import { useState, useEffect } from "react";
function useCurrentPlayer() {
  const [player, setPlayer] = useState<Player | null>(null);

  useEffect(() => {
    if (player) {
      localStorage.setItem("currentPlayer", JSON.stringify(player));
    }
  }, [player]);

  return {
    player,
    setPlayer,
  };
}

export default useCurrentPlayer;
