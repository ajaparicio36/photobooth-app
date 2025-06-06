import { PaperType, PhotoModePage } from "@/lib/enums";
import React from "react";
interface Gphoto2CapturePhotoProps {
    setPhotos: (photos: File[]) => void;
    setCurrentPage: (page: PhotoModePage) => void;
    paperType: PaperType;
}
declare const Gphoto2CapturePhoto: React.FC<Gphoto2CapturePhotoProps>;
export default Gphoto2CapturePhoto;
