import { PhotoModePage } from "@/lib/enums";
import React from "react";
interface SelectFilterPageProps {
    photos: File[];
    setPhotos: (photos: File[]) => void;
    setCurrentPage: (page: PhotoModePage) => void;
}
declare const SelectFilterPage: React.FC<SelectFilterPageProps>;
export default SelectFilterPage;
