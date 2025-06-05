import { useState, useRef, useCallback, useLayoutEffect } from "react";

export const useWebcam = () => {
  const [webcamReady, setWebcamReady] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isWebcamInitInProgress, setIsWebcamInitInProgress] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isInitializedRef = useRef<boolean>(false);

  const cleanup = useCallback(() => {
    console.log("Cleaning up webcam resources...");

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        console.log("Stopping track:", track.kind, track.label);
        track.stop();
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const initializeWebcam = useCallback(async () => {
    if (isInitializedRef.current && webcamReady) {
      console.log("Webcam already initialized and ready.");
      return;
    }

    if (isInitializedRef.current && !webcamError) {
      console.log(
        "Initialization attempt already made/successful and no error."
      );
      return;
    }

    console.log("Attempting to initialize webcam...");
    isInitializedRef.current = true;
    setIsWebcamInitInProgress(true);
    setWebcamError(null);

    if (!videoRef.current) {
      console.error(
        "initializeWebcam: videoRef.current is null. Cannot proceed."
      );
      setWebcamError(
        "Camera preview element not found. Please refresh or try again."
      );
      setIsWebcamInitInProgress(false);
      isInitializedRef.current = false;
      return;
    }

    try {
      cleanup();

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera access not supported in this browser");
      }

      console.log("Requesting webcam access...");

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
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      console.log("Webcam stream obtained:", stream);
      streamRef.current = stream;

      if (!videoRef.current) {
        throw new Error("Video element became null during stream acquisition.");
      }

      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;

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
          currentVideoEl.removeEventListener("canplay", onCanPlay);
          currentVideoEl.removeEventListener("error", onError);
        };

        const onError = (e: Event) => {
          console.error("Video element error during loading:", e);
          reject(new Error("Video element error."));
          currentVideoEl.removeEventListener("canplay", onCanPlay);
          currentVideoEl.removeEventListener("error", onError);
        };

        currentVideoEl.addEventListener("canplay", onCanPlay);
        currentVideoEl.addEventListener("error", onError);

        setTimeout(() => {
          currentVideoEl.removeEventListener("canplay", onCanPlay);
          currentVideoEl.removeEventListener("error", onError);
          reject(new Error("Timeout waiting for video to be playable."));
        }, 5000);

        if (currentVideoEl.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
          console.log("Video already playable, attempting to play.");
          onCanPlay();
        }
      });

      console.log("Webcam initialized and video playing.");
      setWebcamReady(true);
      setWebcamError(null);
    } catch (error: any) {
      console.error("Failed to initialize webcam:", error);
      setWebcamError(error.message || "Failed to access camera.");
      setWebcamReady(false);
      isInitializedRef.current = false;
      cleanup();
    } finally {
      setIsWebcamInitInProgress(false);
    }
  }, [cleanup, webcamReady, webcamError]);

  const resetWebcam = useCallback(() => {
    setWebcamError(null);
    setIsWebcamInitInProgress(false);
    isInitializedRef.current = false;
  }, []);

  // Initialize webcam when conditions are met
  useLayoutEffect(() => {
    const initialLoadTimer = setTimeout(() => {
      setIsInitializing(false);
    }, 200);

    return () => {
      clearTimeout(initialLoadTimer);
      cleanup();
      isInitializedRef.current = false;
    };
  }, [cleanup]);

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
    }
  }, [isInitializing, webcamError, initializeWebcam, isWebcamInitInProgress]);

  return {
    videoRef,
    webcamReady,
    webcamError,
    isInitializing,
    isWebcamInitInProgress,
    resetWebcam,
    cleanup,
  };
};
