import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Loader2, AlertCircle } from "lucide-react";
import Gphoto2CapturePhoto from "./Gphoto2CapturePhoto";
import WebcamCapturePhoto from "./WebcamCapturePhoto";
var CameraType;
(function (CameraType) {
    CameraType["NONE"] = "none";
    CameraType["DSLR"] = "dslr";
    CameraType["WEBCAM"] = "webcam";
})(CameraType || (CameraType = {}));
const CapturePhotoScreen = ({ setPhotos, setCurrentPage, paperType, }) => {
    const [cameraType, setCameraType] = useState(null);
    const [isCheckingCamera, setIsCheckingCamera] = useState(true);
    useEffect(() => {
        // Create tmp directory on component mount
        window.electronAPI.createTempFile(new ArrayBuffer(0), "temp").catch(() => {
            // Ignore error if directory already exists
        });
        detectAvailableCamera();
    }, []);
    const detectAvailableCamera = async () => {
        console.log("Detecting available cameras...");
        try {
            // First, try to detect DSLR cameras
            const cameras = await window.electronAPI.getAvailableCameras();
            if (cameras && cameras.length > 0) {
                console.log("DSLR cameras found:", cameras);
                setCameraType(CameraType.DSLR);
                setIsCheckingCamera(false);
                return;
            }
        }
        catch (error) {
            console.log("DSLR cameras not available:", error.message);
        }
        // Fallback to webcam
        try {
            console.log("Checking webcam availability...");
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach((track) => track.stop()); // Stop the test stream
            console.log("Webcam available");
            setCameraType(CameraType.WEBCAM);
        }
        catch (error) {
            console.error("No cameras available:", error);
            setCameraType(CameraType.NONE);
        }
        setIsCheckingCamera(false);
    };
    if (isCheckingCamera) {
        return (_jsx("div", { className: "h-screen mono-gradient flex items-center justify-center p-4 overflow-hidden", children: _jsx(Card, { className: "glass-card max-w-md w-full", children: _jsxs(CardContent, { className: "p-6 text-center", children: [_jsx("div", { className: "w-12 h-12 mx-auto mb-4 rounded-full bg-mono-100 flex items-center justify-center", children: _jsx(Loader2, { className: "w-6 h-6 text-mono-900 animate-spin" }) }), _jsx("h2", { className: "text-xl font-bold text-mono-900 mb-2", children: "Detecting Cameras" }), _jsx("p", { className: "text-mono-600 text-sm", children: "Searching for available camera devices..." })] }) }) }));
    }
    if (cameraType === CameraType.NONE) {
        return (_jsx("div", { className: "h-screen mono-gradient flex items-center justify-center p-4 overflow-hidden", children: _jsx(Card, { className: "glass-card max-w-md w-full", children: _jsxs(CardContent, { className: "p-6 text-center", children: [_jsx("div", { className: "w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center", children: _jsx(AlertCircle, { className: "w-6 h-6 text-red-600" }) }), _jsx("h2", { className: "text-xl font-bold text-mono-900 mb-2", children: "No Camera Available" }), _jsx("p", { className: "text-mono-600 mb-4 text-sm", children: "Please connect a DSLR camera or ensure your webcam is working properly." }), _jsxs(Button, { onClick: detectAvailableCamera, className: "w-full bg-mono-900 hover:bg-mono-800 text-white", children: [_jsx(Camera, { className: "w-4 h-4 mr-2" }), "Retry Detection"] })] }) }) }));
    }
    if (cameraType === CameraType.DSLR) {
        return (_jsx(Gphoto2CapturePhoto, { setPhotos: setPhotos, setCurrentPage: setCurrentPage, paperType: paperType }));
    }
    if (cameraType === CameraType.WEBCAM) {
        return (_jsx(WebcamCapturePhoto, { setPhotos: setPhotos, setCurrentPage: setCurrentPage, paperType: paperType }));
    }
    return null;
};
export default CapturePhotoScreen;
