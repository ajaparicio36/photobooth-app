import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PhotoModePage, PAPER_TYPE_PHOTO_COUNT } from "@/lib/enums";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Camera, Timer, CheckCircle } from "lucide-react";
import path from "path";
const Gphoto2CapturePhoto = ({ setPhotos, setCurrentPage, paperType, }) => {
    const [capturedPhotos, setCapturedPhotos] = useState([]);
    const [isCapturing, setIsCapturing] = useState(false);
    const [countdown, setCountdown] = useState(null);
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
    const startCountdown = (seconds) => {
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
        if (isCapturing)
            return;
        setIsCapturing(true);
        setCountdown(null);
        try {
            const outputPath = path.join(require("os").tmpdir(), "photobooth-app", `photo_${Date.now()}.jpg`);
            const result = await window.electronAPI.captureImage(outputPath);
            const fileData = await window.electronAPI.readFile(result);
            const blob = new Blob([fileData], { type: "image/jpeg" });
            const photoFile = new File([blob], `photo_${capturedPhotos.length + 1}.jpg`, { type: "image/jpeg" });
            const newPhotos = [...capturedPhotos, photoFile];
            setCapturedPhotos(newPhotos);
            console.log(`DSLR Photo ${newPhotos.length} captured. Total needed: ${requiredPhotos}`);
            if (newPhotos.length >= requiredPhotos) {
                setPhotos(newPhotos);
                setCurrentPage(PhotoModePage.SelectFilterPage);
            }
            else {
                setTimeout(() => startCountdown(5), 1500);
            }
        }
        catch (error) {
            console.error("DSLR capture failed:", error);
            alert("Failed to capture photo with DSLR camera. Please check your connection.");
        }
        finally {
            setIsCapturing(false);
        }
    };
    const progress = (capturedPhotos.length / requiredPhotos) * 100;
    return (_jsxs("div", { className: "h-screen mono-gradient flex flex-col overflow-hidden", children: [_jsx("div", { className: "p-4 border-b border-mono-200 bg-white/50 backdrop-blur-sm flex-shrink-0", children: _jsxs("div", { className: "max-w-4xl mx-auto text-center", children: [_jsx("h1", { className: "text-xl font-bold text-mono-900", children: "Photo Session" }), _jsxs("div", { className: "flex items-center justify-center gap-2 mt-1", children: [_jsx(Badge, { variant: "secondary", className: "text-xs", children: "DSLR Camera" }), _jsxs(Badge, { variant: "outline", className: "text-xs", children: [capturedPhotos.length, " of ", requiredPhotos, " photos"] })] })] }) }), _jsx("div", { className: "flex-1 flex items-center justify-center p-4 min-h-0", children: _jsxs("div", { className: "max-w-2xl w-full h-full flex flex-col", children: [_jsx(Card, { className: "glass-card mb-4 flex-shrink-0", children: _jsxs(CardContent, { className: "p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Camera, { className: "w-4 h-4 text-mono-700" }), _jsx("span", { className: "font-semibold text-mono-900 text-sm", children: "Progress" })] }), _jsxs("span", { className: "text-xs text-mono-600", children: [Math.round(progress), "% Complete"] })] }), _jsx(Progress, { value: progress, className: "h-2 mb-1" }), _jsxs("div", { className: "text-xs text-mono-600", children: ["Photo ", capturedPhotos.length + 1, " of ", requiredPhotos] })] }) }), _jsx(Card, { className: "glass-card mb-4 flex-1 min-h-0", children: _jsx(CardContent, { className: "p-4 h-full", children: _jsxs("div", { className: "relative h-full", children: [_jsx("div", { className: "capture-frame w-full h-full bg-mono-900 flex items-center justify-center text-white rounded-lg", children: _jsxs("div", { className: "text-center", children: [_jsx(Camera, { className: "w-12 h-12 mx-auto mb-3 opacity-50" }), _jsx("div", { className: "text-base font-medium", children: "DSLR Camera View" }), _jsx("div", { className: "text-xs opacity-75", children: "Live Preview" })] }) }), countdown !== null && (_jsx("div", { className: "countdown-overlay", children: _jsxs("div", { className: "text-center animate-pulse", children: [_jsx("div", { className: "text-6xl font-bold text-white mb-2", children: countdown }), _jsx("div", { className: "text-lg text-white/80", children: "Get Ready!" })] }) })), isCapturing && (_jsx("div", { className: "countdown-overlay", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-12 h-12 mx-auto mb-2 rounded-full bg-white/20 flex items-center justify-center", children: _jsx("div", { className: "w-8 h-8 rounded-full bg-white animate-pulse" }) }), _jsx("div", { className: "text-lg text-white font-semibold", children: "Capturing Photo..." })] }) }))] }) }) }), _jsx(Card, { className: "glass-card flex-shrink-0", children: _jsx(CardContent, { className: "p-4 text-center", children: !sessionStarted ? (_jsxs("div", { children: [_jsxs("div", { className: "mb-6", children: [_jsx("h3", { className: "text-xl font-bold text-mono-900 mb-2", children: "Ready to Start?" }), _jsxs("p", { className: "text-mono-600", children: ["We'll capture ", requiredPhotos, " photos with a 5-second countdown between each shot"] })] }), _jsxs(Button, { onClick: startPhotoSession, size: "lg", className: "bg-mono-900 hover:bg-mono-800 text-white px-8 py-4", children: [_jsx(Camera, { className: "w-5 h-5 mr-2" }), "Start Photo Session"] })] })) : (_jsx("div", { children: isCapturing ? (_jsxs("div", { className: "flex items-center justify-center gap-3 text-mono-900", children: [_jsx("div", { className: "w-6 h-6 rounded-full bg-mono-900 animate-pulse" }), _jsxs("span", { className: "text-lg font-semibold", children: ["Capturing Photo ", capturedPhotos.length + 1, "..."] })] })) : countdown !== null ? (_jsxs("div", { className: "flex items-center justify-center gap-3 text-mono-900", children: [_jsx(Timer, { className: "w-6 h-6" }), _jsxs("span", { className: "text-lg font-semibold", children: ["Get ready for photo ", capturedPhotos.length + 1, "!"] })] })) : capturedPhotos.length >= requiredPhotos ? (_jsxs("div", { className: "flex items-center justify-center gap-3 text-green-700", children: [_jsx(CheckCircle, { className: "w-6 h-6" }), _jsx("span", { className: "text-lg font-semibold", children: "All photos captured! Moving to filters..." })] })) : (_jsxs("div", { className: "flex items-center justify-center gap-3 text-mono-600", children: [_jsx("div", { className: "w-6 h-6 rounded-full bg-mono-300 animate-pulse" }), _jsx("span", { className: "text-lg", children: "Processing... Next photo coming up!" })] })) })) }) })] }) })] }));
};
export default Gphoto2CapturePhoto;
