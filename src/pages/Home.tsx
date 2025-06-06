import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Film } from "lucide-react";

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen mono-gradient flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        {/* Header Section */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-mono-900 flex items-center justify-center">
              <Camera className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-6xl font-bold text-mono-900 mb-4 tracking-tight">
              Photobooth
            </h1>
            <div className="w-24 h-1 bg-mono-900 mx-auto mb-6"></div>
            <p className="text-xl text-mono-600 font-medium">
              Choose your experience
            </p>
          </div>
        </div>

        {/* Mode Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          <Card className="glass-card hover:shadow-2xl transition-all duration-300 group cursor-pointer animate-slide-up">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-mono-100 flex items-center justify-center group-hover:bg-mono-900 transition-colors duration-300">
                <Camera className="w-8 h-8 text-mono-900 group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-2xl font-bold text-mono-900 mb-3">
                Photo Mode
              </h3>
              <p className="text-mono-600 mb-6 leading-relaxed">
                Capture beautiful moments with customizable layouts and filters
              </p>
              <Button
                onClick={() => navigate("/photo")}
                className="w-full bg-mono-900 hover:bg-mono-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300"
              >
                Start Session
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card hover:shadow-2xl transition-all duration-300 group cursor-pointer animate-slide-up [animation-delay:100ms]">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-mono-100 flex items-center justify-center group-hover:bg-mono-900 transition-colors duration-300">
                <Film className="w-8 h-8 text-mono-900 group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-2xl font-bold text-mono-900 mb-3">
                Flipbook Mode
              </h3>
              <p className="text-mono-600 mb-6 leading-relaxed">
                Create animated flipbook memories with sequential captures
              </p>
              <Button
                onClick={() => navigate("/flipbook")}
                className="w-full bg-mono-900 hover:bg-mono-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300"
              >
                Create Flipbook
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 animate-fade-in [animation-delay:200ms]">
          <p className="text-mono-500 text-sm font-medium">
            Select a mode to begin your photo session
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
