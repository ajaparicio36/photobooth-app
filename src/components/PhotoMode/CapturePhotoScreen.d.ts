import { PaperType, PhotoModePage } from "@/lib/enums";
import React from "react";
interface CapturePhotoScreenProps {
    setPhotos: (photos: File[]) => void;
    setCurrentPage: (page: PhotoModePage) => void;
    paperType: PaperType;
}
declare const CapturePhotoScreen: React.FC<CapturePhotoScreenProps>;
export default CapturePhotoScreen;
