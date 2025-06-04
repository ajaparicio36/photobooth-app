import { PhotoModePage } from "@/lib/enums";
import React, { useState, useEffect } from "react";

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
  const [availableFilters, setAvailableFilters] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>("");
  const [isApplying, setIsApplying] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  useEffect(() => {
    loadFilters();
    createPreviewUrls();
  }, [photos]);

  useEffect(() => {
    generatePreview();
  }, [selectedFilter, previewUrls]);

  const loadFilters = async () => {
    try {
      const filters = await window.electronAPI.getAvailableImageFilters();
      setAvailableFilters(filters);
    } catch (error) {
      console.error("Failed to load filters:", error);
    }
  };

  const createPreviewUrls = () => {
    const urls = photos.map((photo) => URL.createObjectURL(photo));
    setPreviewUrls(urls);
  };

  const generatePreview = async () => {
    if (previewUrls.length === 0) return;

    try {
      if (!selectedFilter) {
        // No filter - create collage preview with original photos
        const imagePaths: string[] = [];
        for (let i = 0; i < photos.length; i++) {
          const tempPath = `/tmp/preview_original_${i}_${Date.now()}.jpg`;
          const arrayBuffer = await photos[i].arrayBuffer();
          await window.electronAPI.saveFile(arrayBuffer, tempPath);
          imagePaths.push(tempPath);
        }

        const outputPath = `/tmp/preview_collage_${Date.now()}.jpg`;
        const result = await window.electronAPI.buildCollage(
          imagePaths,
          outputPath,
          {
            paperType: "4x6",
            spacing: 10,
            backgroundColor: "#ffffff",
          }
        );

        const fileData = await window.electronAPI.readFile(result.jpegPath);
        const blob = new Blob([fileData], { type: "image/jpeg" });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      } else {
        // Apply filter to first photo for preview
        const tempPath = `/tmp/preview_original_${Date.now()}.jpg`;
        const outputPath = `/tmp/preview_filtered_${Date.now()}.jpg`;

        const arrayBuffer = await photos[0].arrayBuffer();
        await window.electronAPI.saveFile(arrayBuffer, tempPath);

        const filterResult = await window.electronAPI.applyImageFilter(
          tempPath,
          selectedFilter,
          outputPath
        );

        if (filterResult.success && filterResult.outputPath) {
          const fileData = await window.electronAPI.readFile(
            filterResult.outputPath
          );
          const blob = new Blob([fileData], { type: "image/jpeg" });
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
        }
      }
    } catch (error) {
      console.error("Failed to generate preview:", error);
    }
  };

  const applyFilterToPhotos = async () => {
    if (!selectedFilter) {
      setCurrentPage(PhotoModePage.OrganizeCollage);
      return;
    }

    setIsApplying(true);
    try {
      const filteredPhotos: File[] = [];

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        const tempPath = `/tmp/original_${i}_${Date.now()}.jpg`;
        const outputPath = `/tmp/filtered_${i}_${Date.now()}.jpg`;

        // Save original to temp file
        const arrayBuffer = await photo.arrayBuffer();
        await window.electronAPI.saveFile(arrayBuffer, tempPath);

        // Apply filter
        const filterResult = await window.electronAPI.applyImageFilter(
          tempPath,
          selectedFilter,
          outputPath
        );

        if (filterResult.success && filterResult.outputPath) {
          // Read filtered image back
          const filteredData = await window.electronAPI.readFile(
            filterResult.outputPath
          );
          const blob = new Blob([filteredData], { type: "image/jpeg" });
          const filteredFile = new File([blob], `filtered_${photo.name}`, {
            type: "image/jpeg",
          });
          filteredPhotos.push(filteredFile);
        } else {
          // If filter failed, use original
          filteredPhotos.push(photo);
        }
      }

      setPhotos(filteredPhotos);
      setCurrentPage(PhotoModePage.OrganizeCollage);
    } catch (error) {
      console.error("Failed to apply filters:", error);
      // Continue with original photos if filter fails
      setCurrentPage(PhotoModePage.OrganizeCollage);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h2 className="text-3xl font-bold mb-6">Select Filter</h2>

      {/* Preview Section */}
      <div className="bg-white p-4 rounded-lg shadow-lg mb-6">
        <h3 className="text-lg font-bold mb-2 text-center">Preview</h3>
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Filter Preview"
            className="w-64 h-48 object-cover rounded border"
          />
        ) : (
          <div className="w-64 h-48 bg-gray-200 rounded border flex items-center justify-center">
            <span className="text-gray-500">Generating preview...</span>
          </div>
        )}
      </div>

      {/* Filter Selection - Horizontal Scroll */}
      <div className="w-full max-w-4xl mb-6">
        <h3 className="text-lg font-bold mb-4 text-center">Choose Filter</h3>
        <div className="flex gap-4 overflow-x-auto pb-4 px-4">
          <button
            onClick={() => setSelectedFilter("")}
            className={`flex-shrink-0 p-4 rounded border min-w-[120px] ${
              !selectedFilter ? "bg-blue-500 text-white" : "bg-white"
            }`}
          >
            <div className="text-sm font-bold">No Filter</div>
            <div className="text-xs">Original</div>
          </button>
          {availableFilters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setSelectedFilter(filter.key)}
              className={`flex-shrink-0 p-4 rounded border min-w-[120px] ${
                selectedFilter === filter.key
                  ? "bg-blue-500 text-white"
                  : "bg-white"
              }`}
            >
              <div className="text-sm font-bold">{filter.name}</div>
              <div className="text-xs">{filter.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Photos Grid - 2x2 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {previewUrls.map((url, index) => (
          <div key={index} className="text-center">
            <img
              src={url}
              alt={`Photo ${index + 1}`}
              className="w-48 h-36 object-cover rounded border"
            />
            <div className="text-sm font-bold mt-2">Photo {index + 1}</div>
          </div>
        ))}
      </div>

      <button
        onClick={applyFilterToPhotos}
        disabled={isApplying}
        className="bg-green-500 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-4 px-8 rounded-lg"
      >
        {isApplying ? "Applying Filter..." : "Continue"}
      </button>
    </div>
  );
};

export default SelectFilterPage;
