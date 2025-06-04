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
        isDragging ? "shadow-2xl scale-105" : "hover:shadow-lg"
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="secondary" className="text-xs">
            Photo {originalIndex + 1}
          </Badge>
          <GripVertical className="w-4 h-4 text-mono-400 group-hover:text-mono-600" />
        </div>
        <img
          src={previewUrl}
          alt={`Photo ${originalIndex + 1}`}
          className="w-full aspect-square object-cover rounded-lg"
        />
      </CardContent>
    </Card>
  );
};

const OrganizeCollage: React.FC<OrganizeCollageProps> = ({
  photos,
  setCurrentPage,
  setPrintFile,
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
    setOrganizedPhotos(photos);
    setOriginalIndices(photos.map((_, index) => index));
  }, [photos]);

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
      // Save photos to temp files
      const imagePaths: string[] = [];
      for (let i = 0; i < organizedPhotos.length; i++) {
        const photo = organizedPhotos[i];
        const tempPath = `/tmp/collage_photo_${i}_${Date.now()}.jpg`;
        const arrayBuffer = await photo.arrayBuffer();
        await window.electronAPI.saveFile(arrayBuffer, tempPath);
        imagePaths.push(tempPath);
      }

      // For 2x6, duplicate photos for left and right side
      let finalImagePaths = imagePaths;
      if (is2x6Layout) {
        finalImagePaths = [...imagePaths, ...imagePaths];
      }

      const outputPath = `/tmp/collage_${Date.now()}.jpg`;
      const collageOptions = {
        paperType,
        spacing: 10,
        backgroundColor: "#ffffff",
      };

      const result = await window.electronAPI.buildCollage(
        finalImagePaths,
        outputPath,
        collageOptions
      );

      // Read the PDF file if available, otherwise use JPEG
      let printFilePath = result.pdfPath || result.jpegPath;
      const fileData = await window.electronAPI.readFile(printFilePath);
      const fileType = result.pdfPath ? "application/pdf" : "image/jpeg";
      const fileName = result.pdfPath
        ? `collage_${Date.now()}.pdf`
        : `collage_${Date.now()}.jpg`;

      const blob = new Blob([fileData], { type: fileType });
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
      <div className="p-4 border-b border-mono-200 bg-white/50 backdrop-blur-sm flex-shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setCurrentPage(PhotoModePage.SelectFilterPage)}
            className="text-mono-700 hover:text-mono-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Filters
          </Button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-mono-900">Organize Layout</h1>
            <div className="flex items-center justify-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {paperType}
              </Badge>
              {is2x6Layout && (
                <Badge variant="outline" className="text-xs">
                  Mirror Layout
                </Badge>
              )}
            </div>
          </div>
          <div className="w-24"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 min-h-0">
        <div className="max-w-4xl mx-auto h-full">
          <div className="grid lg:grid-cols-3 gap-4 h-full">
            {/* Instructions */}
            <Card className="glass-card lg:col-span-3 flex-shrink-0">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Layout className="w-4 h-4 text-mono-700" />
                  <h3 className="text-base font-bold text-mono-900">
                    Arrange Your Photos
                  </h3>
                </div>
                <p className="text-mono-600 text-sm mb-1">
                  Drag and drop photos to organize your collage layout
                </p>
                {is2x6Layout && (
                  <p className="text-xs text-mono-500">
                    Photos will be duplicated on the right side for 2×6 format
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Photo Organization */}
            <Card className="glass-card lg:col-span-2 min-h-0">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <GripVertical className="w-4 h-4" />
                  Drag to Reorder
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={organizedPhotos.map((_, index) => `photo-${index}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div
                      className={`grid gap-3 h-full ${
                        is2x6Layout
                          ? "grid-cols-1 max-w-xs mx-auto"
                          : "grid-cols-2 max-w-lg mx-auto"
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

            {/* 2x6 Layout Preview + Build Button */}
            <div className="lg:col-span-1 flex flex-col gap-4">
              {is2x6Layout && (
                <Card className="glass-card flex-1">
                  <CardContent className="p-4 h-full flex flex-col">
                    <h4 className="font-bold text-mono-900 mb-3 text-center text-sm">
                      Final Layout Preview (2×6)
                    </h4>
                    <div className="flex gap-2 flex-1">
                      <div className="flex-1 text-center">
                        <div className="bg-white border-2 border-dashed border-mono-300 rounded-lg p-2 h-full flex flex-col justify-center">
                          <div className="text-xs font-medium text-mono-700 mb-1">
                            Left Side
                          </div>
                          <div className="text-xs text-mono-500">
                            Your arrangement
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 text-center">
                        <div className="bg-white border-2 border-dashed border-mono-300 rounded-lg p-2 h-full flex flex-col justify-center">
                          <div className="text-xs font-medium text-mono-700 mb-1">
                            Right Side
                          </div>
                          <div className="text-xs text-mono-500">
                            Duplicate copy
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Build Collage Button */}
              <Card className="glass-card flex-shrink-0">
                <CardContent className="p-4 text-center">
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
