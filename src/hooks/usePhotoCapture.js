import { useState, useRef, useCallback } from "react";
export const usePhotoCapture = (requiredPhotos) => {
    const [captureState, setCaptureState] = useState("idle");
    const [sessionStarted, setSessionStarted] = useState(false);
    const [countdownDisplay, setCountdownDisplay] = useState(null);
    const [capturedPhotos, setCapturedPhotos] = useState([]);
    const [currentPhotoPreview, setCurrentPhotoPreview] = useState(null);
    const canvasRef = useRef(null);
    const countdownTimerRef = useRef(null);
    const previewTimerRef = useRef(null);
    const photosArrayRef = useRef([]);
    const countdownValueRef = useRef(0);
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
    const capturePhoto = useCallback(async (videoRef, onPhotoCapture, playShutterSound, startNextCountdown) => {
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
            const blob = await new Promise((resolve) => {
                canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
            });
            const photoFile = new File([blob], `photo_${photosArrayRef.current.length + 1}.jpg`, {
                type: "image/jpeg",
            });
            photosArrayRef.current = [...photosArrayRef.current, photoFile];
            setCapturedPhotos(photosArrayRef.current);
            onPhotoCapture(photoFile);
            // Show preview for 3 seconds
            const previewUrl = URL.createObjectURL(photoFile);
            setCurrentPhotoPreview(previewUrl);
            setCaptureState("preview");
            console.log(`Photo ${photosArrayRef.current.length} captured. Total needed: ${requiredPhotos}`);
            previewTimerRef.current = setTimeout(() => {
                URL.revokeObjectURL(previewUrl);
                setCurrentPhotoPreview(null);
                if (photosArrayRef.current.length >= requiredPhotos) {
                    setCaptureState("complete");
                }
                else {
                    // Start countdown for next photo
                    setCaptureState("countdown");
                    if (startNextCountdown) {
                        startNextCountdown();
                    }
                }
            }, 3000);
        }
        catch (error) {
            console.error("Photo capture failed:", error);
            setCaptureState("idle");
        }
    }, [requiredPhotos]);
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
