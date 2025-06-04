import { PaperType, PhotoModePage } from "@/lib/enums";
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Monitor, AlertTriangle, Loader2 } from "lucide-react";
import Gphoto2CapturePhoto from "./Gphoto2CapturePhoto";
import WebcamCapturePhoto from "./WebcamCapturePhoto";

interface CapturePhotoScreenProps {
  paperType: PaperType;
  setPhotos: (photos: File[]) => void;
  setCurrentPage: (page: PhotoModePage) => void;
}

const CapturePhotoScreen: React.FC<CapturePhotoScreenProps> = ({
  paperType,
  setPhotos,
  setCurrentPage,
}) => {
  const [cameraMode, setCameraMode] = useState<"checking" | "dslr" | "webcam">(
    "checking"
  );
  const [checkingError, setCheckingError] = useState<string | null>(null);
  const [userChoice, setUserChoice] = useState<"dslr" | "webcam" | null>(null);

  useEffect(() => {
    checkCameraAvailability();
  }, []);

  const checkCameraAvailability = async () => {
    console.log("Checking camera availability...");

    try {
      // Check if electron API is available
      if (!window.electronAPI) {
        console.log("Electron API not available, checking webcam...");
        await checkWebcamAvailability();
        return;
      }

      // Check DSLR camera health
      const dslrAvailable = await window.electronAPI.checkCameraHealth();
      console.log("DSLR available:", dslrAvailable);

      if (dslrAvailable) {
        // Try to get available cameras to double-check
        try {
          const cameras = await window.electronAPI.getAvailableCameras();
          console.log("Available DSLR cameras:", cameras);

          if (cameras && cameras.length > 0) {
            setCameraMode("dslr");
            return;
          }
        } catch (cameraError: any) {
          console.log("DSLR camera check failed:", cameraError);

          // Check if we should fallback to webcam
          if (cameraError.shouldFallbackToWebcam) {
            console.log("Falling back to webcam due to DSLR error");
            await checkWebcamAvailability();
            return;
          }
        }
      }

      // If DSLR is not available, check webcam
      console.log("DSLR not available, checking webcam...");
      await checkWebcamAvailability();
    } catch (error: any) {
      console.error("Camera availability check failed:", error);

      // Try webcam as fallback
      console.log("Falling back to webcam after error");
      await checkWebcamAvailability();
    }
  };

  const checkWebcamAvailability = async () => {
    try {
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCheckingError(
          "Camera access not supported in this browser. Please use a modern browser with camera support."
        );
        return;
      }

      // Actually test camera access
      console.log("Testing webcam access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      // Stop the test stream immediately
      stream.getTracks().forEach((track) => track.stop());

      console.log("Webcam access successful");
      setCameraMode("webcam");
    } catch (webcamError: any) {
      console.error("Webcam access failed:", webcamError);

      let errorMessage = "Failed to access webcam.";

      if (webcamError.name === "NotAllowedError") {
        errorMessage =
          "Camera access denied. Please allow camera permissions in your browser settings and refresh the page.";
      } else if (webcamError.name === "NotFoundError") {
        errorMessage =
          "No camera found. Please connect a webcam and try again.";
      } else if (webcamError.name === "NotReadableError") {
        errorMessage =
          "Camera is being used by another application. Please close other camera apps and try again.";
      } else if (webcamError.name === "OverconstrainedError") {
        errorMessage = "Camera does not meet the required specifications.";
      }

      setCheckingError(errorMessage);
    }
  };

  // Show loading while checking
  if (cameraMode === "checking") {
    return (
      <div className="min-h-screen mono-gradient flex items-center justify-center p-6">
        <Card className="glass-card max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-mono-100 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-mono-900 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-mono-900 mb-3">
              Detecting Cameras
            </h2>
            <p className="text-mono-600 mb-4">
              Checking for available DSLR and webcam options...
            </p>
            <div className="text-xs text-mono-500">
              This may take a few moments
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error if no cameras available
  if (checkingError) {
    return (
      <div className="min-h-screen mono-gradient flex items-center justify-center p-6">
        <Card className="glass-card max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-mono-900 mb-3">
              No Cameras Available
            </h2>
            <p className="text-mono-600 mb-6 text-sm leading-relaxed">
              {checkingError}
            </p>
            <div className="space-y-3">
              <Button
                onClick={checkCameraAvailability}
                className="w-full bg-mono-900 hover:bg-mono-800 text-white"
              >
                <Camera className="w-4 h-4 mr-2" />
                Check Again
              </Button>
              <Button
                onClick={() => setCurrentPage(PhotoModePage.ChoosePaperType)}
                variant="outline"
                className="w-full"
              >
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user hasn't chosen and both options might be available, show choice
  if (!userChoice && window.electronAPI) {
    return (
      <div className="min-h-screen mono-gradient flex items-center justify-center p-6">
        <Card className="glass-card max-w-lg w-full">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-mono-900 mb-3">
                Choose Camera Type
              </h2>
              <p className="text-mono-600">
                Select which camera you'd like to use for your photo session
              </p>
            </div>

            <div className="space-y-4">
              {/* DSLR Option */}
              <Button
                onClick={() => {
                  setUserChoice("dslr");
                  setCameraMode("dslr");
                }}
                variant="outline"
                className="w-full p-6 h-auto flex items-center justify-start gap-4 hover:bg-mono-50"
              >
                <div className="w-12 h-12 rounded-full bg-mono-100 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-mono-700" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-mono-900">DSLR Camera</div>
                  <div className="text-sm text-mono-600">
                    Professional quality photos
                  </div>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    Recommended
                  </Badge>
                </div>
              </Button>

              {/* Webcam Option */}
              <Button
                onClick={() => {
                  setUserChoice("webcam");
                  setCameraMode("webcam");
                }}
                variant="outline"
                className="w-full p-6 h-auto flex items-center justify-start gap-4 hover:bg-mono-50"
              >
                <div className="w-12 h-12 rounded-full bg-mono-100 flex items-center justify-center">
                  <Monitor className="w-6 h-6 text-mono-700" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-mono-900">Webcam</div>
                  <div className="text-sm text-mono-600">
                    Quick and convenient
                  </div>
                </div>
              </Button>
            </div>

            <div className="mt-6 pt-4 border-t border-mono-200">
              <Button
                onClick={() => setCurrentPage(PhotoModePage.ChoosePaperType)}
                variant="ghost"
                className="w-full text-mono-600"
              >
                ← Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render the appropriate camera component
  if (cameraMode === "dslr" || userChoice === "dslr") {
    return (
      <Gphoto2CapturePhoto
        paperType={paperType}
        setPhotos={setPhotos}
        setCurrentPage={setCurrentPage}
      />
    );
  }

  return (
    <WebcamCapturePhoto
      paperType={paperType}
      setPhotos={setPhotos}
      setCurrentPage={setCurrentPage}
    />
  );
};

export default CapturePhotoScreen;
