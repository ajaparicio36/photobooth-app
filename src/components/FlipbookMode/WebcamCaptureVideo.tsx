import { FlipbookPage } from "@/lib/enums"; // Updated enum import
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  Timer,
  CheckCircle,
  Loader2,
  AlertCircle,
  Play,
} from "lucide-react";
import { useWebcam } from "@/hooks/useWebcam";
import { useAudio } from "@/hooks/useAudio";
import { useWebcamVideo } from "@/hooks/useWebcamVideo";

interface WebcamCaptureVideoProps {
  setVideoFile: (video: File) => void;
  setCurrentPage: (page: FlipbookPage) => void; // Updated to FlipbookPage
}

const WebcamCaptureVideo: React.FC<WebcamCaptureVideoProps> = ({
  setVideoFile,
  setCurrentPage,
}) => {
  const {
    videoRef,
    webcamReady,
    webcamError,
    isInitializing,
    isWebcamInitInProgress,
    resetWebcam,
    cleanup,
  } = useWebcam();

  const { playCountdownTick } = useAudio();

  const {
    recordingState,
    recordedVideo,
    countdown,
    recordingProgress,
    startVideoSession,
    // stopRecording, // stopRecording might be useful for a cancel button
    resetRecording,
  } = useWebcamVideo();

  // Handle recording completion
  useEffect(() => {
    if (recordingState === "complete" && recordedVideo) {
      setVideoFile(recordedVideo);
      // Navigate to VideoPreview after capture is complete
      setCurrentPage(FlipbookPage.VideoPreview);
    }
  }, [recordingState, recordedVideo, setVideoFile, setCurrentPage]);

  // Play countdown sound
  useEffect(() => {
    if (countdown !== null && recordingState === "countdown") {
      // Ensure sound only in countdown
      playCountdownTick();
    }
  }, [countdown, recordingState, playCountdownTick]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetRecording();
      cleanup();
    };
  }, [resetRecording, cleanup]);

  const handleStartRecording = async () => {
    if (!webcamReady) {
      console.warn("Cannot start recording, webcam not ready.");
      return;
    }
    try {
      await startVideoSession(videoRef); // startVideoSession handles countdown and recording
    } catch (error) {
      console.error("Failed to start video session:", error);
      // Handle error state if needed, e.g., show a message to the user
    }
  };

  // Loading state
  if (isInitializing) {
    return (
      <div className="min-h-screen mono-gradient flex items-center justify-center p-6">
        <Card className="glass-card max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-mono-100 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-mono-900 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-mono-900 mb-3">
              Loading Video Session
            </h2>
            <p className="text-mono-600 mb-4">
              Preparing camera and interface...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (webcamError) {
    return (
      <div className="min-h-screen mono-gradient flex items-center justify-center p-6">
        <Card className="glass-card max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-mono-900 mb-3">
              Camera Error
            </h2>
            <p className="text-mono-600 mb-6 text-sm leading-relaxed">
              {webcamError}
            </p>
            <div className="space-y-3">
              <Button
                onClick={resetWebcam}
                className="w-full bg-mono-900 hover:bg-mono-800 text-white"
              >
                <Video className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="w-full"
              >
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderRecordingOverlay = () => {
    if (recordingState === "countdown" && countdown !== null) {
      return (
        <div className="countdown-overlay">
          <div className="text-center animate-pulse">
            <div className="text-6xl font-bold text-white mb-2">
              {countdown}
            </div>
            <div className="text-lg text-white/80">Get Ready to Record!</div>
          </div>
        </div>
      );
    }

    if (recordingState === "recording") {
      return (
        <div className="countdown-overlay">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-600 flex items-center justify-center animate-pulse">
              <div className="w-8 h-8 rounded-full bg-white"></div>
            </div>
            <div className="text-lg text-white font-semibold mb-2">
              Recording...
            </div>
            <div className="text-sm text-white/80">
              {Math.ceil(((100 - recordingProgress) / 100) * 7)}s remaining
            </div>
          </div>
        </div>
      );
    }

    if (recordingState === "processing") {
      return (
        <div className="countdown-overlay">
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-2 text-white animate-spin" />
            <div className="text-lg text-white font-semibold">
              Processing Video...
            </div>
          </div>
        </div>
      );
    }

    // "complete" state is handled by navigation, so no overlay needed here typically
    // but can be added if there's a brief pause before navigation.
    if (recordingState === "complete") {
      return (
        <div className="countdown-overlay">
          <div className="text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-400" />
            <div className="text-lg text-white font-semibold">
              Video Captured!
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderControlsContent = () => {
    if (recordingState === "idle") {
      return (
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-bold text-mono-900 mb-1">
              Ready to Record?
            </h3>
            <p className="text-mono-600 text-sm">
              We'll record a 7-second video that will be turned into a flipbook.
            </p>
          </div>
          <Button
            onClick={handleStartRecording}
            size="lg"
            className="bg-mono-900 hover:bg-mono-800 text-white px-6 py-3"
            disabled={!webcamReady || isWebcamInitInProgress}
          >
            <Play className="w-4 h-4 mr-2" />
            Start Recording (7s)
          </Button>
        </div>
      );
    }

    switch (recordingState) {
      case "countdown":
        return (
          <div className="flex items-center justify-center gap-3 text-mono-900">
            <Timer className="w-6 h-6" />
            <span className="text-lg font-semibold">
              Recording starts in {countdown}...
            </span>
          </div>
        );

      case "recording":
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-3 text-red-600">
              <div className="w-6 h-6 rounded-full bg-red-600 animate-pulse"></div>
              <span className="text-lg font-semibold">
                Recording in progress...
              </span>
            </div>
            <Progress value={recordingProgress} className="h-2" />
            <div className="text-center text-sm text-mono-600">
              {Math.ceil(((100 - recordingProgress) / 100) * 7)} seconds
              remaining
            </div>
          </div>
        );

      case "processing":
        return (
          <div className="flex items-center justify-center gap-3 text-mono-600">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-lg">Finalizing video...</span>
          </div>
        );

      case "complete":
        return (
          <div className="flex items-center justify-center gap-3 text-green-700">
            <CheckCircle className="w-6 h-6" />
            <span className="text-lg font-semibold">
              Video ready! Proceeding to preview...
            </span>
          </div>
        );

      default: // Should not happen
        return (
          <div className="flex items-center justify-center gap-3 text-mono-600">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-lg">Please wait...</span>
          </div>
        );
    }
  };

  return (
    <div className="h-screen mono-gradient flex flex-col overflow-hidden">
      <div className="p-4 border-b border-mono-200 bg-white/50 backdrop-blur-sm flex-shrink-0">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-xl font-bold text-mono-900">
            Flipbook Video Recording
          </h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              Webcam Mode
            </Badge>
            <Badge variant="outline" className="text-xs">
              7 Second Video
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 min-h-0">
        <div className="max-w-2xl w-full h-full flex flex-col">
          {recordingState === "recording" && (
            <Card className="glass-card mb-4 flex-shrink-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-red-600" />
                    <span className="font-semibold text-mono-900 text-sm">
                      Recording Progress
                    </span>
                  </div>
                  <span className="text-xs text-mono-600">
                    {Math.round(recordingProgress)}%
                  </span>
                </div>
                <Progress value={recordingProgress} className="h-2 mb-1" />
                <div className="text-xs text-mono-600">
                  {Math.ceil(((100 - recordingProgress) / 100) * 7)} seconds
                  remaining
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="glass-card mb-4 flex-1 min-h-0">
            <CardContent className="p-4 h-full">
              <div className="relative h-full max-w-md mx-auto">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="capture-frame w-full h-full object-cover rounded-lg bg-black"
                  style={{ aspectRatio: "3/4" }}
                />
                {(!webcamReady || isWebcamInitInProgress) && !webcamError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                    <div className="text-center text-white">
                      <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                      <p>Starting camera...</p>
                    </div>
                  </div>
                )}
                {renderRecordingOverlay()}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card flex-shrink-0">
            <CardContent className="p-4 text-center">
              {renderControlsContent()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WebcamCaptureVideo;
