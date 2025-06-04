import { PhotoModePage } from "@/lib/enums";
import React, { useEffect } from "react";

interface CapturePhotoScreenProps {
  setPhotos: (photos: File[]) => void;
  setCurrentPage: (page: PhotoModePage) => void;
}

const CapturePhotoScreen: React.FC<CapturePhotoScreenProps> = ({
  setPhotos,
  setCurrentPage,
}) => {
  useEffect(() => {
    setPhotos([]);
  }, []);

  return (
    <div>
      CapturePhotoScreen Done?{" "}
      <button onClick={() => setCurrentPage(PhotoModePage.PhotoPreview)}>
        Go to Photo Preview
      </button>
    </div>
  );
};

export default CapturePhotoScreen;
