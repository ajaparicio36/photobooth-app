import { FlipbookPage } from "@/lib/enums";
import React from "react";

interface PrintPreviewProps {
  setCurrentPage: (page: FlipbookPage) => void;
  printFile: File | null;
}

const PrintPreview: React.FC<PrintPreviewProps> = ({ setCurrentPage }) => {
  return <div>PrintPreview</div>;
};

export default PrintPreview;
