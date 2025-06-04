import React, { lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";

const PhotoMode = lazy(() => import("./pages/PhotoMode"));
const FlipbookMode = lazy(() => import("./pages/FlipbookMode"));
const Error = lazy(() => import("./pages/Error"));
const Done = lazy(() => import("./pages/Done"));

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/photo" element={<PhotoMode />} />
        <Route path="/flipbook" element={<FlipbookMode />} />
        <Route path="/" element={<Home />} />
        <Route path="/error" element={<Error />} />
        <Route path="/done" element={<Done />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
