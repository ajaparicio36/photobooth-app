import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PhotoModePage, PAPER_TYPE_PHOTO_COUNT } from "@/lib/enums";
import { useEffect, useState, useRef } from "react";
const CapturePhotoScreen = ({ setPhotos, setCurrentPage, paperType, }) => {
    const [capturedPhotos, setCapturedPhotos] = useState([]);
    const [cameraAvailable, setCameraAvailable] = useState(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const requiredPhotos = PAPER_TYPE_PHOTO_COUNT[paperType];
    useEffect(() => {
        setPhotos([]);
        setCapturedPhotos([]);
        checkCameraAvailability();
    }, []);
    const checkCameraAvailability = async () => {
        try {
            // Check for gphoto2 cameras first
            const cameras = await window.electronAPI.getAvailableCameras();
            if (cameras && cameras.length > 0) {
                setCameraAvailable(true);
                return;
            }
        }
        catch (error) {
            console.log("gphoto2 not available, checking webcam");
        }
        // Fallback to webcam
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setCameraAvailable(true);
        }
        catch (error) {
            console.error("No camera available:", error);
            setCameraAvailable(false);
        }
    };
    const capturePhoto = async () => {
        if (isCapturing)
            return;
        setIsCapturing(true);
        try {
            let photoFile;
            // Try gphoto2 first
            try {
                const outputPath = `/tmp/photo_${Date.now()}.jpg`;
                const result = await window.electronAPI.captureImage(outputPath);
                // Read the captured file and convert to File object
                const fileData = await window.electronAPI.readFile(outputPath);
                const blob = new Blob([fileData], { type: "image/jpeg" });
                photoFile = new File([blob], `photo_${capturedPhotos.length + 1}.jpg`, {
                    type: "image/jpeg",
                });
            }
            catch (error) {
                // Fallback to webcam capture
                if (videoRef.current && canvasRef.current) {
                    const canvas = canvasRef.current;
                    const video = videoRef.current;
                    const ctx = canvas.getContext("2d");
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    ctx?.drawImage(video, 0, 0);
                    const blob = await new Promise((resolve) => {
                        canvas.toBlob((blob) => resolve(blob), "image/jpeg");
                    });
                    photoFile = new File([blob], `photo_${capturedPhotos.length + 1}.jpg`, {
                        type: "image/jpeg",
                    });
                }
                else {
                    throw new Error("No capture method available");
                }
            }
            const newPhotos = [...capturedPhotos, photoFile];
            setCapturedPhotos(newPhotos);
            if (newPhotos.length >= requiredPhotos) {
                setPhotos(newPhotos);
                setCurrentPage(PhotoModePage.SelectFilterPage);
            }
        }
        catch (error) {
            console.error("Failed to capture photo:", error);
        }
        finally {
            setIsCapturing(false);
        }
    };
    if (cameraAvailable === null) {
        return _jsx("div", { children: "Checking camera availability..." });
    }
    if (cameraAvailable === false) {
        return _jsx("div", { children: "No camera available. Please connect a camera." });
    }
    return (_jsxs("div", { className: "flex flex-col items-center justify-center h-screen bg-gray-100", children: [_jsx("h1", { className: "text-3xl font-bold mb-4", children: "Capture Photos" }), _jsxs("p", { className: "mb-4", children: [capturedPhotos.length, " of ", requiredPhotos, " photos captured"] }), _jsxs("div", { className: "relative mb-4", children: [_jsx("video", { ref: videoRef, autoPlay: true, playsInline: true, className: "w-96 h-72 bg-black rounded" }), _jsx("canvas", { ref: canvasRef, className: "hidden" })] }), _jsx("button", { onClick: capturePhoto, disabled: isCapturing, className: "bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-4 px-8 rounded-lg", children: isCapturing ? "Capturing..." : "Take Photo" })] }));
};
export default CapturePhotoScreen;
