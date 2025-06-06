import CapturePhotoScreen from "@/components/PhotoMode/CapturePhotoScreen";
import ChoosePaperType from "@/components/PhotoMode/ChoosePaperType";
import OrganizeCollage from "@/components/PhotoMode/OrganizeCollage";
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
  const [originalPhotos, setOriginalPhotos] = useState<File[]>([]);
  const [printFile, setPrintFile] = useState<File | null>(null);
  const [jpegPreviewPath, setJpegPreviewPath] = useState<string>("");

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
            setPhotos={(newPhotos) => {
              setPhotos(newPhotos);
              setOriginalPhotos(newPhotos); // Save original photos
            }}
            setCurrentPage={setCurrentPage}
          />
        );
      case PhotoModePage.SelectFilterPage:
        return (
          <SelectFilterPage
            photos={photos}
            originalPhotos={originalPhotos}
            setPhotos={setPhotos}
            setCurrentPage={setCurrentPage}
            paperType={paperType}
          />
        );
      case PhotoModePage.OrganizeCollage:
        return (
          <OrganizeCollage
            paperType={paperType}
            photos={photos}
            setCurrentPage={setCurrentPage}
            setPrintFile={setPrintFile}
            setJpegPreviewPath={setJpegPreviewPath}
          />
        );
      case PhotoModePage.PrintQueue:
        return (
          <PrintQueue printFile={printFile} jpegPreviewPath={jpegPreviewPath} />
        );

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
