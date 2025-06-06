import { PhotoModePage, PaperType } from "@/lib/enums";
import React from "react";
interface SelectFilterPageProps {
    photos: File[];
    originalPhotos: File[];
    setPhotos: (photos: File[]) => void;
    setCurrentPage: (page: PhotoModePage) => void;
    paperType: PaperType;
}
declare const SelectFilterPage: React.FC<SelectFilterPageProps>;
export default SelectFilterPage;
