import { useState, useRef, useCallback } from "react";

export type CaptureState =
  | "idle"
  | "countdown"
  | "capturing"
  | "preview"
  | "complete";

export const usePhotoCapture = (requiredPhotos: number) => {
  const [captureState, setCaptureState] = useState<CaptureState>("idle");
  const [sessionStarted, setSessionStarted] = useState(false);
  const [countdownDisplay, setCountdownDisplay] = useState<number | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<File[]>([]);
  const [currentPhotoPreview, setCurrentPhotoPreview] = useState<string | null>(
    null
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const photosArrayRef = useRef<File[]>([]);
  const countdownValueRef = useRef<number>(0);

  const clearTimers = useCallback(() => {
    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }
  }, []);

  const resetSession = useCallback(() => {
    clearTimers();
    setCaptureState("idle");
    setSessionStarted(false);
    setCountdownDisplay(null);
    setCapturedPhotos([]);
    setCurrentPhotoPreview(null);
    photosArrayRef.current = [];
    countdownValueRef.current = 0;
  }, [clearTimers]);

  const capturePhoto = useCallback(
    async (
      videoRef: React.RefObject<HTMLVideoElement>,
      onPhotoCapture: (photo: File) => void,
      playShutterSound: () => void,
      startNextCountdown?: () => void
    ) => {
      if (!videoRef.current || !canvasRef.current) {
        console.error("Video or canvas ref not available for capture");
        return;
      }

      setCaptureState("capturing");
      playShutterSound();

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
          `photo_${photosArrayRef.current.length + 1}.jpg`,
          {
            type: "image/jpeg",
          }
        );

        photosArrayRef.current = [...photosArrayRef.current, photoFile];
        setCapturedPhotos(photosArrayRef.current);
        onPhotoCapture(photoFile);

        // Show preview for 3 seconds
        const previewUrl = URL.createObjectURL(photoFile);
        setCurrentPhotoPreview(previewUrl);
        setCaptureState("preview");

        console.log(
          `Photo ${photosArrayRef.current.length} captured. Total needed: ${requiredPhotos}`
        );

        previewTimerRef.current = setTimeout(() => {
          URL.revokeObjectURL(previewUrl);
          setCurrentPhotoPreview(null);

          if (photosArrayRef.current.length >= requiredPhotos) {
            setCaptureState("complete");
          } else {
            // Start countdown for next photo
            setCaptureState("countdown");
            if (startNextCountdown) {
              startNextCountdown();
            }
          }
        }, 3000);
      } catch (error) {
        console.error("Photo capture failed:", error);
        setCaptureState("idle");
      }
    },
    [requiredPhotos]
  );

  return {
    captureState,
    sessionStarted,
    countdown: countdownDisplay,
    capturedPhotos,
    currentPhotoPreview,
    canvasRef,
    photosArrayRef,
    countdownValueRef,
    setSessionStarted,
    setCountdownDisplay,
    setCaptureState,
    resetSession,
    capturePhoto,
    clearTimers,
    countdownTimerRef,
  };
};
