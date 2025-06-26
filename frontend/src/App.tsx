import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import ReactQuery from "./provider/react-query";
import SocketProvider from "./provider/socket";

const Question = lazy(() => import("./pages/question/question"));
const Game = lazy(() => import("./pages/game/index"));
import StartGame from "@/pages/admin/start-game";
import { PlayerProvider } from "./hooks/use-current-player";

function App() {
  return (
    <ReactQuery>
      <Suspense fallback={<div>Loading...</div>}>
        <Router>
          <Routes>
            <Route
              path="/game"
              element={
                <SocketProvider>
                  <PlayerProvider>
                    <Game />
                  </PlayerProvider>
                </SocketProvider>
              }
            />
            <Route path="/pertanyaan" element={<Question />} />
            <Route
              path="/admin/mulai"
              element={
                <SocketProvider>
                  <StartGame />
                </SocketProvider>
              }
            />
          </Routes>
        </Router>
      </Suspense>
    </ReactQuery>
  );
}

export default App;
