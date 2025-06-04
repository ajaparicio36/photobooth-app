import { FlipbookPage } from "@/lib/enums";
import React from "react";

interface VideoPreviewProps {
  setCurrentPage: (page: FlipbookPage) => void;
  videoFile: File | null;
  setPrintFile: (file: File | null) => void;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({
  setCurrentPage,
  videoFile,
  setPrintFile,
}) => {
  return <div>VideoPreview</div>;
};

export default VideoPreview;
