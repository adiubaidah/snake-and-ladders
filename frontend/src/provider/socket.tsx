import { createContext, useEffect, useState } from "react";
import {socket} from "@/lib/utils"
const SocketContext = createContext({
  isConnected: false,
});


function SocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    socket.connect();
    socket.on("connect", () => {
      setIsConnected(true);
      console.log("Socket connected");
    });
    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export default SocketProvider;