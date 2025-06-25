import { createContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
const SocketContext = createContext({
  isConnected: false,
});

const socket = io(import.meta.env.VITE_SOCKET_URL );
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

    return () => {
      socket.off("connect");
      socket.off("disconnect");
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
