import { jsx as _jsx } from "react/jsx-runtime";
import CapturePhotoScreen from "@/components/PhotoMode/CapturePhotoScreen";
import ChoosePaperType from "@/components/PhotoMode/ChoosePaperType";
import OrganizeCollage from "@/components/PhotoMode/OrganizeCollage";
import PhotoPreview from "@/components/PhotoMode/PhotoPreview";
import PrintQueue from "@/components/PhotoMode/PrintQueue";
import SelectFilterPage from "@/components/PhotoMode/SelectFilterPage";
import { PaperType, PhotoModePage } from "@/lib/enums";
import { useState } from "react";
const PhotoMode = () => {
    const [currentPage, setCurrentPage] = useState(PhotoModePage.ChoosePaperType);
    const [paperType, setPaperType] = useState(PaperType.FourBySix);
    const [photos, setPhotos] = useState([]);
    const [printFile, setPrintFile] = useState(null);
    const renderCurrentView = () => {
        switch (currentPage) {
            case PhotoModePage.ChoosePaperType:
                return (_jsx(ChoosePaperType, { setCurrentPage: setCurrentPage, setPaperType: setPaperType }));
            case PhotoModePage.CapturePhotoScreen:
                return (_jsx(CapturePhotoScreen, { paperType: paperType, setPhotos: setPhotos, setCurrentPage: setCurrentPage }));
            case PhotoModePage.PhotoPreview:
                return (_jsx(PhotoPreview, { paperType: paperType, photos: photos, setCurrentPage: setCurrentPage }));
            case PhotoModePage.SelectFilterPage:
                return (_jsx(SelectFilterPage, { photos: photos, setPhotos: setPhotos, setCurrentPage: setCurrentPage }));
            case PhotoModePage.OrganizeCollage:
                return (_jsx(OrganizeCollage, { paperType: paperType, photos: photos, setCurrentPage: setCurrentPage, setPrintFile: setPrintFile }));
            case PhotoModePage.PrintQueue:
                return _jsx(PrintQueue, { printFile: printFile });
            default:
                return (_jsx(ChoosePaperType, { setCurrentPage: setCurrentPage, setPaperType: setPaperType }));
        }
    };
    return _jsx("div", { children: renderCurrentView() });
};
export default PhotoMode;
