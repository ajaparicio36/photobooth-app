import { PaperType, PhotoModePage } from "@/lib/enums";
import React from "react";

interface PhotoPreviewProps {
  photos: File[];
  setCurrentPage: (page: PhotoModePage) => void;
  paperType: PaperType;
}

const PhotoPreview: React.FC<PhotoPreviewProps> = ({
  photos,
  setCurrentPage,
  paperType,
}) => {
  return (
    <div>
      PhotoPreview
      {photos.length > 0 ? (
        <ul>
          {photos.map((photo, index) => (
            <li key={index}>
              {photo.name} - {Math.round(photo.size / 1024)} KB
            </li>
          ))}
        </ul>
      ) : (
        <p>No photos captured yet.</p>
      )}
      <div>Done?</div>
      <button onClick={() => setCurrentPage(PhotoModePage.SelectFilterPage)}>
        Go to Select Filter Page
      </button>
    </div>
  );
};

export default PhotoPreview;
