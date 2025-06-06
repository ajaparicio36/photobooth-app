import React, { lazy } from "react";
import {
  BrowserRouter,
  Route,
  Routes,
  Navigate,
  useLocation,
} from "react-router-dom";

const PhotoMode = lazy(() => import("./pages/PhotoMode"));
const FlipbookMode = lazy(() => import("./pages/FlipbookMode"));
const Error = lazy(() => import("./pages/Error"));
const Done = lazy(() => import("./pages/Done"));
const Home = lazy(() => import("./pages/Home"));

function App() {
  const location = useLocation();

  // Debug logging for Electron
  if (window.electronAPI) {
    console.log("Current location:", location);
  }

  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/photo" element={<PhotoMode />} />
        <Route path="/flipbook" element={<FlipbookMode />} />
        <Route path="/error" element={<Error />} />
        <Route path="/done" element={<Done />} />
        {/* Catch all route for file paths */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
