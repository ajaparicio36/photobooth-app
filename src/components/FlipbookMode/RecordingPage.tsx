import { FlipbookPage } from "@/lib/enums";
import React from "react";

interface RecordingPageProps {
  setCurrentPage: (page: FlipbookPage) => void;
  setVideoFile: (file: File | null) => void;
}

const RecordingPage: React.FC<RecordingPageProps> = ({
  setCurrentPage,
  setVideoFile,
}) => {
  return <div>RecordingPage</div>;
};

export default RecordingPage;
