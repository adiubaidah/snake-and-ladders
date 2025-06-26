import { axiosInstance } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

export type PlayerData = {
  id: string;
  name: string;
  position: number;
  coordinates: { row: number; col: number };
  color: string;
  isCurrentPlayer: boolean;
};

export type PlayersResponse = {
  players: PlayerData[];
  currentPlayerId: string | null;
};

function usePlayers(options = {}) {
  const { 
    data, 
    isLoading, 
    refetch 
  } = useQuery<PlayersResponse>({
    queryKey: ["players"],
    queryFn: async () => {
      const response = (await axiosInstance.get("/game/players")).data;
      return response;
    },
    ...options
  });

  return {
    players: data?.players || [],
    currentPlayerId: data?.currentPlayerId,
    isLoading,
    refetchPlayers: refetch
  };
}

export default usePlayers;