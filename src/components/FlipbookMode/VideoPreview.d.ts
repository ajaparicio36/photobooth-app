import { FlipbookPage } from "@/lib/enums";
import React from "react";
interface VideoPreviewProps {
    setCurrentPage: (page: FlipbookPage) => void;
    videoFile: File | null;
    selectedFilter: string;
    setFlipbookAssets: (assets: {
        pages: string[];
        pdfPath: string;
        pageCount: number;
        frameCount: number;
    }) => void;
    clearVideoFile: () => void;
}
declare const VideoPreview: React.FC<VideoPreviewProps>;
export default VideoPreview;
