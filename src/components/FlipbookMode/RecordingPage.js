import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FlipbookPage } from "@/lib/enums";
import WebcamCaptureVideo from "./WebcamCaptureVideo"; // Ensure this path is correct
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
const RecordingPage = ({ setCurrentPage, setVideoFile, captureMode,
// selectedFilter, // Available if needed for UI elements
 }) => {
    if (captureMode === "webcam") {
        return (_jsx(WebcamCaptureVideo, { setCurrentPage: setCurrentPage, setVideoFile: setVideoFile }));
    }
    if (captureMode === "dslr") {
        // Placeholder for DSLR video capture
        return (_jsx("div", { className: "min-h-screen mono-gradient flex items-center justify-center p-6", children: _jsxs(Card, { className: "glass-card w-full max-w-md text-center", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-2xl font-bold text-mono-900", children: "DSLR Video Recording" }) }), _jsxs(CardContent, { className: "space-y-6 p-8", children: [_jsx(AlertTriangle, { className: "h-16 w-16 text-orange-500 mx-auto" }), _jsx("p", { className: "text-mono-700", children: "DSLR video recording is not yet implemented." }), _jsx("p", { className: "text-sm text-mono-600", children: "This feature will allow you to record video using a connected DSLR camera. Please check back later or switch to Webcam mode." }), _jsx(Button, { onClick: () => setCurrentPage(FlipbookPage.FlipbookStartScreen), variant: "outline", className: "w-full", children: "Back to Start" })] })] }) }));
    }
    // Fallback for unknown mode
    return (_jsx("div", { className: "min-h-screen mono-gradient flex items-center justify-center p-6", children: _jsxs(Card, { className: "glass-card w-full max-w-md text-center", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-2xl font-bold text-red-600", children: "Error" }) }), _jsxs(CardContent, { className: "p-8", children: [_jsx("p", { className: "text-mono-700", children: "Invalid capture mode selected." }), _jsx(Button, { onClick: () => setCurrentPage(FlipbookPage.FlipbookStartScreen), variant: "outline", className: "w-full mt-6", children: "Return to Start" })] })] }) }));
};
export default RecordingPage;
