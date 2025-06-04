import { PaperType, PhotoModePage } from "@/lib/enums";
import React from "react";

interface ChoosePaperTypeProps {
  setCurrentPage: (page: PhotoModePage) => void;
  setPaperType: (type: PaperType) => void;
}

const ChoosePaperType: React.FC<ChoosePaperTypeProps> = ({
  setCurrentPage,
  setPaperType,
}) => {
  const handlePaperTypeSelect = (type: PaperType) => {
    setPaperType(type);
    setCurrentPage(PhotoModePage.CapturePhotoScreen);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-8">Choose Paper Type</h1>
      <div className="flex gap-8">
        <button
          onClick={() => handlePaperTypeSelect(PaperType.TwoBySix)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg"
        >
          <div className="text-center">
            <div className="text-xl">2x6</div>
            <div className="text-sm">2 Photos</div>
          </div>
        </button>
        <button
          onClick={() => handlePaperTypeSelect(PaperType.FourBySix)}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg"
        >
          <div className="text-center">
            <div className="text-xl">4x6</div>
            <div className="text-sm">4 Photos</div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default ChoosePaperType;
