import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import { lazy, Suspense } from 'react';

const Question = lazy(() => import('./pages/question/question'));

function App() {

  return (
    <>
      <Router>
        <Routes>
          <Route path="/question" element={
            <Suspense fallback={<div>Loading...</div>}>
              <Question />
            </Suspense>
          } />
        </Routes>
      </Router>
    </>
  )
}

export default App
