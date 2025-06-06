import { FlipbookPage } from "@/lib/enums";
import React from "react";
interface RecordingPageProps {
    setCurrentPage: (page: FlipbookPage) => void;
    setVideoFile: (file: File | null) => void;
    captureMode: "webcam" | "dslr";
    selectedFilter: string;
}
declare const RecordingPage: React.FC<RecordingPageProps>;
export default RecordingPage;
