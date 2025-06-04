import CapturePhotoScreen from "@/components/PhotoMode/CapturePhotoScreen";
import OrganizeCollage from "@/components/PhotoMode/OrganizeCollage";
import PhotoPreview from "@/components/PhotoMode/PhotoPreview";
import PrintQueue from "@/components/PhotoMode/PrintQueue";
import SelectFilterPage from "@/components/PhotoMode/SelectFilterPage";
import { PhotoModePage } from "@/lib/enums";
import React, { useState } from "react";

const PhotoMode: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PhotoModePage>(
    PhotoModePage.CapturePhotoScreen
  );
  const [photos, setPhotos] = useState<File[]>([]);
  const [printFile, setPrintFile] = useState<File | null>(null);

  const renderCurrentView = () => {
    switch (currentPage) {
      case PhotoModePage.CapturePhotoScreen:
        return (
          <CapturePhotoScreen
            setPhotos={setPhotos}
            setCurrentPage={setCurrentPage}
          />
        );
      case PhotoModePage.PhotoPreview:
        return <PhotoPreview photos={photos} setCurrentPage={setCurrentPage} />;
      case PhotoModePage.SelectFilterPage:
        return (
          <SelectFilterPage
            photos={photos}
            setPhotos={setPhotos}
            setCurrentPage={setCurrentPage}
          />
        );
      case PhotoModePage.OrganizeCollage:
        return (
          <OrganizeCollage
            photos={photos}
            setCurrentPage={setCurrentPage}
            setPrintFile={setPrintFile}
          />
        );
      case PhotoModePage.PrintQueue:
        return <PrintQueue printFile={printFile} />;

      default:
        return (
          <CapturePhotoScreen
            setPhotos={setPhotos}
            setCurrentPage={setCurrentPage}
          />
        );
    }
  };

  return <div>{renderCurrentView()}</div>;
};

export default PhotoMode;
