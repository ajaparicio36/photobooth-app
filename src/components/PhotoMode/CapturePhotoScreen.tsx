import { PaperType, PhotoModePage, PAPER_TYPE_PHOTO_COUNT } from "@/lib/enums";
import React, { useEffect, useState, useRef } from "react";

interface CapturePhotoScreenProps {
  setPhotos: (photos: File[]) => void;
  setCurrentPage: (page: PhotoModePage) => void;
  paperType: PaperType;
}

const CapturePhotoScreen: React.FC<CapturePhotoScreenProps> = ({
  setPhotos,
  setCurrentPage,
  paperType,
}) => {
  const [capturedPhotos, setCapturedPhotos] = useState<File[]>([]);
  const [cameraAvailable, setCameraAvailable] = useState<boolean | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const requiredPhotos = PAPER_TYPE_PHOTO_COUNT[paperType];

  useEffect(() => {
    setPhotos([]);
    setCapturedPhotos([]);
    checkCameraAvailability();
  }, []);

  const checkCameraAvailability = async () => {
    try {
      // Check for gphoto2 cameras first
      const cameras = await window.electronAPI.getAvailableCameras();
      if (cameras && cameras.length > 0) {
        setCameraAvailable(true);
        return;
      }
    } catch (error) {
      console.log("gphoto2 not available, checking webcam");
    }

    // Fallback to webcam
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraAvailable(true);
    } catch (error) {
      console.error("No camera available:", error);
      setCameraAvailable(false);
    }
  };

  const capturePhoto = async () => {
    if (isCapturing) return;
    setIsCapturing(true);

    try {
      let photoFile: File;

      // Try gphoto2 first
      try {
        const outputPath = `/tmp/photo_${Date.now()}.jpg`;
        const result = await window.electronAPI.captureImage(outputPath);

        // Read the captured file and convert to File object
        const fileData = await window.electronAPI.readFile(outputPath);
        const blob = new Blob([fileData], { type: "image/jpeg" });
        photoFile = new File([blob], `photo_${capturedPhotos.length + 1}.jpg`, {
          type: "image/jpeg",
        });
      } catch (error) {
        // Fallback to webcam capture
        if (videoRef.current && canvasRef.current) {
          const canvas = canvasRef.current;
          const video = videoRef.current;
          const ctx = canvas.getContext("2d");

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx?.drawImage(video, 0, 0);

          const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => resolve(blob!), "image/jpeg");
          });

          photoFile = new File(
            [blob],
            `photo_${capturedPhotos.length + 1}.jpg`,
            {
              type: "image/jpeg",
            }
          );
        } else {
          throw new Error("No capture method available");
        }
      }

      const newPhotos = [...capturedPhotos, photoFile];
      setCapturedPhotos(newPhotos);

      if (newPhotos.length >= requiredPhotos) {
        setPhotos(newPhotos);
        setCurrentPage(PhotoModePage.SelectFilterPage);
      }
    } catch (error) {
      console.error("Failed to capture photo:", error);
    } finally {
      setIsCapturing(false);
    }
  };

  if (cameraAvailable === null) {
    return <div>Checking camera availability...</div>;
  }

  if (cameraAvailable === false) {
    return <div>No camera available. Please connect a camera.</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">Capture Photos</h1>
      <p className="mb-4">
        {capturedPhotos.length} of {requiredPhotos} photos captured
      </p>

      <div className="relative mb-4">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-96 h-72 bg-black rounded"
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <button
        onClick={capturePhoto}
        disabled={isCapturing}
        className="bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-4 px-8 rounded-lg"
      >
        {isCapturing ? "Capturing..." : "Take Photo"}
      </button>
    </div>
  );
};

export default CapturePhotoScreen;
