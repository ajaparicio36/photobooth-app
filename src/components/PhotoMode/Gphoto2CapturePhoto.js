import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PhotoModePage, PAPER_TYPE_PHOTO_COUNT } from "@/lib/enums";
import { useState, useEffect } from "react";
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
    return (_jsxs("div", { className: "flex flex-col items-center justify-center h-screen bg-gray-100", children: [_jsx("h1", { className: "text-3xl font-bold mb-4", children: "Capture Photos" }), _jsxs("p", { className: "mb-2", children: [capturedPhotos.length, " of ", requiredPhotos, " photos captured"] }), _jsx("p", { className: "mb-4 text-sm text-gray-600", children: "Using: DSLR Camera" }), _jsxs("div", { className: "relative mb-4", children: [_jsx("div", { className: "w-96 h-72 bg-black rounded flex items-center justify-center", children: _jsx("span", { className: "text-white", children: "DSLR Camera Preview" }) }), countdown !== null && (_jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded", children: _jsx("div", { className: "text-white text-8xl font-bold", children: countdown }) }))] }), !sessionStarted ? (_jsx("button", { onClick: startPhotoSession, className: "bg-blue-500 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg", children: "Start Photo Session" })) : (_jsx("div", { className: "text-center", children: isCapturing ? (_jsx("div", { className: "text-xl font-bold", children: "Capturing Photo..." })) : countdown !== null ? (_jsx("div", { className: "text-xl", children: "Get Ready!" })) : (_jsx("div", { className: "text-xl", children: "Processing..." })) }))] }));
};
export default Gphoto2CapturePhoto;
