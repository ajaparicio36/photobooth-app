import { jsx as _jsx } from "react/jsx-runtime";
import FlipbookStartScreen from "@/components/FlipbookMode/FlipbookStartScreen";
import PrintPreview from "@/components/FlipbookMode/PrintPreview";
import RecordingPage from "@/components/FlipbookMode/RecordingPage";
import VideoPreview from "@/components/FlipbookMode/VideoPreview";
import { FlipbookPage } from "@/lib/enums";
import { useState } from "react";
const FlipbookMode = () => {
    const [currentPage, setCurrentPage] = useState(FlipbookPage.FlipbookStartScreen);
    const [videoFile, setVideoFile] = useState(null);
    const [printFile, setPrintFile] = useState(null);
    const renderCurrentView = () => {
        switch (currentPage) {
            case FlipbookPage.FlipbookStartScreen:
                return _jsx(FlipbookStartScreen, { setCurrentPage: setCurrentPage });
            case FlipbookPage.RecordingPage:
                return (_jsx(RecordingPage, { setCurrentPage: setCurrentPage, setVideoFile: setVideoFile }));
            case FlipbookPage.VideoPreview:
                return (_jsx(VideoPreview, { setCurrentPage: setCurrentPage, videoFile: videoFile, setPrintFile: setPrintFile }));
            case FlipbookPage.PrintPreview:
                return (_jsx(PrintPreview, { setCurrentPage: setCurrentPage, printFile: printFile }));
            default:
                return _jsx(FlipbookStartScreen, { setCurrentPage: setCurrentPage });
        }
    };
    return _jsx("div", { children: renderCurrentView() });
};
export default FlipbookMode;
