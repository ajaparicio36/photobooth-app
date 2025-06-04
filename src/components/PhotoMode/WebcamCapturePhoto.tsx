import { PaperType, PhotoModePage, PAPER_TYPE_PHOTO_COUNT } from "@/lib/enums";
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useLayoutEffect,
} from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Camera, Timer, CheckCircle, Loader2, AlertCircle } from "lucide-react";

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
  const [webcamError, setWebcamError] = useState<string | null>(null);
  // isInitializing now refers to the component's general loading state
  const [isInitializing, setIsInitializing] = useState(true);
  const [isWebcamInitInProgress, setIsWebcamInitInProgress] = useState(false);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [displayPhotoCount, setDisplayPhotoCount] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const captureTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const photoIndexRef = useRef<number>(0);
  const photosArrayRef = useRef<File[]>([]);
  const isInitializedRef = useRef<boolean>(false); // Tracks if an initialization attempt has been made / succeeded

  const requiredPhotos = PAPER_TYPE_PHOTO_COUNT[paperType];

  // Cleanup function
  const cleanup = useCallback(() => {
    console.log("Cleaning up webcam resources...");

    // Clear all timers
    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (captureTimeoutRef.current) {
      clearTimeout(captureTimeoutRef.current);
      captureTimeoutRef.current = null;
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        console.log("Stopping track:", track.kind, track.label);
        track.stop();
      });
      streamRef.current = null;
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Simplified webcam initialization - back to what worked
  const initializeWebcam = useCallback(async () => {
    if (isInitializedRef.current && webcamReady) {
      console.log("Webcam already initialized and ready.");
      return;
    }
    // Prevent re-entry if an attempt is ongoing or just completed successfully
    if (isInitializedRef.current && !webcamError) {
      console.log(
        "Initialization attempt already made/successful and no error."
      );
      return;
    }

    console.log("Attempting to initialize webcam...");
    isInitializedRef.current = true; // Mark that an attempt is starting
    setIsWebcamInitInProgress(true);
    setWebcamError(null);
    // setWebcamReady(false); // Keep existing ready state until success/failure

    if (!videoRef.current) {
      console.error(
        "initializeWebcam: videoRef.current is null. Cannot proceed."
      );
      setWebcamError(
        "Camera preview element not found. Please refresh or try again."
      );
      setIsWebcamInitInProgress(false);
      isInitializedRef.current = false; // Reset, so retry is possible
      return;
    }

    try {
      // Clean up any existing stream first
      cleanup();

      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera access not supported in this browser");
      }

      console.log("Requesting webcam access...");

      // Simple constraints first
      const constraints = {
        video: {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
        },
      };

      let stream: MediaStream;

      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (error) {
        console.log("Detailed constraints failed, trying basic:", error);
        // Fallback to basic constraints
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      console.log("Webcam stream obtained:", stream);
      streamRef.current = stream;

      if (!videoRef.current) {
        // Re-check after await
        throw new Error("Video element became null during stream acquisition.");
      }
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;

      // Wait for video to be ready and play
      await new Promise<void>((resolve, reject) => {
        if (!videoRef.current) {
          reject(new Error("Video element became null before play."));
          return;
        }
        const currentVideoEl = videoRef.current;
        const onCanPlay = () => {
          currentVideoEl
            .play()
            .then(() => {
              console.log("Video playing successfully via event");
              resolve();
            })
            .catch((err) => {
              console.error("Error playing video:", err);
              reject(err);
            });
          // Clean up event listeners
          currentVideoEl.removeEventListener("canplay", onCanPlay);
          currentVideoEl.removeEventListener("error", onError);
        };
        const onError = (e: Event) => {
          console.error("Video element error during loading:", e);
          reject(new Error("Video element error."));
          // Clean up event listeners
          currentVideoEl.removeEventListener("canplay", onCanPlay);
          currentVideoEl.removeEventListener("error", onError);
        };

        currentVideoEl.addEventListener("canplay", onCanPlay);
        currentVideoEl.addEventListener("error", onError);

        // Timeout for safety
        setTimeout(() => {
          currentVideoEl.removeEventListener("canplay", onCanPlay);
          currentVideoEl.removeEventListener("error", onError);
          reject(new Error("Timeout waiting for video to be playable."));
        }, 5000); // 5 seconds timeout

        // If video is already playable (e.g. srcObject set quickly)
        if (currentVideoEl.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
          console.log("Video already playable, attempting to play.");
          onCanPlay();
        }
      });

      console.log("Webcam initialized and video playing.");
      setWebcamReady(true);
      setWebcamError(null);
      // isInitializedRef.current remains true (successful attempt)
    } catch (error: any) {
      console.error("Failed to initialize webcam:", error);
      setWebcamError(error.message || "Failed to access camera.");
      setWebcamReady(false);
      isInitializedRef.current = false; // Allow retry on error
      cleanup(); // Ensure cleanup on failure
    } finally {
      setIsWebcamInitInProgress(false);
    }
  }, [cleanup]);

  // Effect for one-time setup and cleanup on unmount
  useEffect(() => {
    console.log(
      "WebcamCapturePhoto mounted: resetting states for main lifecycle."
    );
    setPhotos([]);
    setCapturedPhotos([]);
    setIsCapturing(false);
    setCountdown(null);
    setSessionStarted(false);
    setWebcamReady(false);
    setWebcamError(null);
    setIsInitializing(true); // Start in a general loading state for the component
    setIsWebcamInitInProgress(false);
    setIsSessionComplete(false);
    setDisplayPhotoCount(0);

    photoIndexRef.current = 0;
    photosArrayRef.current = [];
    isInitializedRef.current = false; // Crucial reset

    // Transition out of the general loading state, allowing UI with video tag to render
    const initialLoadTimer = setTimeout(() => {
      setIsInitializing(false);
    }, 200); // Delay for DOM readiness

    return () => {
      console.log("WebcamCapturePhoto unmounting: cleaning up.");
      clearTimeout(initialLoadTimer);
      clearAllTimers();
      cleanup();
      isInitializedRef.current = false;
    };
  }, [setPhotos, cleanup]);

  // Effect to initialize webcam once videoRef is available and component is not in initial loading
  useLayoutEffect(() => {
    if (
      !isInitializing &&
      !webcamError &&
      videoRef.current &&
      !isInitializedRef.current &&
      !isWebcamInitInProgress
    ) {
      console.log("useLayoutEffect: Conditions met, calling initializeWebcam.");
      initializeWebcam();
    } else {
      if (isInitializing)
        console.log(
          "useLayoutEffect: Skipping webcam init, component is still in general loading."
        );
      if (webcamError)
        console.log(
          "useLayoutEffect: Skipping webcam init, webcamError exists:",
          webcamError
        );
      if (!videoRef.current)
        console.log(
          "useLayoutEffect: Skipping webcam init, videoRef is not current."
        );
      if (isInitializedRef.current)
        console.log(
          "useLayoutEffect: Skipping webcam init, an attempt was already made/is successful."
        );
      if (isWebcamInitInProgress)
        console.log(
          "useLayoutEffect: Skipping webcam init, webcam initialization is already in progress."
        );
    }
  }, [isInitializing, webcamError, initializeWebcam, isWebcamInitInProgress]);

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

    if (!webcamReady) {
      console.warn("Cannot start countdown, webcam not ready.");
      setWebcamError("Webcam is not ready. Please try again.");
      return;
    }

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
    if (
      isCapturing ||
      !videoRef.current ||
      !canvasRef.current ||
      !webcamReady
    ) {
      console.log(
        "Capture blocked - already capturing, refs not ready, or webcam not ready"
      );
      if (!webcamReady)
        setWebcamError("Cannot capture photo, webcam is not ready.");
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
                onClick={() => {
                  console.log("Try Again clicked.");
                  setWebcamError(null); // Clear the error
                  setIsWebcamInitInProgress(false); // Reset progress flag
                  isInitializedRef.current = false; // Signal that we need to re-initialize
                  // State updates will trigger a re-render.
                  // useLayoutEffect will then run and attempt to initialize the webcam
                  // if conditions (like videoRef.current being available) are met.
                }}
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

  // Main UI - Renders if not in general loading and no critical error
  // Video element is always part of this structure if we reach here.
  // Webcam readiness (webcamReady) determines interactivity.
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
                  Photo {Math.min(displayPhotoCount + 1, requiredPhotos)} of{" "}
                  {requiredPhotos}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Webcam Preview - Simplified */}
          <Card className="glass-card mb-4 flex-1 min-h-0">
            <CardContent className="p-4 h-full">
              <div className="relative h-full">
                <video
                  ref={videoRef}
                  // autoPlay // Programmatic play in initializeWebcam
                  playsInline
                  muted
                  className="capture-frame w-full h-full object-cover rounded-lg bg-black"
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

                {webcamReady && countdown !== null && (
                  <div className="countdown-overlay">
                    <div className="text-center animate-pulse">
                      <div className="text-6xl font-bold text-white mb-2">
                        {countdown}
                      </div>
                      <div className="text-lg text-white/80">Get Ready!</div>
                    </div>
                  </div>
                )}

                {webcamReady && isCapturing && (
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
                    disabled={
                      !webcamReady || isCapturing || isWebcamInitInProgress
                    }
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
