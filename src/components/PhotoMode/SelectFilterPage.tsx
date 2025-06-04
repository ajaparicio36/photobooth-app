import { PhotoModePage } from "@/lib/enums";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Palette, Loader2 } from "lucide-react";

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
    <div className="h-screen mono-gradient flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-mono-200 bg-white/50 backdrop-blur-sm flex-shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setCurrentPage(PhotoModePage.CapturePhotoScreen)}
            className="text-mono-700 hover:text-mono-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Capture
          </Button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-mono-900">Select Filter</h1>
            <p className="text-xs text-mono-600">Enhance your photos</p>
          </div>
          <div className="w-24"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 min-h-0">
        <div className="max-w-6xl mx-auto h-full">
          <div className="grid lg:grid-cols-3 gap-4 h-full">
            {/* Preview Section */}
            <Card className="glass-card lg:col-span-1">
              <CardContent className="p-4 h-full flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="w-4 h-4 text-mono-700" />
                  <h3 className="text-base font-bold text-mono-900">
                    Filter Preview
                  </h3>
                  {selectedFilter && (
                    <Badge variant="secondary" className="text-xs">
                      {availableFilters.find((f) => f.key === selectedFilter)
                        ?.name || selectedFilter}
                    </Badge>
                  )}
                </div>
                <div className="flex-1 flex items-center justify-center">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Filter Preview"
                      className="max-w-full max-h-full object-contain rounded-lg border border-mono-200 shadow-lg"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-mono-100 rounded-lg border border-mono-200 flex items-center justify-center">
                      <div className="text-center text-mono-500">
                        <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
                        <span className="text-xs">Generating preview...</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Filter Selection and Photos */}
            <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
              {/* Filter Selection */}
              <Card className="glass-card flex-shrink-0">
                <CardContent className="p-4">
                  <h3 className="text-base font-bold text-mono-900 mb-3">
                    Choose Filter
                  </h3>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    <button
                      onClick={() => setSelectedFilter("")}
                      className={`flex-shrink-0 p-3 rounded-lg border-2 transition-all duration-200 min-w-[100px] ${
                        !selectedFilter
                          ? "border-mono-900 bg-mono-900 text-white shadow-lg"
                          : "border-mono-200 bg-white hover:border-mono-400 hover:shadow-md"
                      }`}
                    >
                      <div className="text-center">
                        <div className="w-8 h-8 mx-auto mb-1 rounded-lg bg-mono-100 flex items-center justify-center">
                          <div className="w-6 h-6 bg-gradient-to-br from-mono-300 to-mono-500 rounded"></div>
                        </div>
                        <div className="font-bold text-xs">No Filter</div>
                        <div className="text-xs opacity-75">Original</div>
                      </div>
                    </button>
                    {availableFilters.map((filter) => (
                      <button
                        key={filter.key}
                        onClick={() => setSelectedFilter(filter.key)}
                        className={`flex-shrink-0 p-3 rounded-lg border-2 transition-all duration-200 min-w-[100px] ${
                          selectedFilter === filter.key
                            ? "border-mono-900 bg-mono-900 text-white shadow-lg"
                            : "border-mono-200 bg-white hover:border-mono-400 hover:shadow-md"
                        }`}
                      >
                        <div className="text-center">
                          <div className="w-8 h-8 mx-auto mb-1 rounded-lg bg-mono-100 flex items-center justify-center">
                            <Palette className="w-4 h-4 text-mono-600" />
                          </div>
                          <div className="font-bold text-xs">{filter.name}</div>
                          <div className="text-xs opacity-75">
                            {filter.description}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Photos Grid */}
              <Card className="glass-card flex-1 min-h-0">
                <CardContent className="p-4 h-full flex flex-col">
                  <h3 className="text-base font-bold text-mono-900 mb-3">
                    Your Photos
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="text-center">
                        <img
                          src={url}
                          alt={`Photo ${index + 1}`}
                          className="w-full aspect-square object-cover rounded-lg border border-mono-200 shadow-sm"
                        />
                        <Badge variant="outline" className="mt-1 text-xs">
                          Photo {index + 1}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={applyFilterToPhotos}
                    disabled={isApplying}
                    className="bg-mono-900 hover:bg-mono-800 text-white mt-3"
                  >
                    {isApplying ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Applying Filter...
                      </>
                    ) : (
                      <>Continue to Layout</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectFilterPage;
