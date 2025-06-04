import { PaperType, PhotoModePage, PAPER_TYPE_PHOTO_COUNT } from "@/lib/enums";
import React, { useState, useEffect } from "react";
import path from "path";

interface Gphoto2CapturePhotoProps {
  setPhotos: (photos: File[]) => void;
  setCurrentPage: (page: PhotoModePage) => void;
  paperType: PaperType;
}

const Gphoto2CapturePhoto: React.FC<Gphoto2CapturePhotoProps> = ({
  setPhotos,
  setCurrentPage,
  paperType,
}) => {
  const [capturedPhotos, setCapturedPhotos] = useState<File[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);

  const requiredPhotos = PAPER_TYPE_PHOTO_COUNT[paperType];

  useEffect(() => {
    setPhotos([]);
    setCapturedPhotos([]);
  }, []);

  const startPhotoSession = () => {
    setSessionStarted(true);
    startCountdown(5);
  };

  const startCountdown = (seconds: number) => {
    setCountdown(seconds);

    if (seconds <= 0) {
      setTimeout(capturePhoto, 100);
      return;
    }

    setTimeout(() => {
      startCountdown(seconds - 1);
    }, 1000);
  };

  const capturePhoto = async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    setCountdown(null);

    try {
      const outputPath = path.join(
        require("os").tmpdir(),
        "photobooth-app",
        `photo_${Date.now()}.jpg`
      );

      const result = await window.electronAPI.captureImage(outputPath);
      const fileData = await window.electronAPI.readFile(result);
      const blob = new Blob([fileData], { type: "image/jpeg" });

      const photoFile = new File(
        [blob],
        `photo_${capturedPhotos.length + 1}.jpg`,
        { type: "image/jpeg" }
      );

      const newPhotos = [...capturedPhotos, photoFile];
      setCapturedPhotos(newPhotos);

      console.log(
        `DSLR Photo ${newPhotos.length} captured. Total needed: ${requiredPhotos}`
      );

      if (newPhotos.length >= requiredPhotos) {
        setPhotos(newPhotos);
        setCurrentPage(PhotoModePage.SelectFilterPage);
      } else {
        setTimeout(() => startCountdown(5), 1500);
      }
    } catch (error) {
      console.error("DSLR capture failed:", error);
      alert(
        "Failed to capture photo with DSLR camera. Please check your connection."
      );
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">Capture Photos</h1>
      <p className="mb-2">
        {capturedPhotos.length} of {requiredPhotos} photos captured
      </p>
      <p className="mb-4 text-sm text-gray-600">Using: DSLR Camera</p>

      <div className="relative mb-4">
        <div className="w-96 h-72 bg-black rounded flex items-center justify-center">
          <span className="text-white">DSLR Camera Preview</span>
        </div>

        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded">
            <div className="text-white text-8xl font-bold">{countdown}</div>
          </div>
        )}
      </div>

      {!sessionStarted ? (
        <button
          onClick={startPhotoSession}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg"
        >
          Start Photo Session
        </button>
      ) : (
        <div className="text-center">
          {isCapturing ? (
            <div className="text-xl font-bold">Capturing Photo...</div>
          ) : countdown !== null ? (
            <div className="text-xl">Get Ready!</div>
          ) : (
            <div className="text-xl">Processing...</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Gphoto2CapturePhoto;
