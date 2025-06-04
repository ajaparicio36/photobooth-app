import { PaperType, PhotoModePage } from "@/lib/enums";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, LayoutGrid } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ChoosePaperTypeProps {
  setCurrentPage: (page: PhotoModePage) => void;
  setPaperType: (type: PaperType) => void;
}

const ChoosePaperType: React.FC<ChoosePaperTypeProps> = ({
  setCurrentPage,
  setPaperType,
}) => {
  const navigate = useNavigate();

  const handlePaperTypeSelect = (type: PaperType) => {
    setPaperType(type);
    setCurrentPage(PhotoModePage.CapturePhotoScreen);
  };

  const paperTypes = [
    {
      type: PaperType.TwoBySix,
      name: "2×6 Strip",
      photos: 2,
      description: "Classic photo strip format",
      aspect: "2:6",
    },
    {
      type: PaperType.FourBySix,
      name: "4×6 Layout",
      photos: 4,
      description: "Standard photo layout",
      aspect: "4:6",
    },
  ];

  return (
    <div className="h-screen mono-gradient flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-mono-200 bg-white/50 backdrop-blur-sm flex-shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-mono-700 hover:text-mono-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-mono-900">Paper Type</h1>
            <p className="text-xs text-mono-600">Choose your layout format</p>
          </div>
          <div className="w-24"></div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4 min-h-0">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-mono-900 flex items-center justify-center">
              <LayoutGrid className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-mono-900 mb-2">
              Select Paper Type
            </h2>
            <p className="text-mono-600 text-sm">
              Choose the layout that best fits your photo session
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {paperTypes.map((paper) => (
              <Card
                key={paper.type}
                className="glass-card hover:shadow-2xl transition-all duration-300 group cursor-pointer"
                onClick={() => handlePaperTypeSelect(paper.type)}
              >
                <CardHeader className="text-center pb-3">
                  <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-mono-100 flex items-center justify-center group-hover:bg-mono-900 transition-colors duration-300">
                    <div className="text-mono-900 group-hover:text-white font-bold text-xs transition-colors duration-300">
                      {paper.aspect}
                    </div>
                  </div>
                  <CardTitle className="text-lg text-mono-900">
                    {paper.name}
                  </CardTitle>
                  <Badge variant="secondary" className="w-fit mx-auto text-xs">
                    {paper.photos} Photos
                  </Badge>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-mono-600 mb-4 text-sm">
                    {paper.description}
                  </p>
                  <Button className="w-full bg-mono-900 hover:bg-mono-800 text-white">
                    Select Format
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChoosePaperType;
