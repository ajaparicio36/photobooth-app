import { PaperType, PhotoModePage } from "@/lib/enums";
import React from "react";
interface WebcamCapturePhotoProps {
    setPhotos: (photos: File[]) => void;
    setCurrentPage: (page: PhotoModePage) => void;
    paperType: PaperType;
}
declare const WebcamCapturePhoto: React.FC<WebcamCapturePhotoProps>;
export default WebcamCapturePhoto;
