import { PaperType, PhotoModePage, PAPER_TYPE_PHOTO_COUNT } from "@/lib/enums";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Camera, Timer, CheckCircle, Loader2 } from "lucide-react";

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
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [displayPhotoCount, setDisplayPhotoCount] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const captureTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const photoIndexRef = useRef<number>(0);
  const photosArrayRef = useRef<File[]>([]);

  const requiredPhotos = PAPER_TYPE_PHOTO_COUNT[paperType];

  useEffect(() => {
    setPhotos([]);
    setCapturedPhotos([]);
    setIsSessionComplete(false);
    photoIndexRef.current = 0;
    photosArrayRef.current = [];
    setDisplayPhotoCount(0);
    initializeWebcam();

    return () => {
      // Cleanup on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      clearAllTimers();
    };
  }, []);

  // Effect to handle session completion
  useEffect(() => {
    if (isSessionComplete && photosArrayRef.current.length >= requiredPhotos) {
      // Update parent with all photos
      setPhotos(photosArrayRef.current);

      // Navigate to next page after a brief delay
      const navigationTimer = setTimeout(() => {
        setCurrentPage(PhotoModePage.SelectFilterPage);
      }, 1000);

      return () => clearTimeout(navigationTimer);
    }
  }, [isSessionComplete, requiredPhotos, setPhotos, setCurrentPage]);

  const clearAllTimers = () => {
    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (captureTimeoutRef.current) {
      clearTimeout(captureTimeoutRef.current);
      captureTimeoutRef.current = null;
    }
  };

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
    photoIndexRef.current = 0;
    photosArrayRef.current = [];
    setCapturedPhotos([]);
    setDisplayPhotoCount(0);
    setIsSessionComplete(false);
    startCountdown(5);
  };

  const startCountdown = (seconds: number) => {
    // Clear any existing timers
    clearAllTimers();

    setCountdown(seconds);

    if (seconds <= 0) {
      captureTimeoutRef.current = setTimeout(() => {
        capturePhoto();
      }, 100);
      return;
    }

    countdownTimerRef.current = setTimeout(() => {
      startCountdown(seconds - 1);
    }, 1000);
  };

  const capturePhoto = async () => {
    if (isCapturing || !videoRef.current || !canvasRef.current) {
      console.log("Capture blocked - already capturing or refs not ready");
      return;
    }

    // Check if we already have enough photos using ref
    if (photoIndexRef.current >= requiredPhotos) {
      console.log("Already have enough photos, stopping capture");
      return;
    }

    setIsCapturing(true);
    setCountdown(null);
    clearAllTimers();

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

      const photoFile = new File(
        [blob],
        `photo_${photoIndexRef.current + 1}.jpg`,
        {
          type: "image/jpeg",
        }
      );

      // Update refs immediately
      photosArrayRef.current = [...photosArrayRef.current, photoFile];
      photoIndexRef.current = photoIndexRef.current + 1;

      // Update display states
      setCapturedPhotos(photosArrayRef.current);
      setDisplayPhotoCount(photoIndexRef.current);

      console.log(
        `Webcam Photo ${photosArrayRef.current.length} captured. Total needed: ${requiredPhotos}`
      );
      console.log(
        `Photo index is now: ${photoIndexRef.current} of ${requiredPhotos}`
      );

      // Check if we have all required photos using the updated ref
      if (photoIndexRef.current >= requiredPhotos) {
        // All photos captured - mark session as complete
        console.log("All photos captured, completing session");
        setIsSessionComplete(true);
        clearAllTimers();
      } else {
        // More photos needed, start countdown for next photo after delay
        console.log(
          `Need ${requiredPhotos - photoIndexRef.current} more photos`
        );
        captureTimeoutRef.current = setTimeout(() => {
          // Use ref value for accurate check
          if (photoIndexRef.current < requiredPhotos && !isCapturing) {
            console.log(
              `Starting countdown for photo ${photoIndexRef.current + 1}`
            );
            startCountdown(5);
          } else {
            console.log(
              "Skipping countdown - already have enough photos or still capturing"
            );
          }
        }, 2000);
      }
    } catch (error) {
      console.error("Webcam capture failed:", error);
      alert("Failed to capture photo with webcam.");
    } finally {
      setIsCapturing(false);
    }
  };

  const progress = (displayPhotoCount / requiredPhotos) * 100;

  if (!webcamReady) {
    return (
      <div className="min-h-screen mono-gradient flex items-center justify-center p-6">
        <Card className="glass-card max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-mono-100 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-mono-900 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-mono-900 mb-3">
              Initializing Webcam
            </h2>
            <p className="text-mono-600 mb-6">
              Please allow camera access if prompted
            </p>
            <Button
              onClick={() => {
                console.log("Manual retry clicked");
                setWebcamReady(false);
                initializeWebcam();
              }}
              className="w-full bg-mono-900 hover:bg-mono-800 text-white"
            >
              <Camera className="w-4 h-4 mr-2" />
              Retry Webcam
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasValidStream =
    streamRef.current && streamRef.current.getTracks().length > 0;

  if (!hasValidStream) {
    return (
      <div className="min-h-screen mono-gradient flex items-center justify-center p-6">
        <Card className="glass-card max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
              <Camera className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-mono-900 mb-3">
              Webcam Not Available
            </h2>
            <p className="text-mono-600 mb-6">
              Failed to access webcam. Please check your camera permissions.
            </p>
            <Button
              onClick={() => {
                setWebcamReady(false);
                initializeWebcam();
              }}
              className="w-full bg-mono-900 hover:bg-mono-800 text-white"
            >
              <Camera className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              {displayPhotoCount} of {requiredPhotos} photos
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 min-h-0">
        <div className="max-w-2xl w-full h-full flex flex-col">
          {/* Progress Bar */}
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
                Photo {Math.min(displayPhotoCount + 1, requiredPhotos)} of{" "}
                {requiredPhotos}
              </div>
            </CardContent>
          </Card>

          {/* Webcam Preview */}
          <Card className="glass-card mb-4 flex-1 min-h-0">
            <CardContent className="p-4 h-full">
              <div className="relative h-full">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="capture-frame w-full h-full object-cover rounded-lg"
                />
                <canvas ref={canvasRef} className="hidden" />

                {countdown !== null && (
                  <div className="countdown-overlay">
                    <div className="text-center animate-pulse">
                      <div className="text-6xl font-bold text-white mb-2">
                        {countdown}
                      </div>
                      <div className="text-lg text-white/80">Get Ready!</div>
                    </div>
                  </div>
                )}

                {isCapturing && (
                  <div className="countdown-overlay">
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-white/20 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-white animate-pulse"></div>
                      </div>
                      <div className="text-lg text-white font-semibold">
                        Capturing...
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Controls */}
          <Card className="glass-card flex-shrink-0">
            <CardContent className="p-4 text-center">
              {!sessionStarted ? (
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-mono-900 mb-1">
                      Ready to Start?
                    </h3>
                    <p className="text-mono-600 text-sm">
                      We'll capture {requiredPhotos} photos with a 5-second
                      countdown between each shot
                    </p>
                  </div>
                  <Button
                    onClick={startPhotoSession}
                    size="lg"
                    className="bg-mono-900 hover:bg-mono-800 text-white px-6 py-3"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Start Photo Session
                  </Button>
                </div>
              ) : (
                <div>
                  {isCapturing ? (
                    <div className="flex items-center justify-center gap-3 text-mono-900">
                      <div className="w-6 h-6 rounded-full bg-mono-900 animate-pulse"></div>
                      <span className="text-lg font-semibold">
                        Capturing Photo{" "}
                        {Math.min(displayPhotoCount + 1, requiredPhotos)}...
                      </span>
                    </div>
                  ) : countdown !== null ? (
                    <div className="flex items-center justify-center gap-3 text-mono-900">
                      <Timer className="w-6 h-6" />
                      <span className="text-lg font-semibold">
                        Get ready for photo{" "}
                        {Math.min(displayPhotoCount + 1, requiredPhotos)}!
                      </span>
                    </div>
                  ) : isSessionComplete ? (
                    <div className="flex items-center justify-center gap-3 text-green-700">
                      <CheckCircle className="w-6 h-6" />
                      <span className="text-lg font-semibold">
                        All photos captured! Moving to filters...
                      </span>
                    </div>
                  ) : displayPhotoCount < requiredPhotos ? (
                    <div className="flex items-center justify-center gap-3 text-mono-600">
                      <div className="w-6 h-6 rounded-full bg-mono-300 animate-pulse"></div>
                      <span className="text-lg">
                        Processing... Next photo coming up!
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3 text-green-700">
                      <CheckCircle className="w-6 h-6" />
                      <span className="text-lg font-semibold">
                        All photos captured! Moving to filters...
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WebcamCapturePhoto;
