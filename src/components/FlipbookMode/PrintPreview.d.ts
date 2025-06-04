import { FlipbookPage } from "@/lib/enums";
import React from "react";
interface PrintPreviewProps {
    setCurrentPage: (page: FlipbookPage) => void;
    printFile: File | null;
}
declare const PrintPreview: React.FC<PrintPreviewProps>;
export default PrintPreview;
