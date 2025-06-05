import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PhotoModePage, PAPER_TYPE_PHOTO_COUNT } from "@/lib/enums";
import { useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Camera, Timer, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { useWebcam } from "@/hooks/useWebcam";
import { useAudio } from "@/hooks/useAudio";
import { usePhotoCapture } from "@/hooks/usePhotoCapture";
const WebcamCapturePhoto = ({ setPhotos, setCurrentPage, paperType, }) => {
    const requiredPhotos = PAPER_TYPE_PHOTO_COUNT[paperType];
    const { videoRef, webcamReady, webcamError, isInitializing, isWebcamInitInProgress, resetWebcam, cleanup, } = useWebcam();
    const { playCountdownTick, playShutterSound } = useAudio();
    const { captureState, sessionStarted, countdown, capturedPhotos, currentPhotoPreview, canvasRef, photosArrayRef, countdownValueRef, setSessionStarted, setCountdownDisplay, setCaptureState, resetSession, capturePhoto, clearTimers, countdownTimerRef, } = usePhotoCapture(requiredPhotos);
    // Handle countdown logic with refs
    const runCountdown = useCallback(() => {
        if (countdownValueRef.current <= 0) {
            setCountdownDisplay(null);
            capturePhoto(videoRef, () => { }, playShutterSound, startCountdown);
            return;
        }
        setCountdownDisplay(countdownValueRef.current);
        playCountdownTick();
        countdownTimerRef.current = setTimeout(() => {
            countdownValueRef.current -= 1;
            runCountdown();
        }, 1000);
    }, [
        capturePhoto,
        videoRef,
        playShutterSound,
        playCountdownTick,
        setCountdownDisplay,
        countdownValueRef,
        countdownTimerRef,
    ]);
    // Start countdown
    const startCountdown = useCallback(() => {
        console.log("Starting countdown...");
        clearTimers();
        setCaptureState("countdown");
        countdownValueRef.current = 10;
        runCountdown();
    }, [clearTimers, setCaptureState, countdownValueRef, runCountdown]);
    // Start photo session
    const startPhotoSession = useCallback(() => {
        if (!webcamReady) {
            console.warn("Cannot start photo session, webcam not ready.");
            return;
        }
        setSessionStarted(true);
        photosArrayRef.current = [];
        startCountdown();
    }, [webcamReady, setSessionStarted, photosArrayRef, startCountdown]);
    // Handle session completion
    useEffect(() => {
        if (captureState === "complete" &&
            photosArrayRef.current.length >= requiredPhotos) {
            setPhotos(photosArrayRef.current);
            const navigationTimer = setTimeout(() => {
                setCurrentPage(PhotoModePage.SelectFilterPage);
            }, 1000);
            return () => clearTimeout(navigationTimer);
        }
    }, [captureState, requiredPhotos, setPhotos, setCurrentPage, photosArrayRef]);
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            resetSession();
            cleanup();
        };
    }, [resetSession, cleanup]);
    const progress = (capturedPhotos.length / requiredPhotos) * 100;
    // Loading state
    if (isInitializing) {
        return (_jsx("div", { className: "min-h-screen mono-gradient flex items-center justify-center p-6", children: _jsx(Card, { className: "glass-card max-w-md w-full", children: _jsxs(CardContent, { className: "p-8 text-center", children: [_jsx("div", { className: "w-16 h-16 mx-auto mb-6 rounded-full bg-mono-100 flex items-center justify-center", children: _jsx(Loader2, { className: "w-8 h-8 text-mono-900 animate-spin" }) }), _jsx("h2", { className: "text-2xl font-bold text-mono-900 mb-3", children: "Loading Photo Session" }), _jsx("p", { className: "text-mono-600 mb-4", children: "Preparing camera and interface..." })] }) }) }));
    }
    // Error state
    if (webcamError) {
        return (_jsx("div", { className: "min-h-screen mono-gradient flex items-center justify-center p-6", children: _jsx(Card, { className: "glass-card max-w-md w-full", children: _jsxs(CardContent, { className: "p-8 text-center", children: [_jsx("div", { className: "w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center", children: _jsx(AlertCircle, { className: "w-8 h-8 text-red-600" }) }), _jsx("h2", { className: "text-2xl font-bold text-mono-900 mb-3", children: "Camera Error" }), _jsx("p", { className: "text-mono-600 mb-6 text-sm leading-relaxed", children: webcamError }), _jsxs("div", { className: "space-y-3", children: [_jsxs(Button, { onClick: resetWebcam, className: "w-full bg-mono-900 hover:bg-mono-800 text-white", children: [_jsx(Camera, { className: "w-4 h-4 mr-2" }), "Try Again"] }), _jsx(Button, { onClick: () => window.location.reload(), variant: "outline", className: "w-full", children: "Refresh Page" })] })] }) }) }));
    }
    const renderCaptureOverlay = () => {
        if (captureState === "countdown" && countdown !== null) {
            return (_jsx("div", { className: "countdown-overlay", children: _jsxs("div", { className: "text-center animate-pulse", children: [_jsx("div", { className: "text-6xl font-bold text-white mb-2", children: countdown }), _jsx("div", { className: "text-lg text-white/80", children: "Get Ready!" })] }) }));
        }
        if (captureState === "capturing") {
            return (_jsx("div", { className: "countdown-overlay", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-12 h-12 mx-auto mb-2 rounded-full bg-white/20 flex items-center justify-center", children: _jsx("div", { className: "w-8 h-8 rounded-full bg-white animate-pulse" }) }), _jsx("div", { className: "text-lg text-white font-semibold", children: "Capturing..." })] }) }));
        }
        if (captureState === "preview" && currentPhotoPreview) {
            return (_jsx("div", { className: "countdown-overlay", children: _jsxs("div", { className: "text-center", children: [_jsx("img", { src: currentPhotoPreview, alt: "Captured photo preview", className: "w-32 h-32 object-cover rounded-lg mb-2 mx-auto" }), _jsx("div", { className: "text-lg text-white font-semibold", children: "Great shot!" })] }) }));
        }
        return null;
    };
    const renderControlsContent = () => {
        if (!sessionStarted) {
            return (_jsxs("div", { children: [_jsxs("div", { className: "mb-4", children: [_jsx("h3", { className: "text-lg font-bold text-mono-900 mb-1", children: "Ready to Start?" }), _jsxs("p", { className: "text-mono-600 text-sm", children: ["We'll capture ", requiredPhotos, " photos with a 10-second countdown between each shot"] })] }), _jsxs(Button, { onClick: startPhotoSession, size: "lg", className: "bg-mono-900 hover:bg-mono-800 text-white px-6 py-3", disabled: !webcamReady || isWebcamInitInProgress, children: [_jsx(Camera, { className: "w-4 h-4 mr-2" }), "Start Photo Session"] })] }));
        }
        switch (captureState) {
            case "capturing":
                return (_jsxs("div", { className: "flex items-center justify-center gap-3 text-mono-900", children: [_jsx("div", { className: "w-6 h-6 rounded-full bg-mono-900 animate-pulse" }), _jsxs("span", { className: "text-lg font-semibold", children: ["Capturing Photo ", capturedPhotos.length + 1, "..."] })] }));
            case "countdown":
                return (_jsxs("div", { className: "flex items-center justify-center gap-3 text-mono-900", children: [_jsx(Timer, { className: "w-6 h-6" }), _jsxs("span", { className: "text-lg font-semibold", children: ["Get ready for photo ", capturedPhotos.length + 1, "!"] })] }));
            case "preview":
                return (_jsxs("div", { className: "flex items-center justify-center gap-3 text-mono-600", children: [_jsx(CheckCircle, { className: "w-6 h-6 text-green-600" }), _jsx("span", { className: "text-lg", children: "Photo captured! Next one coming up..." })] }));
            case "complete":
                return (_jsxs("div", { className: "flex items-center justify-center gap-3 text-green-700", children: [_jsx(CheckCircle, { className: "w-6 h-6" }), _jsx("span", { className: "text-lg font-semibold", children: "All photos captured! Moving to filters..." })] }));
            default:
                return (_jsxs("div", { className: "flex items-center justify-center gap-3 text-mono-600", children: [_jsx("div", { className: "w-6 h-6 rounded-full bg-mono-300 animate-pulse" }), _jsx("span", { className: "text-lg", children: "Processing..." })] }));
        }
    };
    return (_jsxs("div", { className: "h-screen mono-gradient flex flex-col overflow-hidden", children: [_jsx("div", { className: "p-4 border-b border-mono-200 bg-white/50 backdrop-blur-sm flex-shrink-0", children: _jsxs("div", { className: "max-w-4xl mx-auto text-center", children: [_jsx("h1", { className: "text-xl font-bold text-mono-900", children: "Photo Session" }), _jsxs("div", { className: "flex items-center justify-center gap-2 mt-1", children: [_jsx(Badge, { variant: "secondary", className: "text-xs", children: "Webcam" }), _jsxs(Badge, { variant: "outline", className: "text-xs", children: [capturedPhotos.length, " of ", requiredPhotos, " photos"] })] })] }) }), _jsx("div", { className: "flex-1 flex items-center justify-center p-4 min-h-0", children: _jsxs("div", { className: "max-w-2xl w-full h-full flex flex-col", children: [sessionStarted && (_jsx(Card, { className: "glass-card mb-4 flex-shrink-0", children: _jsxs(CardContent, { className: "p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Camera, { className: "w-4 h-4 text-mono-700" }), _jsx("span", { className: "font-semibold text-mono-900 text-sm", children: "Progress" })] }), _jsxs("span", { className: "text-xs text-mono-600", children: [Math.round(progress), "% Complete"] })] }), _jsx(Progress, { value: progress, className: "h-2 mb-1" }), _jsxs("div", { className: "text-xs text-mono-600", children: ["Photo ", Math.min(capturedPhotos.length + 1, requiredPhotos), " of", " ", requiredPhotos] })] }) })), _jsx(Card, { className: "glass-card mb-4 flex-1 min-h-0", children: _jsx(CardContent, { className: "p-4 h-full", children: _jsxs("div", { className: "relative h-full", children: [_jsx("video", { ref: videoRef, playsInline: true, muted: true, className: "capture-frame w-full h-full object-cover rounded-lg bg-black" }), _jsx("canvas", { ref: canvasRef, className: "hidden" }), (!webcamReady || isWebcamInitInProgress) && !webcamError && (_jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg", children: _jsxs("div", { className: "text-center text-white", children: [_jsx(Loader2, { className: "w-8 h-8 mx-auto mb-2 animate-spin" }), _jsx("p", { children: "Starting camera..." })] }) })), renderCaptureOverlay()] }) }) }), _jsx(Card, { className: "glass-card flex-shrink-0", children: _jsx(CardContent, { className: "p-4 text-center", children: renderControlsContent() }) })] }) })] }));
};
export default WebcamCapturePhoto;
