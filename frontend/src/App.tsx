import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import ReactQuery from "./provider/react-query";
import SocketProvider from "./provider/socket";

const Question = lazy(() => import("./pages/question/question"));
import StartGame from "@/pages/admin/start-game";

function App() {
  return (
    <ReactQuery>
      <Router>
        <Routes>
          <Route
            path="/pertanyaan"
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <Question />
              </Suspense>
            }
          />
          <Route
            path="/admin/mulai"
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <SocketProvider>
                  <StartGame />s
                </SocketProvider>
              </Suspense>
            }
          />
        </Routes>
      </Router>
    </ReactQuery>
  );
}

export default App;
