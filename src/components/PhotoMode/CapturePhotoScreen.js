import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PhotoModePage, PAPER_TYPE_PHOTO_COUNT } from "@/lib/enums";
import { useEffect, useState, useRef } from "react";
import path from "path";
const CapturePhotoScreen = ({ setPhotos, setCurrentPage, paperType, }) => {
    const [capturedPhotos, setCapturedPhotos] = useState([]);
    const [cameraAvailable, setCameraAvailable] = useState(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [countdown, setCountdown] = useState(null);
    const [sessionStarted, setSessionStarted] = useState(false);
    const [useWebcam, setUseWebcam] = useState(false); // Track which camera type to use
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const requiredPhotos = PAPER_TYPE_PHOTO_COUNT[paperType];
    useEffect(() => {
        // Create tmp directory on component mount
        window.electronAPI.createTempFile(new ArrayBuffer(0), "temp").catch(() => {
            // Ignore error if directory already exists
        });
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
                setUseWebcam(false);
                return;
            }
        }
        catch (error) {
            console.log("gphoto2 not available, checking webcam");
            // Check if we should fallback to webcam
            if (error?.shouldFallbackToWebcam) {
                setUseWebcam(true);
            }
        }
        // Fallback to webcam
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setCameraAvailable(true);
            setUseWebcam(true);
        }
        catch (error) {
            console.error("No camera available:", error);
            setCameraAvailable(false);
            setUseWebcam(false);
        }
    };
    const startPhotoSession = () => {
        setSessionStarted(true);
        startCountdown(5); // Initial 5-second countdown
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
        try {
            let photoFile;
            if (useWebcam) {
                // Use webcam capture only
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
                    throw new Error("Webcam not available");
                }
            }
            else {
                // Use gphoto2 capture through WSL
                const outputPath = path.join(require("os").tmpdir(), "photobooth-app", `photo_${Date.now()}.jpg`);
                try {
                    const result = await window.electronAPI.captureImage(outputPath);
                    // Read the captured file and convert to File object
                    const fileData = await window.electronAPI.readFile(result);
                    const blob = new Blob([fileData], { type: "image/jpeg" });
                    photoFile = new File([blob], `photo_${capturedPhotos.length + 1}.jpg`, {
                        type: "image/jpeg",
                    });
                }
                catch (gphotoError) {
                    console.error("gphoto2 capture failed:", gphotoError);
                    // If this is a WSL/camera error, switch to webcam permanently
                    if (gphotoError?.shouldFallbackToWebcam) {
                        console.log("Permanently switching to webcam due to gphoto2 failure");
                        setUseWebcam(true);
                        // Re-initialize webcam if needed
                        if (!videoRef.current?.srcObject) {
                            await checkCameraAvailability();
                        }
                        // Retry with webcam after a delay
                        setIsCapturing(false);
                        setTimeout(() => {
                            capturePhoto(); // Retry immediately with webcam
                        }, 500);
                        return;
                    }
                    throw gphotoError;
                }
            }
            const newPhotos = [...capturedPhotos, photoFile];
            setCapturedPhotos(newPhotos);
            if (newPhotos.length >= requiredPhotos) {
                // All photos captured, move to next page
                setPhotos(newPhotos);
                setCurrentPage(PhotoModePage.SelectFilterPage);
            }
            else {
                // More photos needed, start countdown for next photo
                setTimeout(() => startCountdown(5), 1500); // Use 5 seconds for all photos
            }
        }
        catch (error) {
            console.error("Failed to capture photo:", error);
            // Only try webcam fallback if we haven't already
            if (!useWebcam) {
                console.log("Attempting webcam fallback...");
                setUseWebcam(true);
                try {
                    await checkCameraAvailability();
                    // Retry capture with webcam after initialization
                    setTimeout(() => {
                        setIsCapturing(false);
                        setTimeout(() => capturePhoto(), 500);
                    }, 1000);
                }
                catch (webcamError) {
                    console.error("Webcam fallback failed:", webcamError);
                    setIsCapturing(false);
                    alert("Failed to capture photo. Please check your camera connection.");
                }
                return;
            }
            // If webcam also fails, show error
            console.error("Both gphoto2 and webcam capture failed");
            setIsCapturing(false);
            alert("Failed to capture photo. Please check your camera connection.");
        }
        finally {
            // Reset capturing state after each photo
            setIsCapturing(false);
        }
    };
    if (cameraAvailable === null) {
        return _jsx("div", { children: "Checking camera availability..." });
    }
    if (cameraAvailable === false) {
        return _jsx("div", { children: "No camera available. Please connect a camera." });
    }
    return (_jsxs("div", { className: "flex flex-col items-center justify-center h-screen bg-gray-100", children: [_jsx("h1", { className: "text-3xl font-bold mb-4", children: "Capture Photos" }), _jsxs("p", { className: "mb-2", children: [capturedPhotos.length, " of ", requiredPhotos, " photos captured"] }), _jsxs("p", { className: "mb-4 text-sm text-gray-600", children: ["Using: ", useWebcam ? "Webcam" : "DSLR Camera"] }), _jsxs("div", { className: "relative mb-4", children: [_jsx("video", { ref: videoRef, autoPlay: true, playsInline: true, className: "w-96 h-72 bg-black rounded", style: { display: useWebcam ? "block" : "none" } }), !useWebcam && (_jsx("div", { className: "w-96 h-72 bg-black rounded flex items-center justify-center", children: _jsx("span", { className: "text-white", children: "DSLR Camera Preview" }) })), _jsx("canvas", { ref: canvasRef, className: "hidden" }), countdown !== null && (_jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded", children: _jsx("div", { className: "text-white text-8xl font-bold", children: countdown }) }))] }), !sessionStarted ? (_jsx("button", { onClick: startPhotoSession, className: "bg-blue-500 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg", children: "Start Photo Session" })) : (_jsx("div", { className: "text-center", children: isCapturing ? (_jsx("div", { className: "text-xl font-bold", children: "Capturing Photo..." })) : countdown !== null ? (_jsx("div", { className: "text-xl", children: "Get Ready!" })) : (_jsx("div", { className: "text-xl", children: "Processing..." })) }))] }));
};
export default CapturePhotoScreen;
