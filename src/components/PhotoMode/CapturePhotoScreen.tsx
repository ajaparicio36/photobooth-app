import { PaperType, PhotoModePage } from "@/lib/enums";
import React, { useEffect, useState } from "react";
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
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <div className="text-xl">Detecting cameras...</div>
      </div>
    );
  }

  if (cameraType === CameraType.NONE) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <h1 className="text-2xl font-bold mb-4">No Camera Available</h1>
        <p className="mb-4 text-center">
          Please connect a DSLR camera or ensure your webcam is working.
        </p>
        <button
          onClick={detectAvailableCamera}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Retry Detection
        </button>
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
