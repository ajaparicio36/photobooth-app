import { PaperType, PhotoModePage } from "../../lib/enums";
import React from "react";
interface PhotoPreviewProps {
  photos: File[];
  setCurrentPage: (page: PhotoModePage) => void;
  paperType: PaperType;
}
declare const PhotoPreview: React.FC<PhotoPreviewProps>;
export default PhotoPreview;
