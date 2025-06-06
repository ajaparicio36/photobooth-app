import { FlipbookPage } from "@/lib/enums";
import React from "react";
interface WebcamCaptureVideoProps {
    setVideoFile: (video: File) => void;
    setCurrentPage: (page: FlipbookPage) => void;
}
declare const WebcamCaptureVideo: React.FC<WebcamCaptureVideoProps>;
export default WebcamCaptureVideo;
