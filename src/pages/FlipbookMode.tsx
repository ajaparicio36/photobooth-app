import FlipbookStartScreen from "@/components/FlipbookMode/FlipbookStartScreen";
import PrintPreview from "@/components/FlipbookMode/PrintPreview";
import RecordingPage from "@/components/FlipbookMode/RecordingPage";
import VideoPreview from "@/components/FlipbookMode/VideoPreview";
import { FlipbookPage } from "@/lib/enums";
import React, { useState } from "react";

const FlipbookMode: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<FlipbookPage>(
    FlipbookPage.FlipbookStartScreen
  );
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [printFile, setPrintFile] = useState<File | null>(null);

  const renderCurrentView = () => {
    switch (currentPage) {
      case FlipbookPage.FlipbookStartScreen:
        return <FlipbookStartScreen setCurrentPage={setCurrentPage} />;
      case FlipbookPage.RecordingPage:
        return (
          <RecordingPage
            setCurrentPage={setCurrentPage}
            setVideoFile={setVideoFile}
          />
        );
      case FlipbookPage.VideoPreview:
        return (
          <VideoPreview
            setCurrentPage={setCurrentPage}
            videoFile={videoFile}
            setPrintFile={setPrintFile}
          />
        );
      case FlipbookPage.PrintPreview:
        return (
          <PrintPreview setCurrentPage={setCurrentPage} printFile={printFile} />
        );
      default:
        return <FlipbookStartScreen setCurrentPage={setCurrentPage} />;
    }
  };

  return <div>{renderCurrentView()}</div>;
};

export default FlipbookMode;
