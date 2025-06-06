import { jsx as _jsx } from "react/jsx-runtime";
import CapturePhotoScreen from "@/components/PhotoMode/CapturePhotoScreen";
import ChoosePaperType from "@/components/PhotoMode/ChoosePaperType";
import OrganizeCollage from "@/components/PhotoMode/OrganizeCollage";
import PrintQueue from "@/components/PhotoMode/PrintQueue";
import SelectFilterPage from "@/components/PhotoMode/SelectFilterPage";
import { PaperType, PhotoModePage } from "@/lib/enums";
import { useState } from "react";
const PhotoMode = () => {
    const [currentPage, setCurrentPage] = useState(PhotoModePage.ChoosePaperType);
    const [paperType, setPaperType] = useState(PaperType.FourBySix);
    const [photos, setPhotos] = useState([]);
    const [originalPhotos, setOriginalPhotos] = useState([]);
    const [printFile, setPrintFile] = useState(null);
    const [jpegPreviewPath, setJpegPreviewPath] = useState("");
    const renderCurrentView = () => {
        switch (currentPage) {
            case PhotoModePage.ChoosePaperType:
                return (_jsx(ChoosePaperType, { setCurrentPage: setCurrentPage, setPaperType: setPaperType }));
            case PhotoModePage.CapturePhotoScreen:
                return (_jsx(CapturePhotoScreen, { paperType: paperType, setPhotos: (newPhotos) => {
                        setPhotos(newPhotos);
                        setOriginalPhotos(newPhotos); // Save original photos
                    }, setCurrentPage: setCurrentPage }));
            case PhotoModePage.SelectFilterPage:
                return (_jsx(SelectFilterPage, { photos: photos, originalPhotos: originalPhotos, setPhotos: setPhotos, setCurrentPage: setCurrentPage, paperType: paperType }));
            case PhotoModePage.OrganizeCollage:
                return (_jsx(OrganizeCollage, { paperType: paperType, photos: photos, setCurrentPage: setCurrentPage, setPrintFile: setPrintFile, setJpegPreviewPath: setJpegPreviewPath }));
            case PhotoModePage.PrintQueue:
                return (_jsx(PrintQueue, { printFile: printFile, jpegPreviewPath: jpegPreviewPath }));
            default:
                return (_jsx(ChoosePaperType, { setCurrentPage: setCurrentPage, setPaperType: setPaperType }));
        }
    };
    return _jsx("div", { children: renderCurrentView() });
};
export default PhotoMode;
