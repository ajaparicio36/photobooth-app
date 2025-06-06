import { PaperType, PhotoModePage, PAPER_TYPE_PHOTO_COUNT } from "@/lib/enums";
import React, { useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Camera, Timer, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { useWebcam } from "@/hooks/useWebcam";
import { useAudio } from "@/hooks/useAudio";
import { usePhotoCapture } from "@/hooks/usePhotoCapture";

interface WebcamCapturePhotoProps {
  setPhotos: (photos: File[]) => void;
  setCurrentPage: (page: PhotoModePage) => void;
  paperType: PaperType;
}

const WebcamCapturePhoto: React.FC<WebcamCapturePhotoProps> = ({
  setPhotos,
  setCurrentPage,
  paperType,
}) => {
  const requiredPhotos = PAPER_TYPE_PHOTO_COUNT[paperType]; // This will be 2 for 2x6, 4 for 4x6

  const {
    videoRef,
    webcamReady,
    webcamError,
    isInitializing,
    isWebcamInitInProgress,
    resetWebcam,
    cleanup,
  } = useWebcam();

  const { playCountdownTick, playShutterSound } = useAudio();

  const {
    captureState,
    sessionStarted,
    countdown,
    capturedPhotos,
    currentPhotoPreview,
    canvasRef,
    photosArrayRef,
    countdownValueRef,
    setSessionStarted,
    setCountdownDisplay,
    setCaptureState,
    resetSession,
    capturePhoto,
    clearTimers,
    countdownTimerRef,
  } = usePhotoCapture(requiredPhotos);

  // Handle countdown logic with refs
  const runCountdown = useCallback(() => {
    if (countdownValueRef.current <= 0) {
      setCountdownDisplay(null);
      capturePhoto(videoRef, () => {}, playShutterSound, startCountdown);
      return;
    }

    setCountdownDisplay(countdownValueRef.current);
    playCountdownTick();

    countdownTimerRef.current = setTimeout(() => {
      countdownValueRef.current -= 1;
      runCountdown();
    }, 1000);
  }, [
    capturePhoto,
    videoRef,
    playShutterSound,
    playCountdownTick,
    setCountdownDisplay,
    countdownValueRef,
    countdownTimerRef,
  ]);

  // Start countdown
  const startCountdown = useCallback(() => {
    console.log("Starting countdown...");
    clearTimers();
    setCaptureState("countdown");
    countdownValueRef.current = 10;
    runCountdown();
  }, [clearTimers, setCaptureState, countdownValueRef, runCountdown]);

  // Start photo session
  const startPhotoSession = useCallback(() => {
    if (!webcamReady) {
      console.warn("Cannot start photo session, webcam not ready.");
      return;
    }

    setSessionStarted(true);
    photosArrayRef.current = [];
    startCountdown();
  }, [webcamReady, setSessionStarted, photosArrayRef, startCountdown]);

  // Handle session completion
  useEffect(() => {
    if (
      captureState === "complete" &&
      photosArrayRef.current.length >= requiredPhotos
    ) {
      setPhotos(photosArrayRef.current);

      const navigationTimer = setTimeout(() => {
        setCurrentPage(PhotoModePage.SelectFilterPage);
      }, 1000);

      return () => clearTimeout(navigationTimer);
    }
  }, [captureState, requiredPhotos, setPhotos, setCurrentPage, photosArrayRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetSession();
      cleanup();
    };
  }, [resetSession, cleanup]);

  const progress = (capturedPhotos.length / requiredPhotos) * 100;

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
              Loading Photo Session
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
                <Camera className="w-4 h-4 mr-2" />
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

  const renderCaptureOverlay = () => {
    if (captureState === "countdown" && countdown !== null) {
      return (
        <div className="countdown-overlay">
          <div className="text-center animate-pulse">
            <div className="text-6xl font-bold text-white mb-2">
              {countdown}
            </div>
            <div className="text-lg text-white/80">Get Ready!</div>
          </div>
        </div>
      );
    }

    if (captureState === "capturing") {
      return (
        <div className="countdown-overlay">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-white/20 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-white animate-pulse"></div>
            </div>
            <div className="text-lg text-white font-semibold">Capturing...</div>
          </div>
        </div>
      );
    }

    if (captureState === "preview" && currentPhotoPreview) {
      return (
        <div className="countdown-overlay">
          <div className="text-center">
            <img
              src={currentPhotoPreview}
              alt="Captured photo preview"
              className="w-32 h-32 object-cover rounded-lg mb-2 mx-auto"
            />
            <div className="text-lg text-white font-semibold">Great shot!</div>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderControlsContent = () => {
    if (!sessionStarted) {
      return (
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-bold text-mono-900 mb-1">
              Ready to Start?
            </h3>
            <p className="text-mono-600 text-sm">
              We'll capture {requiredPhotos} photos with a 10-second countdown
              between each shot
            </p>
          </div>
          <Button
            onClick={startPhotoSession}
            size="lg"
            className="bg-mono-900 hover:bg-mono-800 text-white px-6 py-3"
            disabled={!webcamReady || isWebcamInitInProgress}
          >
            <Camera className="w-4 h-4 mr-2" />
            Start Photo Session
          </Button>
        </div>
      );
    }

    switch (captureState) {
      case "capturing":
        return (
          <div className="flex items-center justify-center gap-3 text-mono-900">
            <div className="w-6 h-6 rounded-full bg-mono-900 animate-pulse"></div>
            <span className="text-lg font-semibold">
              Capturing Photo {capturedPhotos.length + 1}...
            </span>
          </div>
        );

      case "countdown":
        return (
          <div className="flex items-center justify-center gap-3 text-mono-900">
            <Timer className="w-6 h-6" />
            <span className="text-lg font-semibold">
              Get ready for photo {capturedPhotos.length + 1}!
            </span>
          </div>
        );

      case "preview":
        return (
          <div className="flex items-center justify-center gap-3 text-mono-600">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <span className="text-lg">
              Photo captured! Next one coming up...
            </span>
          </div>
        );

      case "complete":
        return (
          <div className="flex items-center justify-center gap-3 text-green-700">
            <CheckCircle className="w-6 h-6" />
            <span className="text-lg font-semibold">
              All photos captured! Moving to filters...
            </span>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center gap-3 text-mono-600">
            <div className="w-6 h-6 rounded-full bg-mono-300 animate-pulse"></div>
            <span className="text-lg">Processing...</span>
          </div>
        );
    }
  };

  return (
    <div className="h-screen mono-gradient flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-mono-200 bg-white/50 backdrop-blur-sm flex-shrink-0">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-xl font-bold text-mono-900">Photo Session</h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              Webcam
            </Badge>
            <Badge variant="outline" className="text-xs">
              {capturedPhotos.length} of {requiredPhotos} photos
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 min-h-0">
        <div className="max-w-2xl w-full h-full flex flex-col">
          {/* Progress Bar */}
          {sessionStarted && (
            <Card className="glass-card mb-4 flex-shrink-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-mono-700" />
                    <span className="font-semibold text-mono-900 text-sm">
                      Progress
                    </span>
                  </div>
                  <span className="text-xs text-mono-600">
                    {Math.round(progress)}% Complete
                  </span>
                </div>
                <Progress value={progress} className="h-2 mb-1" />
                <div className="text-xs text-mono-600">
                  Photo {Math.min(capturedPhotos.length + 1, requiredPhotos)} of{" "}
                  {requiredPhotos}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Webcam Preview */}
          <Card className="glass-card mb-4 flex-1 min-h-0">
            <CardContent className="p-4 h-full">
              <div className="relative h-full max-w-md mx-auto">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="capture-frame w-full h-full object-cover rounded-lg bg-black"
                  style={{ aspectRatio: "3/4" }} // Maintain 3:4 aspect ratio
                />
                <canvas ref={canvasRef} className="hidden" />

                {(!webcamReady || isWebcamInitInProgress) && !webcamError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                    <div className="text-center text-white">
                      <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                      <p>Starting camera...</p>
                    </div>
                  </div>
                )}

                {renderCaptureOverlay()}
              </div>
            </CardContent>
          </Card>

          {/* Controls */}
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

export default WebcamCapturePhoto;
