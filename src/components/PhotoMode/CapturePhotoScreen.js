import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
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
        return (_jsx("div", { className: "flex flex-col items-center justify-center h-screen bg-gray-100", children: _jsx("div", { className: "text-xl", children: "Detecting cameras..." }) }));
    }
    if (cameraType === CameraType.NONE) {
        return (_jsxs("div", { className: "flex flex-col items-center justify-center h-screen bg-gray-100", children: [_jsx("h1", { className: "text-2xl font-bold mb-4", children: "No Camera Available" }), _jsx("p", { className: "mb-4 text-center", children: "Please connect a DSLR camera or ensure your webcam is working." }), _jsx("button", { onClick: detectAvailableCamera, className: "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded", children: "Retry Detection" })] }));
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
