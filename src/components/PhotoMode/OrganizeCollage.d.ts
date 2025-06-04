import { PaperType, PhotoModePage } from "@/lib/enums";
import React from "react";
interface OrganizeCollageProps {
    photos: File[];
    setCurrentPage: (page: PhotoModePage) => void;
    setPrintFile: (file: File | null) => void;
    paperType: PaperType;
}
declare const OrganizeCollage: React.FC<OrganizeCollageProps>;
export default OrganizeCollage;
