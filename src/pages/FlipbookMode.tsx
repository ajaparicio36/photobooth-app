import FlipbookStartScreen from "@/components/FlipbookMode/FlipbookStartScreen";
import RecordingPage from "@/components/FlipbookMode/RecordingPage";
import VideoPreview from "@/components/FlipbookMode/VideoPreview";
import PrintPreview from "@/components/FlipbookMode/PrintPreview";
import { FlipbookPage } from "@/lib/enums";
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const FlipbookMode: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<FlipbookPage>(
    FlipbookPage.FlipbookStartScreen
  );
  const [selectedFilter, setSelectedFilter] = useState<string>("none");
  const [captureMode, setCaptureMode] = useState<"webcam" | "dslr">("webcam");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [flipbookAssets, setFlipbookAssets] = useState<{
    pages: string[];
    pdfPath: string;
    pageCount: number;
    frameCount: number;
  } | null>(null);

  const clearVideoFile = () => {
    setVideoFile(null);
    // Optionally, could also reset flipbookAssets here if retaking from VideoPreview
    // setFlipbookAssets(null);
  };

  const renderCurrentView = () => {
    switch (currentPage) {
      case FlipbookPage.FlipbookStartScreen:
        return (
          <FlipbookStartScreen
            setCurrentPage={setCurrentPage}
            setSelectedFilter={setSelectedFilter}
            setCaptureMode={setCaptureMode}
          />
        );
      case FlipbookPage.RecordingPage:
        return (
          <RecordingPage
            setCurrentPage={setCurrentPage}
            setVideoFile={setVideoFile}
            captureMode={captureMode}
            selectedFilter={selectedFilter} // Pass it along, might be needed
          />
        );
      case FlipbookPage.VideoPreview:
        return (
          <VideoPreview
            setCurrentPage={setCurrentPage}
            videoFile={videoFile}
            selectedFilter={selectedFilter}
            setFlipbookAssets={setFlipbookAssets}
            clearVideoFile={clearVideoFile}
          />
        );
      case FlipbookPage.FlipbookProcessing:
        return (
          <div className="min-h-screen mono-gradient flex items-center justify-center p-6">
            <Card className="glass-card w-full max-w-md text-center">
              <CardContent className="p-10">
                <Loader2 className="h-16 w-16 text-mono-800 animate-spin mx-auto mb-6" />
                <h2 className="text-2xl font-semibold text-mono-900 mb-2">
                  Creating Your Flipbook
                </h2>
                <p className="text-mono-600">
                  This might take a few moments. Please wait...
                </p>
              </CardContent>
            </Card>
          </div>
        );
      case FlipbookPage.PrintPreview:
        return (
          <PrintPreview
            setCurrentPage={setCurrentPage}
            flipbookAssets={flipbookAssets}
          />
        );
      default:
        // Reset state if something goes wrong
        setVideoFile(null);
        setFlipbookAssets(null);
        return (
          <FlipbookStartScreen
            setCurrentPage={setCurrentPage}
            setSelectedFilter={setSelectedFilter}
            setCaptureMode={setCaptureMode}
          />
        );
    }
  };

  return <div className="flipbook-mode-container">{renderCurrentView()}</div>;
};

export default FlipbookMode;
