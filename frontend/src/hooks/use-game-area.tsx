import { axiosInstance } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import type { GameArea } from "@/schema";

function useGameArea() {
  const { data, isLoading } = useQuery<GameArea>({
    queryKey: ["game-area"],
    queryFn: async () => {
      const response = (await axiosInstance.get("/game/plot")).data;
      return response;
    },
  });

  return {
    data,
    isLoading,
  };
}

export default useGameArea;
