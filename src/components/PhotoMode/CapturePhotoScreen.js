import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PhotoModePage } from "@/lib/enums";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Monitor, AlertTriangle, Loader2 } from "lucide-react";
import Gphoto2CapturePhoto from "./Gphoto2CapturePhoto";
import WebcamCapturePhoto from "./WebcamCapturePhoto";
const CapturePhotoScreen = ({ paperType, setPhotos, setCurrentPage, }) => {
    const [cameraMode, setCameraMode] = useState("checking");
    const [checkingError, setCheckingError] = useState(null);
    const [userChoice, setUserChoice] = useState(null);
    useEffect(() => {
        checkCameraAvailability();
    }, []);
    const checkCameraAvailability = async () => {
        console.log("Checking camera availability...");
        try {
            // Check if electron API is available
            if (!window.electronAPI) {
                console.log("Electron API not available, checking webcam...");
                await checkWebcamAvailability();
                return;
            }
            // Check DSLR camera health
            const dslrAvailable = await window.electronAPI.checkCameraHealth();
            console.log("DSLR available:", dslrAvailable);
            if (dslrAvailable) {
                // Try to get available cameras to double-check
                try {
                    const cameras = await window.electronAPI.getAvailableCameras();
                    console.log("Available DSLR cameras:", cameras);
                    if (cameras && cameras.length > 0) {
                        setCameraMode("dslr");
                        return;
                    }
                }
                catch (cameraError) {
                    console.log("DSLR camera check failed:", cameraError);
                    // Check if we should fallback to webcam
                    if (cameraError.shouldFallbackToWebcam) {
                        console.log("Falling back to webcam due to DSLR error");
                        await checkWebcamAvailability();
                        return;
                    }
                }
            }
            // If DSLR is not available, check webcam
            console.log("DSLR not available, checking webcam...");
            await checkWebcamAvailability();
        }
        catch (error) {
            console.error("Camera availability check failed:", error);
            // Try webcam as fallback
            console.log("Falling back to webcam after error");
            await checkWebcamAvailability();
        }
    };
    const checkWebcamAvailability = async () => {
        try {
            // Check if browser supports getUserMedia
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setCheckingError("Camera access not supported in this browser. Please use a modern browser with camera support.");
                return;
            }
            // Actually test camera access
            console.log("Testing webcam access...");
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
            });
            // Stop the test stream immediately
            stream.getTracks().forEach((track) => track.stop());
            console.log("Webcam access successful");
            setCameraMode("webcam");
        }
        catch (webcamError) {
            console.error("Webcam access failed:", webcamError);
            let errorMessage = "Failed to access webcam.";
            if (webcamError.name === "NotAllowedError") {
                errorMessage =
                    "Camera access denied. Please allow camera permissions in your browser settings and refresh the page.";
            }
            else if (webcamError.name === "NotFoundError") {
                errorMessage =
                    "No camera found. Please connect a webcam and try again.";
            }
            else if (webcamError.name === "NotReadableError") {
                errorMessage =
                    "Camera is being used by another application. Please close other camera apps and try again.";
            }
            else if (webcamError.name === "OverconstrainedError") {
                errorMessage = "Camera does not meet the required specifications.";
            }
            setCheckingError(errorMessage);
        }
    };
    // Show loading while checking
    if (cameraMode === "checking") {
        return (_jsx("div", { className: "min-h-screen mono-gradient flex items-center justify-center p-6", children: _jsx(Card, { className: "glass-card max-w-md w-full", children: _jsxs(CardContent, { className: "p-8 text-center", children: [_jsx("div", { className: "w-16 h-16 mx-auto mb-6 rounded-full bg-mono-100 flex items-center justify-center", children: _jsx(Loader2, { className: "w-8 h-8 text-mono-900 animate-spin" }) }), _jsx("h2", { className: "text-2xl font-bold text-mono-900 mb-3", children: "Detecting Cameras" }), _jsx("p", { className: "text-mono-600 mb-4", children: "Checking for available DSLR and webcam options..." }), _jsx("div", { className: "text-xs text-mono-500", children: "This may take a few moments" })] }) }) }));
    }
    // Show error if no cameras available
    if (checkingError) {
        return (_jsx("div", { className: "min-h-screen mono-gradient flex items-center justify-center p-6", children: _jsx(Card, { className: "glass-card max-w-md w-full", children: _jsxs(CardContent, { className: "p-8 text-center", children: [_jsx("div", { className: "w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center", children: _jsx(AlertTriangle, { className: "w-8 h-8 text-red-600" }) }), _jsx("h2", { className: "text-2xl font-bold text-mono-900 mb-3", children: "No Cameras Available" }), _jsx("p", { className: "text-mono-600 mb-6 text-sm leading-relaxed", children: checkingError }), _jsxs("div", { className: "space-y-3", children: [_jsxs(Button, { onClick: checkCameraAvailability, className: "w-full bg-mono-900 hover:bg-mono-800 text-white", children: [_jsx(Camera, { className: "w-4 h-4 mr-2" }), "Check Again"] }), _jsx(Button, { onClick: () => setCurrentPage(PhotoModePage.ChoosePaperType), variant: "outline", className: "w-full", children: "Go Back" })] })] }) }) }));
    }
    // If user hasn't chosen and both options might be available, show choice
    if (!userChoice && window.electronAPI) {
        return (_jsx("div", { className: "min-h-screen mono-gradient flex items-center justify-center p-6", children: _jsx(Card, { className: "glass-card max-w-lg w-full", children: _jsxs(CardContent, { className: "p-8", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h2", { className: "text-2xl font-bold text-mono-900 mb-3", children: "Choose Camera Type" }), _jsx("p", { className: "text-mono-600", children: "Select which camera you'd like to use for your photo session" })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs(Button, { onClick: () => {
                                        setUserChoice("dslr");
                                        setCameraMode("dslr");
                                    }, variant: "outline", className: "w-full p-6 h-auto flex items-center justify-start gap-4 hover:bg-mono-50", children: [_jsx("div", { className: "w-12 h-12 rounded-full bg-mono-100 flex items-center justify-center", children: _jsx(Camera, { className: "w-6 h-6 text-mono-700" }) }), _jsxs("div", { className: "text-left", children: [_jsx("div", { className: "font-semibold text-mono-900", children: "DSLR Camera" }), _jsx("div", { className: "text-sm text-mono-600", children: "Professional quality photos" }), _jsx(Badge, { variant: "secondary", className: "mt-1 text-xs", children: "Recommended" })] })] }), _jsxs(Button, { onClick: () => {
                                        setUserChoice("webcam");
                                        setCameraMode("webcam");
                                    }, variant: "outline", className: "w-full p-6 h-auto flex items-center justify-start gap-4 hover:bg-mono-50", children: [_jsx("div", { className: "w-12 h-12 rounded-full bg-mono-100 flex items-center justify-center", children: _jsx(Monitor, { className: "w-6 h-6 text-mono-700" }) }), _jsxs("div", { className: "text-left", children: [_jsx("div", { className: "font-semibold text-mono-900", children: "Webcam" }), _jsx("div", { className: "text-sm text-mono-600", children: "Quick and convenient" })] })] })] }), _jsx("div", { className: "mt-6 pt-4 border-t border-mono-200", children: _jsx(Button, { onClick: () => setCurrentPage(PhotoModePage.ChoosePaperType), variant: "ghost", className: "w-full text-mono-600", children: "\u2190 Go Back" }) })] }) }) }));
    }
    // Render the appropriate camera component
    if (cameraMode === "dslr" || userChoice === "dslr") {
        return (_jsx(Gphoto2CapturePhoto, { paperType: paperType, setPhotos: setPhotos, setCurrentPage: setCurrentPage }));
    }
    return (_jsx(WebcamCapturePhoto, { paperType: paperType, setPhotos: setPhotos, setCurrentPage: setCurrentPage }));
};
export default CapturePhotoScreen;
