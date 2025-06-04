import CapturePhotoScreen from "@/components/PhotoMode/CapturePhotoScreen";
import ChoosePaperType from "@/components/PhotoMode/ChoosePaperType";
import OrganizeCollage from "@/components/PhotoMode/OrganizeCollage";
import PhotoPreview from "@/components/PhotoMode/PhotoPreview";
import PrintQueue from "@/components/PhotoMode/PrintQueue";
import SelectFilterPage from "@/components/PhotoMode/SelectFilterPage";
import { PaperType, PhotoModePage } from "@/lib/enums";
import React, { useState } from "react";

const PhotoMode: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PhotoModePage>(
    PhotoModePage.ChoosePaperType
  );
  const [paperType, setPaperType] = useState<PaperType>(PaperType.FourBySix);
  const [photos, setPhotos] = useState<File[]>([]);
  const [printFile, setPrintFile] = useState<File | null>(null);

  const renderCurrentView = () => {
    switch (currentPage) {
      case PhotoModePage.ChoosePaperType:
        return (
          <ChoosePaperType
            setCurrentPage={setCurrentPage}
            setPaperType={setPaperType}
          />
        );
      case PhotoModePage.CapturePhotoScreen:
        return (
          <CapturePhotoScreen
            paperType={paperType}
            setPhotos={setPhotos}
            setCurrentPage={setCurrentPage}
          />
        );
      case PhotoModePage.PhotoPreview:
        return (
          <PhotoPreview
            paperType={paperType}
            photos={photos}
            setCurrentPage={setCurrentPage}
          />
        );
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
            paperType={paperType}
            photos={photos}
            setCurrentPage={setCurrentPage}
            setPrintFile={setPrintFile}
          />
        );
      case PhotoModePage.PrintQueue:
        return <PrintQueue printFile={printFile} />;

      default:
        return (
          <ChoosePaperType
            setCurrentPage={setCurrentPage}
            setPaperType={setPaperType}
          />
        );
    }
  };

  return <div>{renderCurrentView()}</div>;
};

export default PhotoMode;
