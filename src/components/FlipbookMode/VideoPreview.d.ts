import { FlipbookPage } from "@/lib/enums";
import React from "react";
interface VideoPreviewProps {
    setCurrentPage: (page: FlipbookPage) => void;
    videoFile: File | null;
    setPrintFile: (file: File | null) => void;
}
declare const VideoPreview: React.FC<VideoPreviewProps>;
export default VideoPreview;
