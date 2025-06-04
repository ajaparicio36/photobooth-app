import { PaperType, PhotoModePage, PAPER_TYPE_PHOTO_COUNT } from "@/lib/enums";
import React, { useEffect, useState, useRef } from "react";
import path from "path";

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
  const [countdown, setCountdown] = useState<number | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [useWebcam, setUseWebcam] = useState(false); // Track which camera type to use
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const requiredPhotos = PAPER_TYPE_PHOTO_COUNT[paperType];

  useEffect(() => {
    // Create tmp directory on component mount
    window.electronAPI.createTempFile(new ArrayBuffer(0), "temp").catch(() => {
      // Ignore error if directory already exists
    });

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
        setUseWebcam(false);
        return;
      }
    } catch (error: any) {
      console.log("gphoto2 not available, checking webcam");

      // Check if we should fallback to webcam
      if (error?.shouldFallbackToWebcam) {
        setUseWebcam(true);
      }
    }

    // Fallback to webcam
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraAvailable(true);
      setUseWebcam(true);
    } catch (error) {
      console.error("No camera available:", error);
      setCameraAvailable(false);
      setUseWebcam(false);
    }
  };

  const startPhotoSession = () => {
    setSessionStarted(true);
    startCountdown(5); // Initial 5-second countdown
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

    try {
      let photoFile: File;

      if (useWebcam) {
        // Use webcam capture only
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
          throw new Error("Webcam not available");
        }
      } else {
        // Use gphoto2 capture through WSL
        const outputPath = path.join(
          require("os").tmpdir(),
          "photobooth-app",
          `photo_${Date.now()}.jpg`
        );

        try {
          const result = await window.electronAPI.captureImage(outputPath);

          // Read the captured file and convert to File object
          const fileData = await window.electronAPI.readFile(result);
          const blob = new Blob([fileData], { type: "image/jpeg" });
          photoFile = new File(
            [blob],
            `photo_${capturedPhotos.length + 1}.jpg`,
            {
              type: "image/jpeg",
            }
          );
        } catch (gphotoError: any) {
          console.error("gphoto2 capture failed:", gphotoError);

          // If this is a WSL/camera error, switch to webcam permanently
          if (gphotoError?.shouldFallbackToWebcam) {
            console.log(
              "Permanently switching to webcam due to gphoto2 failure"
            );
            setUseWebcam(true);

            // Re-initialize webcam if needed
            if (!videoRef.current?.srcObject) {
              await checkCameraAvailability();
            }

            // Retry with webcam after a delay
            setIsCapturing(false);
            setTimeout(() => {
              capturePhoto(); // Retry immediately with webcam
            }, 500);
            return;
          }

          throw gphotoError;
        }
      }

      const newPhotos = [...capturedPhotos, photoFile];
      setCapturedPhotos(newPhotos);

      if (newPhotos.length >= requiredPhotos) {
        // All photos captured, move to next page
        setPhotos(newPhotos);
        setCurrentPage(PhotoModePage.SelectFilterPage);
      } else {
        // More photos needed, start countdown for next photo
        setTimeout(() => startCountdown(5), 1500); // Use 5 seconds for all photos
      }
    } catch (error) {
      console.error("Failed to capture photo:", error);

      // Only try webcam fallback if we haven't already
      if (!useWebcam) {
        console.log("Attempting webcam fallback...");
        setUseWebcam(true);

        try {
          await checkCameraAvailability();
          // Retry capture with webcam after initialization
          setTimeout(() => {
            setIsCapturing(false);
            setTimeout(() => capturePhoto(), 500);
          }, 1000);
        } catch (webcamError) {
          console.error("Webcam fallback failed:", webcamError);
          setIsCapturing(false);
          alert(
            "Failed to capture photo. Please check your camera connection."
          );
        }
        return;
      }

      // If webcam also fails, show error
      console.error("Both gphoto2 and webcam capture failed");
      setIsCapturing(false);
      alert("Failed to capture photo. Please check your camera connection.");
    } finally {
      // Reset capturing state after each photo
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
      <p className="mb-2">
        {capturedPhotos.length} of {requiredPhotos} photos captured
      </p>
      <p className="mb-4 text-sm text-gray-600">
        Using: {useWebcam ? "Webcam" : "DSLR Camera"}
      </p>

      <div className="relative mb-4">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-96 h-72 bg-black rounded"
          style={{ display: useWebcam ? "block" : "none" }}
        />
        {!useWebcam && (
          <div className="w-96 h-72 bg-black rounded flex items-center justify-center">
            <span className="text-white">DSLR Camera Preview</span>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />

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

export default CapturePhotoScreen;
