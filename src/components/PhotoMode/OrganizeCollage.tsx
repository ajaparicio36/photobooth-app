import { PaperType, PhotoModePage, PAPER_TYPE_PHOTO_COUNT } from "@/lib/enums";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, GripVertical, Loader2, Layout } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface OrganizeCollageProps {
  photos: File[];
  setCurrentPage: (page: PhotoModePage) => void;
  setPrintFile: (file: File | null) => void;
  setJpegPreviewPath: (path: string) => void;
  paperType: PaperType;
}

interface SortablePhotoProps {
  id: string;
  photo: File;
  index: number;
  originalIndex: number; // Add original index
}

const SortablePhoto: React.FC<SortablePhotoProps> = ({
  id,
  photo,
  index,
  originalIndex,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [previewUrl, setPreviewUrl] = useState<string>("");

  useEffect(() => {
    const url = URL.createObjectURL(photo);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`glass-card cursor-move transition-all duration-200 group ${
        isDragging ? "shadow-lg scale-105" : "hover:shadow-md"
      }`}
    >
      <CardContent className="p-2">
        <div className="flex items-center justify-between mb-1">
          <Badge variant="secondary" className="text-xs px-1 py-0">
            {originalIndex + 1}
          </Badge>
          <GripVertical className="w-3 h-3 text-mono-400 group-hover:text-mono-600" />
        </div>
        <img
          src={previewUrl}
          alt={`Photo ${originalIndex + 1}`}
          className="w-full aspect-square object-cover rounded"
        />
      </CardContent>
    </Card>
  );
};

const OrganizeCollage: React.FC<OrganizeCollageProps> = ({
  photos,
  setCurrentPage,
  setPrintFile,
  setJpegPreviewPath,
  paperType,
}) => {
  const [organizedPhotos, setOrganizedPhotos] = useState(photos);
  const [originalIndices, setOriginalIndices] = useState<number[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const requiredPhotos = PAPER_TYPE_PHOTO_COUNT[paperType];
  const is2x6Layout = paperType === PaperType.TwoBySix;

  useEffect(() => {
    // Only use the required number of photos
    const photosToUse = photos.slice(0, requiredPhotos);
    setOrganizedPhotos(photosToUse);
    setOriginalIndices(photosToUse.map((_, index) => index));
  }, [photos, requiredPhotos]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setOrganizedPhotos((items) => {
        const oldIndex = items.findIndex(
          (_, index) => `photo-${index}` === active.id
        );
        const newIndex = items.findIndex(
          (_, index) => `photo-${index}` === over?.id
        );

        return arrayMove(items, oldIndex, newIndex);
      });

      setOriginalIndices((indices) => {
        const oldIndex = organizedPhotos.findIndex(
          (_, index) => `photo-${index}` === active.id
        );
        const newIndex = organizedPhotos.findIndex(
          (_, index) => `photo-${index}` === over?.id
        );

        return arrayMove(indices, oldIndex, newIndex);
      });
    }
  };

  const buildCollage = async () => {
    setIsBuilding(true);
    try {
      // Only use the required number of photos
      const photosToUse = organizedPhotos.slice(0, requiredPhotos);

      // Save photos to temp files
      const imagePaths: string[] = [];
      for (let i = 0; i < photosToUse.length; i++) {
        const photo = photosToUse[i];
        const tempPath = `/tmp/collage_photo_${i}_${Date.now()}.jpg`;
        const arrayBuffer = await photo.arrayBuffer();
        await window.electronAPI.saveFile(arrayBuffer, tempPath);
        imagePaths.push(tempPath);
      }

      const outputPath = `/tmp/collage_${Date.now()}.jpg`;
      const collageOptions = {
        paperType,
        spacing: 10,
        backgroundColor: "#ffffff",
      };

      const result = await window.electronAPI.buildCollage(
        imagePaths,
        outputPath,
        collageOptions
      );

      // Set the JPEG preview path for the PrintQueue component
      setJpegPreviewPath(result.jpegPath);

      // Read the PDF file if available, otherwise use JPEG
      let printFilePath = result.pdfPath || result.jpegPath;
      const fileResponse = await window.electronAPI.readFile(printFilePath);

      if (!fileResponse.success || !fileResponse.data) {
        throw new Error(
          `Failed to read file: ${fileResponse.error || "Unknown error"}`
        );
      }

      // Convert the number array back to Uint8Array for blob creation
      const uint8Array = new Uint8Array(fileResponse.data);
      const fileType = result.pdfPath ? "application/pdf" : "image/jpeg";
      const fileName = result.pdfPath
        ? `collage_${Date.now()}.pdf`
        : `collage_${Date.now()}.jpg`;

      const blob = new Blob([uint8Array], { type: fileType });
      const printFile = new File([blob], fileName, { type: fileType });

      setPrintFile(printFile);
      setCurrentPage(PhotoModePage.PrintQueue);
    } catch (error) {
      console.error("Failed to build collage:", error);
    } finally {
      setIsBuilding(false);
    }
  };

  return (
    <div className="h-screen mono-gradient flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-mono-200 bg-white/50 backdrop-blur-sm flex-shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage(PhotoModePage.SelectFilterPage)}
            className="text-mono-700 hover:text-mono-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Filters
          </Button>
          <div className="text-center">
            <h1 className="text-lg font-bold text-mono-900">Organize Layout</h1>
            <div className="flex items-center justify-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {paperType}
              </Badge>
              {is2x6Layout && (
                <Badge variant="outline" className="text-xs">
                  Vertical Mirror Layout
                </Badge>
              )}
            </div>
          </div>
          <div className="w-20"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-3 overflow-auto">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-3 h-full">
            {/* Instructions */}
            <Card className="glass-card lg:col-span-5 flex-shrink-0">
              <CardContent className="p-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Layout className="w-4 h-4 text-mono-700" />
                  <h3 className="text-sm font-bold text-mono-900">
                    Arrange Your Photos
                  </h3>
                  <span className="text-xs text-mono-500">
                    Drag to reorder
                    {is2x6Layout &&
                      " • Photos will be arranged vertically and mirrored horizontally"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Photo Organization */}
            <Card className="glass-card lg:col-span-3 overflow-hidden">
              <CardHeader className="pb-2 px-3 pt-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <GripVertical className="w-4 h-4" />
                  Drag to Reorder
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3 overflow-auto">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={organizedPhotos
                      .slice(0, requiredPhotos)
                      .map((_, index) => `photo-${index}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div
                      className={`grid gap-2 ${
                        is2x6Layout
                          ? "grid-cols-1 max-w-xs mx-auto" // Vertical arrangement for 2x6
                          : requiredPhotos === 4
                          ? "grid-cols-2 max-w-sm mx-auto"
                          : "grid-cols-3 max-w-md mx-auto"
                      }`}
                    >
                      {organizedPhotos
                        .slice(0, requiredPhotos)
                        .map((photo, index) => (
                          <SortablePhoto
                            key={`photo-${index}`}
                            id={`photo-${index}`}
                            photo={photo}
                            index={index}
                            originalIndex={originalIndices[index]}
                          />
                        ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </CardContent>
            </Card>

            {/* Preview and Build Section */}
            <div className="lg:col-span-2 flex flex-col gap-3">
              {is2x6Layout && (
                <Card className="glass-card">
                  <CardHeader className="pb-2 px-3 pt-3">
                    <CardTitle className="text-sm text-center">
                      Final Layout Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <div className="space-y-2">
                      <div className="flex gap-4">
                        <div className="flex-1 text-center">
                          <div className="bg-white border border-dashed border-mono-300 rounded p-2 aspect-[3/4]">
                            <div className="text-xs font-medium text-mono-700 mb-1">
                              Left Side
                            </div>
                            <div className="text-xs text-mono-500">Photo 1</div>
                            <div className="text-xs text-mono-500 mt-1">
                              Photo 2
                            </div>
                            <div className="text-xs text-mono-400">
                              (Original)
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 text-center">
                          <div className="bg-white border border-dashed border-mono-300 rounded p-2 aspect-[3/4]">
                            <div className="text-xs font-medium text-mono-700 mb-1">
                              Right Side
                            </div>
                            <div className="text-xs text-mono-500">Photo 1</div>
                            <div className="text-xs text-mono-500 mt-1">
                              Photo 2
                            </div>
                            <div className="text-xs text-mono-400">
                              (Mirror)
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-1 text-center">
                          <div className="bg-mono-50 border border-dashed border-mono-300 rounded p-1">
                            <div className="text-xs text-mono-600">🏷️ Logo</div>
                          </div>
                        </div>
                        <div className="flex-1 text-center">
                          <div className="bg-mono-50 border border-dashed border-mono-300 rounded p-1">
                            <div className="text-xs text-mono-600">🏷️ Logo</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Build Button */}
              <Card className="glass-card flex-1 flex flex-col justify-end">
                <CardContent className="p-3">
                  <Button
                    onClick={buildCollage}
                    disabled={isBuilding}
                    size="lg"
                    className="bg-mono-900 hover:bg-mono-800 text-white w-full"
                  >
                    {isBuilding ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Building...
                      </>
                    ) : (
                      <>Build Collage & Print</>
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

export default OrganizeCollage;
