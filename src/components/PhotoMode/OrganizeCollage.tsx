import { PhotoModePage } from "@/lib/enums";
import React from "react";

interface OrganizeCollageProps {
  photos: File[];
  setCurrentPage: (page: PhotoModePage) => void;
  setPrintFile: (file: File | null) => void;
}

const OrganizeCollage: React.FC<OrganizeCollageProps> = ({
  photos,
  setCurrentPage,
  setPrintFile,
}) => {
  return <div>OrganizeCollage</div>;
};

export default OrganizeCollage;
