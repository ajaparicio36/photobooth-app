import { PhotoModePage } from "@/lib/enums";
import React from "react";

interface SelectFilterPageProps {
  photos: File[];
  setPhotos: (photos: File[]) => void;
  setCurrentPage: (page: PhotoModePage) => void;
}

const SelectFilterPage: React.FC<SelectFilterPageProps> = ({
  photos,
  setPhotos,
  setCurrentPage,
}) => {
  const applyFilterToPhotos = async () => {
    setPhotos([]); // Clear existing photos
  };
  return (
    <div>
      <h2>Select Filter {photos[0].name}</h2>
      {/* Call sharp later and then apply a filter to all photos and set it as the new ones*/}
      <button onClick={() => setCurrentPage(PhotoModePage.OrganizeCollage)}>
        Go to Organize Collage
      </button>
    </div>
  );
};

export default SelectFilterPage;
