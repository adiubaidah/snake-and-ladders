import { createContext, useEffect, useState } from "react";
import { socket } from "@/lib/utils";

export const SocketContext = createContext({
  isConnected: false,
  socket: socket,
});

function SocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
   if (!socket.connected) {
      socket.connect();
    }

    function onConnect() {
      setIsConnected(true);
      console.log("Socket connected");
    }

    function onDisconnect() {
      setIsConnected(false);
      console.log("Socket disconnected");
    }

    function onError(error: Error) {
      console.error("Connection error:", error);
    }

    // Set up event listeners
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onError);

    // Clean up
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onError);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ isConnected, socket }}>
      {children}
    </SocketContext.Provider>
  );
}

export default SocketProvider;