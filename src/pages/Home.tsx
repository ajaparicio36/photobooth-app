import React from "react";
import { useNavigate } from "react-router-dom";

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-500 to-purple-600 text-white">
      <div className="text-center mb-8">
        <h1 className="text-6xl font-bold mb-4">Photobooth App</h1>
        <p className="text-xl opacity-90">Choose your experience</p>
      </div>

      <div className="flex gap-6">
        <button
          onClick={() => navigate("/photo")}
          className="bg-white text-blue-600 px-8 py-4 rounded-lg text-xl font-semibold hover:bg-gray-100 transition-colors shadow-lg"
        >
          📸 Photo Mode
        </button>

        <button
          onClick={() => navigate("/flipbook")}
          className="bg-white text-purple-600 px-8 py-4 rounded-lg text-xl font-semibold hover:bg-gray-100 transition-colors shadow-lg"
        >
          🎬 Flipbook Mode
        </button>
      </div>

      <div className="mt-8 text-center opacity-75">
        <p className="text-sm">Select a mode to get started</p>
      </div>
    </div>
  );
};

export default Home;
