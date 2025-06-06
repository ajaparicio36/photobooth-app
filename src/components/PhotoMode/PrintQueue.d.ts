import React from "react";
interface PrintQueueProps {
    printFile: File | null;
    jpegPreviewPath?: string;
}
declare const PrintQueue: React.FC<PrintQueueProps>;
export default PrintQueue;
