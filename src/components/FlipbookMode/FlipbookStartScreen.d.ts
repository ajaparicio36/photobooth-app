import { FlipbookPage } from "@/lib/enums";
import React from "react";
interface FlipbookStartScreenProps {
    setCurrentPage: (page: FlipbookPage) => void;
    setSelectedFilter: (filter: string) => void;
    setCaptureMode: (mode: "webcam" | "dslr") => void;
}
declare const FlipbookStartScreen: React.FC<FlipbookStartScreenProps>;
export default FlipbookStartScreen;
