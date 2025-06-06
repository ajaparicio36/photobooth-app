import { FlipbookPage } from "@/lib/enums";
import React from "react";
interface PrintPreviewProps {
    setCurrentPage: (page: FlipbookPage) => void;
    flipbookAssets: {
        pages: string[];
        pdfPath: string;
        pageCount: number;
        frameCount: number;
    } | null;
}
declare const PrintPreview: React.FC<PrintPreviewProps>;
export default PrintPreview;
