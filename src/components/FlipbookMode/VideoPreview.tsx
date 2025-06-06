import { FlipbookPage } from "@/lib/enums";
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { RotateCcw, Check, Loader2, AlertTriangle } from "lucide-react";

interface VideoPreviewProps {
  setCurrentPage: (page: FlipbookPage) => void;
  videoFile: File | null;
  selectedFilter: string;
  setFlipbookAssets: (assets: {
    pages: string[];
    pdfPath: string;
    pageCount: number;
    frameCount: number;
  }) => void;
  // Function to clear the video file if retaking
  clearVideoFile: () => void;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({
  setCurrentPage,
  videoFile,
  selectedFilter,
  setFlipbookAssets,
  clearVideoFile,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setVideoSrc(url);
      return () => URL.revokeObjectURL(url);
    } else {
      // If no video file, perhaps navigate back or show error
      setError("No video file found for preview.");
      setCurrentPage(FlipbookPage.RecordingPage); // Or StartScreen
    }
  }, [videoFile, setCurrentPage]);

  const handleRetake = () => {
    clearVideoFile(); // Clear the video file in the parent state
    setCurrentPage(FlipbookPage.RecordingPage);
  };

  const handleConfirm = async () => {
    if (!videoFile) {
      setError("Cannot process: Video file is missing.");
      return;
    }

    setCurrentPage(FlipbookPage.FlipbookProcessing); // Show loading/processing UI

    try {
      // 1. Save the video file to a temporary path accessible by Electron backend
      //    The File object from webcam is in memory. Electron needs a file path.
      const tempVideoPath = await window.electronAPI.createTempFile(
        await videoFile.arrayBuffer(), // Send ArrayBuffer
        `.${videoFile.name.split(".").pop() || "webm"}` // Get extension
      );

      if (!tempVideoPath.success || !tempVideoPath.path) {
        throw new Error(
          "Failed to create temporary video file for processing."
        );
      }

      // Define a temporary output directory for flipbook assets
      // This could be a unique directory in app's temp data path
      // For simplicity, let's ask Electron to handle this or use a fixed sub-directory name
      // const tempOutputDir = `flipbook_output_${Date.now()}`; // This needs to be a full path
      // It's better if Electron creates and manages this output dir.
      // Let's assume the backend `createFlipbook` handles output dir creation if given a base path.
      // Or, we can ask for a temp dir path from Electron.
      // For now, let's pass a relative path and let backend decide.
      // A robust solution would involve `app.getPath('userData')` or `app.getPath('temp')` on backend.

      const outputDirName = `flipbook_session_${Date.now()}`; // This will be created inside a temp location by backend

      const flipbookResult = await window.electronAPI.createFlipbook(
        tempVideoPath.path, // Path to the temp video file
        outputDirName, // Name of the directory to create for output
        {
          filterName: selectedFilter,
          // Add other options like framesPerPage, logoSize if configurable from UI
          framesPerPage: 9,
          logoSize: 150,
          spacing: 10,
          backgroundColor: "#FFFFFF",
        }
      );

      if (flipbookResult && flipbookResult.pdfPath) {
        setFlipbookAssets({
          pages: flipbookResult.pages,
          pdfPath: flipbookResult.pdfPath,
          pageCount: flipbookResult.pageCount,
          frameCount: flipbookResult.frameCount,
        });
        setCurrentPage(FlipbookPage.PrintPreview);
      } else {
        throw new Error("Flipbook generation failed or returned invalid data.");
      }
    } catch (err: any) {
      console.error("Error creating flipbook:", err);
      setError(`Failed to create flipbook: ${err.message || "Unknown error"}`);
      // Optionally navigate back or allow retry from processing page
      setCurrentPage(FlipbookPage.VideoPreview); // Stay on preview, show error
    }
  };

  if (error && !videoFile) {
    // If error occurred because no video file
    return (
      <div className="min-h-screen mono-gradient flex items-center justify-center p-6">
        <Card className="glass-card w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-red-600">
              Preview Error
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-mono-700 mb-6">{error}</p>
            <Button
              onClick={() => setCurrentPage(FlipbookPage.FlipbookStartScreen)}
              variant="outline"
            >
              Start Over
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen mono-gradient flex flex-col items-center justify-center p-6">
      <Card className="glass-card w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-mono-900">
            Preview Your Video
          </CardTitle>
          <CardDescription className="text-mono-600">
            Watch your captured video. Happy with it? Let's make a flipbook!
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          {videoSrc ? (
            <div className="aspect-w-9 aspect-h-16 sm:aspect-w-16 sm:aspect-h-9 rounded-lg overflow-hidden shadow-lg border border-mono-200">
              <video
                ref={videoRef}
                src={videoSrc}
                controls
                autoPlay
                loop
                className="w-full h-full object-contain bg-black"
              />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center bg-mono-100 rounded-lg">
              <Loader2 className="h-12 w-12 text-mono-400 animate-spin" />
            </div>
          )}

          {error && (
            <div
              className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md"
              role="alert"
            >
              <div className="flex">
                <div className="py-1">
                  <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
                </div>
                <div>
                  <p className="font-bold">Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <Button
              onClick={handleRetake}
              variant="outline"
              size="lg"
              className="text-lg py-3 border-mono-700 text-mono-800 hover:bg-mono-100"
            >
              <RotateCcw className="mr-2 h-5 w-5" />
              Retake Video
            </Button>
            <Button
              onClick={handleConfirm}
              size="lg"
              className="text-lg py-3 bg-green-600 hover:bg-green-700 text-white"
              disabled={!videoFile}
            >
              <Check className="mr-2 h-5 w-5" />
              Confirm & Create Flipbook
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoPreview;
