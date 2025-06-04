import { PaperType, PhotoModePage } from "@/lib/enums";
import React from "react";
interface ChoosePaperTypeProps {
    setCurrentPage: (page: PhotoModePage) => void;
    setPaperType: (type: PaperType) => void;
}
declare const ChoosePaperType: React.FC<ChoosePaperTypeProps>;
export default ChoosePaperType;
