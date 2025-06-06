import { PaperType, PhotoModePage } from "@/lib/enums";
import React from "react";
interface CapturePhotoScreenProps {
    paperType: PaperType;
    setPhotos: (photos: File[]) => void;
    setCurrentPage: (page: PhotoModePage) => void;
}
declare const CapturePhotoScreen: React.FC<CapturePhotoScreenProps>;
export default CapturePhotoScreen;
