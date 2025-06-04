import { PaperType, PhotoModePage } from "@/lib/enums";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Loader2, AlertCircle } from "lucide-react";
import Gphoto2CapturePhoto from "./Gphoto2CapturePhoto";
import WebcamCapturePhoto from "./WebcamCapturePhoto";

interface CapturePhotoScreenProps {
  setPhotos: (photos: File[]) => void;
  setCurrentPage: (page: PhotoModePage) => void;
  paperType: PaperType;
}

enum CameraType {
  NONE = "none",
  DSLR = "dslr",
  WEBCAM = "webcam",
}

const CapturePhotoScreen: React.FC<CapturePhotoScreenProps> = ({
  setPhotos,
  setCurrentPage,
  paperType,
}) => {
  const [cameraType, setCameraType] = useState<CameraType | null>(null);
  const [isCheckingCamera, setIsCheckingCamera] = useState(true);

  useEffect(() => {
    // Create tmp directory on component mount
    window.electronAPI.createTempFile(new ArrayBuffer(0), "temp").catch(() => {
      // Ignore error if directory already exists
    });

    detectAvailableCamera();
  }, []);

  const detectAvailableCamera = async () => {
    console.log("Detecting available cameras...");

    try {
      // First, try to detect DSLR cameras
      const cameras = await window.electronAPI.getAvailableCameras();
      if (cameras && cameras.length > 0) {
        console.log("DSLR cameras found:", cameras);
        setCameraType(CameraType.DSLR);
        setIsCheckingCamera(false);
        return;
      }
    } catch (error: any) {
      console.log("DSLR cameras not available:", error.message);
    }

    // Fallback to webcam
    try {
      console.log("Checking webcam availability...");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop()); // Stop the test stream
      console.log("Webcam available");
      setCameraType(CameraType.WEBCAM);
    } catch (error) {
      console.error("No cameras available:", error);
      setCameraType(CameraType.NONE);
    }

    setIsCheckingCamera(false);
  };

  if (isCheckingCamera) {
    return (
      <div className="h-screen mono-gradient flex items-center justify-center p-4 overflow-hidden">
        <Card className="glass-card max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-mono-100 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-mono-900 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-mono-900 mb-2">
              Detecting Cameras
            </h2>
            <p className="text-mono-600 text-sm">
              Searching for available camera devices...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (cameraType === CameraType.NONE) {
    return (
      <div className="h-screen mono-gradient flex items-center justify-center p-4 overflow-hidden">
        <Card className="glass-card max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-mono-900 mb-2">
              No Camera Available
            </h2>
            <p className="text-mono-600 mb-4 text-sm">
              Please connect a DSLR camera or ensure your webcam is working
              properly.
            </p>
            <Button
              onClick={detectAvailableCamera}
              className="w-full bg-mono-900 hover:bg-mono-800 text-white"
            >
              <Camera className="w-4 h-4 mr-2" />
              Retry Detection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (cameraType === CameraType.DSLR) {
    return (
      <Gphoto2CapturePhoto
        setPhotos={setPhotos}
        setCurrentPage={setCurrentPage}
        paperType={paperType}
      />
    );
  }

  if (cameraType === CameraType.WEBCAM) {
    return (
      <WebcamCapturePhoto
        setPhotos={setPhotos}
        setCurrentPage={setCurrentPage}
        paperType={paperType}
      />
    );
  }

  return null;
};

export default CapturePhotoScreen;
