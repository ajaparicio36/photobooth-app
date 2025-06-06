import { FlipbookPage } from "@/lib/enums";
import React from "react";
import WebcamCaptureVideo from "./WebcamCaptureVideo"; // Ensure this path is correct
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface RecordingPageProps {
  setCurrentPage: (page: FlipbookPage) => void;
  setVideoFile: (file: File | null) => void;
  captureMode: "webcam" | "dslr";
  selectedFilter: string; // Though not directly used here, it's part of the session state
}

const RecordingPage: React.FC<RecordingPageProps> = ({
  setCurrentPage,
  setVideoFile,
  captureMode,
  // selectedFilter, // Available if needed for UI elements
}) => {
  if (captureMode === "webcam") {
    return (
      <WebcamCaptureVideo
        setCurrentPage={setCurrentPage}
        setVideoFile={setVideoFile}
      />
    );
  }

  if (captureMode === "dslr") {
    // Placeholder for DSLR video capture
    return (
      <div className="min-h-screen mono-gradient flex items-center justify-center p-6">
        <Card className="glass-card w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-mono-900">
              DSLR Video Recording
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-8">
            <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto" />
            <p className="text-mono-700">
              DSLR video recording is not yet implemented.
            </p>
            <p className="text-sm text-mono-600">
              This feature will allow you to record video using a connected DSLR
              camera. Please check back later or switch to Webcam mode.
            </p>
            <Button
              onClick={() => setCurrentPage(FlipbookPage.FlipbookStartScreen)}
              variant="outline"
              className="w-full"
            >
              Back to Start
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback for unknown mode
  return (
    <div className="min-h-screen mono-gradient flex items-center justify-center p-6">
      <Card className="glass-card w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-red-600">
            Error
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <p className="text-mono-700">Invalid capture mode selected.</p>
          <Button
            onClick={() => setCurrentPage(FlipbookPage.FlipbookStartScreen)}
            variant="outline"
            className="w-full mt-6"
          >
            Return to Start
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecordingPage;
