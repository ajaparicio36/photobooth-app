import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import FlipbookStartScreen from "@/components/FlipbookMode/FlipbookStartScreen";
import RecordingPage from "@/components/FlipbookMode/RecordingPage";
import VideoPreview from "@/components/FlipbookMode/VideoPreview";
import PrintPreview from "@/components/FlipbookMode/PrintPreview";
import { FlipbookPage } from "@/lib/enums";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
const FlipbookMode = () => {
    const [currentPage, setCurrentPage] = useState(FlipbookPage.FlipbookStartScreen);
    const [selectedFilter, setSelectedFilter] = useState("none");
    const [captureMode, setCaptureMode] = useState("webcam");
    const [videoFile, setVideoFile] = useState(null);
    const [flipbookAssets, setFlipbookAssets] = useState(null);
    const clearVideoFile = () => {
        setVideoFile(null);
        // Optionally, could also reset flipbookAssets here if retaking from VideoPreview
        // setFlipbookAssets(null);
    };
    const renderCurrentView = () => {
        switch (currentPage) {
            case FlipbookPage.FlipbookStartScreen:
                return (_jsx(FlipbookStartScreen, { setCurrentPage: setCurrentPage, setSelectedFilter: setSelectedFilter, setCaptureMode: setCaptureMode }));
            case FlipbookPage.RecordingPage:
                return (_jsx(RecordingPage, { setCurrentPage: setCurrentPage, setVideoFile: setVideoFile, captureMode: captureMode, selectedFilter: selectedFilter }));
            case FlipbookPage.VideoPreview:
                return (_jsx(VideoPreview, { setCurrentPage: setCurrentPage, videoFile: videoFile, selectedFilter: selectedFilter, setFlipbookAssets: setFlipbookAssets, clearVideoFile: clearVideoFile }));
            case FlipbookPage.FlipbookProcessing:
                return (_jsx("div", { className: "min-h-screen mono-gradient flex items-center justify-center p-6", children: _jsx(Card, { className: "glass-card w-full max-w-md text-center", children: _jsxs(CardContent, { className: "p-10", children: [_jsx(Loader2, { className: "h-16 w-16 text-mono-800 animate-spin mx-auto mb-6" }), _jsx("h2", { className: "text-2xl font-semibold text-mono-900 mb-2", children: "Creating Your Flipbook" }), _jsx("p", { className: "text-mono-600", children: "This might take a few moments. Please wait..." })] }) }) }));
            case FlipbookPage.PrintPreview:
                return (_jsx(PrintPreview, { setCurrentPage: setCurrentPage, flipbookAssets: flipbookAssets }));
            default:
                // Reset state if something goes wrong
                setVideoFile(null);
                setFlipbookAssets(null);
                return (_jsx(FlipbookStartScreen, { setCurrentPage: setCurrentPage, setSelectedFilter: setSelectedFilter, setCaptureMode: setCaptureMode }));
        }
    };
    return _jsx("div", { className: "flipbook-mode-container", children: renderCurrentView() });
};
export default FlipbookMode;
