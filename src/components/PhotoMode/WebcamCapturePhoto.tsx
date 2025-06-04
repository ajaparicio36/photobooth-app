import { PaperType, PhotoModePage, PAPER_TYPE_PHOTO_COUNT } from "@/lib/enums";
import React, { useState, useRef, useEffect } from "react";

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
  const [capturedPhotos, setCapturedPhotos] = useState<File[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [webcamReady, setWebcamReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const requiredPhotos = PAPER_TYPE_PHOTO_COUNT[paperType];

  useEffect(() => {
    setPhotos([]);
    setCapturedPhotos([]);
    initializeWebcam();

    return () => {
      // Cleanup on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const initializeWebcam = async () => {
    try {
      console.log("Requesting webcam access...");

      // Simple constraints first
      const constraints = {
        video: {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("Webcam stream obtained:", stream);
      console.log("Stream tracks:", stream.getTracks());

      streamRef.current = stream;

      if (videoRef.current) {
        console.log("Setting up video element...");
        console.log(
          "Video element readyState before:",
          videoRef.current.readyState
        );

        videoRef.current.srcObject = stream;

        // Set video properties
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        videoRef.current.autoplay = true;

        console.log(
          "Video element readyState after srcObject:",
          videoRef.current.readyState
        );

        // Simple approach: just wait a bit and set ready
        setTimeout(() => {
          console.log("Timeout reached, checking video state...");
          if (videoRef.current) {
            console.log("Video readyState:", videoRef.current.readyState);
            console.log("Video videoWidth:", videoRef.current.videoWidth);
            console.log("Video videoHeight:", videoRef.current.videoHeight);
            console.log("Video paused:", videoRef.current.paused);
            console.log("Video ended:", videoRef.current.ended);

            // Try to play manually
            videoRef.current
              .play()
              .then(() => {
                console.log("Manual play successful");
                setWebcamReady(true);
              })
              .catch((playError) => {
                console.log("Manual play failed:", playError);
                // Set ready anyway
                setWebcamReady(true);
              });
          }
        }, 2000);

        // Also try the event-based approach
        const handleVideoReady = async () => {
          console.log("Video ready event triggered");
          if (!webcamReady) {
            try {
              if (videoRef.current) {
                await videoRef.current.play();
                console.log("Video playing successfully via event");
              }
            } catch (playError) {
              console.log("Play failed but continuing:", playError);
            }
            setWebcamReady(true);
          }
        };

        // Add all possible event listeners
        videoRef.current.addEventListener("loadstart", () =>
          console.log("Video loadstart")
        );
        videoRef.current.addEventListener("loadedmetadata", () => {
          console.log("Video loadedmetadata");
          handleVideoReady();
        });
        videoRef.current.addEventListener("loadeddata", () => {
          console.log("Video loadeddata");
          if (!webcamReady) handleVideoReady();
        });
        videoRef.current.addEventListener("canplay", () => {
          console.log("Video canplay");
          if (!webcamReady) handleVideoReady();
        });
        videoRef.current.addEventListener("canplaythrough", () => {
          console.log("Video canplaythrough");
          if (!webcamReady) handleVideoReady();
        });
        videoRef.current.addEventListener("playing", () => {
          console.log("Video playing event");
          if (!webcamReady) setWebcamReady(true);
        });

        videoRef.current.onerror = (error) => {
          console.error("Video element error:", error);
          setWebcamReady(true); // Set ready even on error
        };

        // Immediate check if video is already ready
        if (videoRef.current.readyState >= 1) {
          console.log(
            "Video already has metadata, readyState:",
            videoRef.current.readyState
          );
          handleVideoReady();
        }
      } else {
        console.error("videoRef.current is null!");
        setWebcamReady(true);
      }
    } catch (error) {
      console.error("Failed to initialize webcam:", error);

      // More specific error handling
      if (error instanceof DOMException) {
        console.log("DOMException name:", error.name);
        console.log("DOMException message:", error.message);

        switch (error.name) {
          case "NotAllowedError":
            alert(
              "Camera access denied. Please allow camera permissions and try again."
            );
            break;
          case "NotFoundError":
            alert("No camera found. Please connect a camera and try again.");
            break;
          case "NotReadableError":
            alert(
              "Camera is being used by another application. Please close other camera apps and try again."
            );
            break;
          case "OverconstrainedError":
            console.log(
              "Constraints too restrictive, trying basic constraints..."
            );
            // Try with minimal constraints
            try {
              const basicStream = await navigator.mediaDevices.getUserMedia({
                video: true,
              });
              streamRef.current = basicStream;
              if (videoRef.current) {
                videoRef.current.srcObject = basicStream;
                await videoRef.current.play();
              }
              setWebcamReady(true);
              return;
            } catch (basicError) {
              alert("Failed to access camera with basic settings.");
            }
            break;
          default:
            alert(`Camera error: ${error.message}`);
        }
      } else {
        alert("Failed to access webcam. Please check your camera permissions.");
      }

      // Always set ready to prevent infinite loading
      setWebcamReady(true);
    }
  };

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
    if (isCapturing || !videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    setCountdown(null);

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx?.drawImage(video, 0, 0);

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.9);
      });

      // Use functional state update to ensure we have the latest state
      setCapturedPhotos((prevPhotos) => {
        const photoFile = new File(
          [blob],
          `photo_${prevPhotos.length + 1}.jpg`,
          { type: "image/jpeg" }
        );

        const newPhotos = [...prevPhotos, photoFile];

        console.log(
          `Webcam Photo ${newPhotos.length} captured. Total needed: ${requiredPhotos}`
        );
        console.log("Previous photos count:", prevPhotos.length);
        console.log("New photos count:", newPhotos.length);

        // Check if we have all required photos
        if (newPhotos.length >= requiredPhotos) {
          // All photos captured, move to next page
          setPhotos(newPhotos);
          setCurrentPage(PhotoModePage.SelectFilterPage);
        } else {
          // More photos needed, start countdown for next photo
          setTimeout(() => startCountdown(5), 1500);
        }

        return newPhotos;
      });
    } catch (error) {
      console.error("Webcam capture failed:", error);
      alert("Failed to capture photo with webcam.");
    } finally {
      setIsCapturing(false);
    }
  };

  if (!webcamReady) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <div className="text-xl mb-4">Initializing webcam...</div>
        <div className="text-sm text-gray-600 mb-4">
          Please allow camera access if prompted
        </div>
        <div className="text-xs text-gray-500 mb-4">
          Check browser console for detailed logs
        </div>
        <button
          onClick={() => {
            console.log("Manual retry clicked");
            setWebcamReady(false);
            initializeWebcam();
          }}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Retry Webcam
        </button>
      </div>
    );
  }

  // Check if we have a valid stream
  const hasValidStream =
    streamRef.current && streamRef.current.getTracks().length > 0;

  if (!hasValidStream) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <h1 className="text-2xl font-bold mb-4">Webcam Not Available</h1>
        <p className="mb-4 text-center">
          Failed to access webcam. Please check your camera permissions.
        </p>
        <button
          onClick={() => {
            setWebcamReady(false);
            initializeWebcam();
          }}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">Capture Photos</h1>
      <p className="mb-2">
        {capturedPhotos.length} of {requiredPhotos} photos captured
      </p>
      <p className="mb-4 text-sm text-gray-600">Using: Webcam</p>

      <div className="relative mb-4">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-96 h-72 bg-black rounded"
        />
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

export default WebcamCapturePhoto;
