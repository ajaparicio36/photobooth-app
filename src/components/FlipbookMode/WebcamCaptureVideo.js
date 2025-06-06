import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FlipbookPage } from "@/lib/enums"; // Updated enum import
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Video, Timer, CheckCircle, Loader2, AlertCircle, Play, } from "lucide-react";
import { useWebcam } from "@/hooks/useWebcam";
import { useAudio } from "@/hooks/useAudio";
import { useWebcamVideo } from "@/hooks/useWebcamVideo";
const WebcamCaptureVideo = ({ setVideoFile, setCurrentPage, }) => {
    const { videoRef, webcamReady, webcamError, isInitializing, isWebcamInitInProgress, resetWebcam, cleanup, } = useWebcam();
    const { playCountdownTick } = useAudio();
    const { recordingState, recordedVideo, countdown, recordingProgress, startVideoSession, 
    // stopRecording, // stopRecording might be useful for a cancel button
    resetRecording, } = useWebcamVideo();
    // Handle recording completion
    useEffect(() => {
        if (recordingState === "complete" && recordedVideo) {
            setVideoFile(recordedVideo);
            // Navigate to VideoPreview after capture is complete
            setCurrentPage(FlipbookPage.VideoPreview);
        }
    }, [recordingState, recordedVideo, setVideoFile, setCurrentPage]);
    // Play countdown sound
    useEffect(() => {
        if (countdown !== null && recordingState === "countdown") {
            // Ensure sound only in countdown
            playCountdownTick();
        }
    }, [countdown, recordingState, playCountdownTick]);
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            resetRecording();
            cleanup();
        };
    }, [resetRecording, cleanup]);
    const handleStartRecording = async () => {
        if (!webcamReady) {
            console.warn("Cannot start recording, webcam not ready.");
            return;
        }
        try {
            await startVideoSession(videoRef); // startVideoSession handles countdown and recording
        }
        catch (error) {
            console.error("Failed to start video session:", error);
            // Handle error state if needed, e.g., show a message to the user
        }
    };
    // Loading state
    if (isInitializing) {
        return (_jsx("div", { className: "min-h-screen mono-gradient flex items-center justify-center p-6", children: _jsx(Card, { className: "glass-card max-w-md w-full", children: _jsxs(CardContent, { className: "p-8 text-center", children: [_jsx("div", { className: "w-16 h-16 mx-auto mb-6 rounded-full bg-mono-100 flex items-center justify-center", children: _jsx(Loader2, { className: "w-8 h-8 text-mono-900 animate-spin" }) }), _jsx("h2", { className: "text-2xl font-bold text-mono-900 mb-3", children: "Loading Video Session" }), _jsx("p", { className: "text-mono-600 mb-4", children: "Preparing camera and interface..." })] }) }) }));
    }
    // Error state
    if (webcamError) {
        return (_jsx("div", { className: "min-h-screen mono-gradient flex items-center justify-center p-6", children: _jsx(Card, { className: "glass-card max-w-md w-full", children: _jsxs(CardContent, { className: "p-8 text-center", children: [_jsx("div", { className: "w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center", children: _jsx(AlertCircle, { className: "w-8 h-8 text-red-600" }) }), _jsx("h2", { className: "text-2xl font-bold text-mono-900 mb-3", children: "Camera Error" }), _jsx("p", { className: "text-mono-600 mb-6 text-sm leading-relaxed", children: webcamError }), _jsxs("div", { className: "space-y-3", children: [_jsxs(Button, { onClick: resetWebcam, className: "w-full bg-mono-900 hover:bg-mono-800 text-white", children: [_jsx(Video, { className: "w-4 h-4 mr-2" }), "Try Again"] }), _jsx(Button, { onClick: () => window.location.reload(), variant: "outline", className: "w-full", children: "Refresh Page" })] })] }) }) }));
    }
    const renderRecordingOverlay = () => {
        if (recordingState === "countdown" && countdown !== null) {
            return (_jsx("div", { className: "countdown-overlay", children: _jsxs("div", { className: "text-center animate-pulse", children: [_jsx("div", { className: "text-6xl font-bold text-white mb-2", children: countdown }), _jsx("div", { className: "text-lg text-white/80", children: "Get Ready to Record!" })] }) }));
        }
        if (recordingState === "recording") {
            return (_jsx("div", { className: "countdown-overlay", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-16 h-16 mx-auto mb-4 rounded-full bg-red-600 flex items-center justify-center animate-pulse", children: _jsx("div", { className: "w-8 h-8 rounded-full bg-white" }) }), _jsx("div", { className: "text-lg text-white font-semibold mb-2", children: "Recording..." }), _jsxs("div", { className: "text-sm text-white/80", children: [Math.ceil(((100 - recordingProgress) / 100) * 7), "s remaining"] })] }) }));
        }
        if (recordingState === "processing") {
            return (_jsx("div", { className: "countdown-overlay", children: _jsxs("div", { className: "text-center", children: [_jsx(Loader2, { className: "w-12 h-12 mx-auto mb-2 text-white animate-spin" }), _jsx("div", { className: "text-lg text-white font-semibold", children: "Processing Video..." })] }) }));
        }
        // "complete" state is handled by navigation, so no overlay needed here typically
        // but can be added if there's a brief pause before navigation.
        if (recordingState === "complete") {
            return (_jsx("div", { className: "countdown-overlay", children: _jsxs("div", { className: "text-center", children: [_jsx(CheckCircle, { className: "w-12 h-12 mx-auto mb-2 text-green-400" }), _jsx("div", { className: "text-lg text-white font-semibold", children: "Video Captured!" })] }) }));
        }
        return null;
    };
    const renderControlsContent = () => {
        if (recordingState === "idle") {
            return (_jsxs("div", { children: [_jsxs("div", { className: "mb-4", children: [_jsx("h3", { className: "text-lg font-bold text-mono-900 mb-1", children: "Ready to Record?" }), _jsx("p", { className: "text-mono-600 text-sm", children: "We'll record a 7-second video that will be turned into a flipbook." })] }), _jsxs(Button, { onClick: handleStartRecording, size: "lg", className: "bg-mono-900 hover:bg-mono-800 text-white px-6 py-3", disabled: !webcamReady || isWebcamInitInProgress, children: [_jsx(Play, { className: "w-4 h-4 mr-2" }), "Start Recording (7s)"] })] }));
        }
        switch (recordingState) {
            case "countdown":
                return (_jsxs("div", { className: "flex items-center justify-center gap-3 text-mono-900", children: [_jsx(Timer, { className: "w-6 h-6" }), _jsxs("span", { className: "text-lg font-semibold", children: ["Recording starts in ", countdown, "..."] })] }));
            case "recording":
                return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-center gap-3 text-red-600", children: [_jsx("div", { className: "w-6 h-6 rounded-full bg-red-600 animate-pulse" }), _jsx("span", { className: "text-lg font-semibold", children: "Recording in progress..." })] }), _jsx(Progress, { value: recordingProgress, className: "h-2" }), _jsxs("div", { className: "text-center text-sm text-mono-600", children: [Math.ceil(((100 - recordingProgress) / 100) * 7), " seconds remaining"] })] }));
            case "processing":
                return (_jsxs("div", { className: "flex items-center justify-center gap-3 text-mono-600", children: [_jsx(Loader2, { className: "w-6 h-6 animate-spin" }), _jsx("span", { className: "text-lg", children: "Finalizing video..." })] }));
            case "complete":
                return (_jsxs("div", { className: "flex items-center justify-center gap-3 text-green-700", children: [_jsx(CheckCircle, { className: "w-6 h-6" }), _jsx("span", { className: "text-lg font-semibold", children: "Video ready! Proceeding to preview..." })] }));
            default: // Should not happen
                return (_jsxs("div", { className: "flex items-center justify-center gap-3 text-mono-600", children: [_jsx(Loader2, { className: "w-6 h-6 animate-spin" }), _jsx("span", { className: "text-lg", children: "Please wait..." })] }));
        }
    };
    return (_jsxs("div", { className: "h-screen mono-gradient flex flex-col overflow-hidden", children: [_jsx("div", { className: "p-4 border-b border-mono-200 bg-white/50 backdrop-blur-sm flex-shrink-0", children: _jsxs("div", { className: "max-w-4xl mx-auto text-center", children: [_jsx("h1", { className: "text-xl font-bold text-mono-900", children: "Flipbook Video Recording" }), _jsxs("div", { className: "flex items-center justify-center gap-2 mt-1", children: [_jsx(Badge, { variant: "secondary", className: "text-xs", children: "Webcam Mode" }), _jsx(Badge, { variant: "outline", className: "text-xs", children: "7 Second Video" })] })] }) }), _jsx("div", { className: "flex-1 flex items-center justify-center p-4 min-h-0", children: _jsxs("div", { className: "max-w-2xl w-full h-full flex flex-col", children: [recordingState === "recording" && (_jsx(Card, { className: "glass-card mb-4 flex-shrink-0", children: _jsxs(CardContent, { className: "p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Video, { className: "w-4 h-4 text-red-600" }), _jsx("span", { className: "font-semibold text-mono-900 text-sm", children: "Recording Progress" })] }), _jsxs("span", { className: "text-xs text-mono-600", children: [Math.round(recordingProgress), "%"] })] }), _jsx(Progress, { value: recordingProgress, className: "h-2 mb-1" }), _jsxs("div", { className: "text-xs text-mono-600", children: [Math.ceil(((100 - recordingProgress) / 100) * 7), " seconds remaining"] })] }) })), _jsx(Card, { className: "glass-card mb-4 flex-1 min-h-0", children: _jsx(CardContent, { className: "p-4 h-full", children: _jsxs("div", { className: "relative h-full max-w-md mx-auto", children: [_jsx("video", { ref: videoRef, playsInline: true, muted: true, className: "capture-frame w-full h-full object-cover rounded-lg bg-black", style: { aspectRatio: "3/4" } }), (!webcamReady || isWebcamInitInProgress) && !webcamError && (_jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg", children: _jsxs("div", { className: "text-center text-white", children: [_jsx(Loader2, { className: "w-8 h-8 mx-auto mb-2 animate-spin" }), _jsx("p", { children: "Starting camera..." })] }) })), renderRecordingOverlay()] }) }) }), _jsx(Card, { className: "glass-card flex-shrink-0", children: _jsx(CardContent, { className: "p-4 text-center", children: renderControlsContent() }) })] }) })] }));
};
export default WebcamCaptureVideo;
