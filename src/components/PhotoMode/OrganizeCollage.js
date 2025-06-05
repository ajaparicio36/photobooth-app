import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { PaperType, PhotoModePage, PAPER_TYPE_PHOTO_COUNT } from "@/lib/enums";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, GripVertical, Loader2, Layout } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
const SortablePhoto = ({ id, photo, index, originalIndex, }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging, } = useSortable({ id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };
    const [previewUrl, setPreviewUrl] = useState("");
    useEffect(() => {
        const url = URL.createObjectURL(photo);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [photo]);
    return (_jsx(Card, { ref: setNodeRef, style: style, ...attributes, ...listeners, className: `glass-card cursor-move transition-all duration-200 group ${isDragging ? "shadow-lg scale-105" : "hover:shadow-md"}`, children: _jsxs(CardContent, { className: "p-2", children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx(Badge, { variant: "secondary", className: "text-xs px-1 py-0", children: originalIndex + 1 }), _jsx(GripVertical, { className: "w-3 h-3 text-mono-400 group-hover:text-mono-600" })] }), _jsx("img", { src: previewUrl, alt: `Photo ${originalIndex + 1}`, className: "w-full aspect-square object-cover rounded" })] }) }));
};
const OrganizeCollage = ({ photos, setCurrentPage, setPrintFile, setJpegPreviewPath, paperType, }) => {
    const [organizedPhotos, setOrganizedPhotos] = useState(photos);
    const [originalIndices, setOriginalIndices] = useState([]);
    const [isBuilding, setIsBuilding] = useState(false);
    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
    }));
    const requiredPhotos = PAPER_TYPE_PHOTO_COUNT[paperType];
    const is2x6Layout = paperType === PaperType.TwoBySix;
    useEffect(() => {
        // Only use the required number of photos
        const photosToUse = photos.slice(0, requiredPhotos);
        setOrganizedPhotos(photosToUse);
        setOriginalIndices(photosToUse.map((_, index) => index));
    }, [photos, requiredPhotos]);
    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setOrganizedPhotos((items) => {
                const oldIndex = items.findIndex((_, index) => `photo-${index}` === active.id);
                const newIndex = items.findIndex((_, index) => `photo-${index}` === over?.id);
                return arrayMove(items, oldIndex, newIndex);
            });
            setOriginalIndices((indices) => {
                const oldIndex = organizedPhotos.findIndex((_, index) => `photo-${index}` === active.id);
                const newIndex = organizedPhotos.findIndex((_, index) => `photo-${index}` === over?.id);
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
            const imagePaths = [];
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
            const result = await window.electronAPI.buildCollage(imagePaths, outputPath, collageOptions);
            // Set the JPEG preview path for the PrintQueue component
            setJpegPreviewPath(result.jpegPath);
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
        }
        catch (error) {
            console.error("Failed to build collage:", error);
        }
        finally {
            setIsBuilding(false);
        }
    };
    return (_jsxs("div", { className: "h-screen mono-gradient flex flex-col overflow-hidden", children: [_jsx("div", { className: "p-3 border-b border-mono-200 bg-white/50 backdrop-blur-sm flex-shrink-0", children: _jsxs("div", { className: "max-w-6xl mx-auto flex items-center justify-between", children: [_jsxs(Button, { variant: "ghost", size: "sm", onClick: () => setCurrentPage(PhotoModePage.SelectFilterPage), className: "text-mono-700 hover:text-mono-900", children: [_jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }), "Back to Filters"] }), _jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-lg font-bold text-mono-900", children: "Organize Layout" }), _jsxs("div", { className: "flex items-center justify-center gap-2 mt-1", children: [_jsx(Badge, { variant: "secondary", className: "text-xs", children: paperType }), is2x6Layout && (_jsx(Badge, { variant: "outline", className: "text-xs", children: "Vertical Mirror Layout" }))] })] }), _jsx("div", { className: "w-20" })] }) }), _jsx("div", { className: "flex-1 p-3 overflow-auto", children: _jsx("div", { className: "max-w-5xl mx-auto", children: _jsxs("div", { className: "grid lg:grid-cols-5 gap-3 h-full", children: [_jsx(Card, { className: "glass-card lg:col-span-5 flex-shrink-0", children: _jsx(CardContent, { className: "p-3 text-center", children: _jsxs("div", { className: "flex items-center justify-center gap-2", children: [_jsx(Layout, { className: "w-4 h-4 text-mono-700" }), _jsx("h3", { className: "text-sm font-bold text-mono-900", children: "Arrange Your Photos" }), _jsxs("span", { className: "text-xs text-mono-500", children: ["Drag to reorder", is2x6Layout &&
                                                        " • Photos will be arranged vertically and mirrored horizontally"] })] }) }) }), _jsxs(Card, { className: "glass-card lg:col-span-3 overflow-hidden", children: [_jsx(CardHeader, { className: "pb-2 px-3 pt-3", children: _jsxs(CardTitle, { className: "flex items-center gap-2 text-sm", children: [_jsx(GripVertical, { className: "w-4 h-4" }), "Drag to Reorder"] }) }), _jsx(CardContent, { className: "px-3 pb-3 overflow-auto", children: _jsx(DndContext, { sensors: sensors, collisionDetection: closestCenter, onDragEnd: handleDragEnd, children: _jsx(SortableContext, { items: organizedPhotos
                                                    .slice(0, requiredPhotos)
                                                    .map((_, index) => `photo-${index}`), strategy: verticalListSortingStrategy, children: _jsx("div", { className: `grid gap-2 ${is2x6Layout
                                                        ? "grid-cols-1 max-w-xs mx-auto" // Vertical arrangement for 2x6
                                                        : requiredPhotos === 4
                                                            ? "grid-cols-2 max-w-sm mx-auto"
                                                            : "grid-cols-3 max-w-md mx-auto"}`, children: organizedPhotos
                                                        .slice(0, requiredPhotos)
                                                        .map((photo, index) => (_jsx(SortablePhoto, { id: `photo-${index}`, photo: photo, index: index, originalIndex: originalIndices[index] }, `photo-${index}`))) }) }) }) })] }), _jsxs("div", { className: "lg:col-span-2 flex flex-col gap-3", children: [is2x6Layout && (_jsxs(Card, { className: "glass-card", children: [_jsx(CardHeader, { className: "pb-2 px-3 pt-3", children: _jsx(CardTitle, { className: "text-sm text-center", children: "Final Layout Preview" }) }), _jsx(CardContent, { className: "px-3 pb-3", children: _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex gap-4", children: [_jsx("div", { className: "flex-1 text-center", children: _jsxs("div", { className: "bg-white border border-dashed border-mono-300 rounded p-2 aspect-[3/4]", children: [_jsx("div", { className: "text-xs font-medium text-mono-700 mb-1", children: "Left Side" }), _jsx("div", { className: "text-xs text-mono-500", children: "Photo 1" }), _jsx("div", { className: "text-xs text-mono-500 mt-1", children: "Photo 2" }), _jsx("div", { className: "text-xs text-mono-400", children: "(Original)" })] }) }), _jsx("div", { className: "flex-1 text-center", children: _jsxs("div", { className: "bg-white border border-dashed border-mono-300 rounded p-2 aspect-[3/4]", children: [_jsx("div", { className: "text-xs font-medium text-mono-700 mb-1", children: "Right Side" }), _jsx("div", { className: "text-xs text-mono-500", children: "Photo 1" }), _jsx("div", { className: "text-xs text-mono-500 mt-1", children: "Photo 2" }), _jsx("div", { className: "text-xs text-mono-400", children: "(Mirror)" })] }) })] }), _jsxs("div", { className: "flex gap-4", children: [_jsx("div", { className: "flex-1 text-center", children: _jsx("div", { className: "bg-mono-50 border border-dashed border-mono-300 rounded p-1", children: _jsx("div", { className: "text-xs text-mono-600", children: "\uD83C\uDFF7\uFE0F Logo" }) }) }), _jsx("div", { className: "flex-1 text-center", children: _jsx("div", { className: "bg-mono-50 border border-dashed border-mono-300 rounded p-1", children: _jsx("div", { className: "text-xs text-mono-600", children: "\uD83C\uDFF7\uFE0F Logo" }) }) })] })] }) })] })), _jsx(Card, { className: "glass-card flex-1 flex flex-col justify-end", children: _jsx(CardContent, { className: "p-3", children: _jsx(Button, { onClick: buildCollage, disabled: isBuilding, size: "lg", className: "bg-mono-900 hover:bg-mono-800 text-white w-full", children: isBuilding ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }), "Building..."] })) : (_jsx(_Fragment, { children: "Build Collage & Print" })) }) }) })] })] }) }) })] }));
};
export default OrganizeCollage;
