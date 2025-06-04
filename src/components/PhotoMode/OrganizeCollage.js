import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
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
    return (_jsx(Card, { ref: setNodeRef, style: style, ...attributes, ...listeners, className: `glass-card cursor-move transition-all duration-200 group ${isDragging ? "shadow-2xl scale-105" : "hover:shadow-lg"}`, children: _jsxs(CardContent, { className: "p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs(Badge, { variant: "secondary", className: "text-xs", children: ["Photo ", originalIndex + 1] }), _jsx(GripVertical, { className: "w-4 h-4 text-mono-400 group-hover:text-mono-600" })] }), _jsx("img", { src: previewUrl, alt: `Photo ${originalIndex + 1}`, className: "w-full aspect-square object-cover rounded-lg" })] }) }));
};
const OrganizeCollage = ({ photos, setCurrentPage, setPrintFile, paperType, }) => {
    const [organizedPhotos, setOrganizedPhotos] = useState(photos);
    const [originalIndices, setOriginalIndices] = useState([]);
    const [isBuilding, setIsBuilding] = useState(false);
    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
    }));
    const requiredPhotos = PAPER_TYPE_PHOTO_COUNT[paperType];
    const is2x6Layout = paperType === PaperType.TwoBySix;
    useEffect(() => {
        setOrganizedPhotos(photos);
        setOriginalIndices(photos.map((_, index) => index));
    }, [photos]);
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
            // Save photos to temp files
            const imagePaths = [];
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
            const result = await window.electronAPI.buildCollage(finalImagePaths, outputPath, collageOptions);
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
    return (_jsxs("div", { className: "h-screen mono-gradient flex flex-col overflow-hidden", children: [_jsx("div", { className: "p-4 border-b border-mono-200 bg-white/50 backdrop-blur-sm flex-shrink-0", children: _jsxs("div", { className: "max-w-6xl mx-auto flex items-center justify-between", children: [_jsxs(Button, { variant: "ghost", onClick: () => setCurrentPage(PhotoModePage.SelectFilterPage), className: "text-mono-700 hover:text-mono-900", children: [_jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }), "Back to Filters"] }), _jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-xl font-bold text-mono-900", children: "Organize Layout" }), _jsxs("div", { className: "flex items-center justify-center gap-2 mt-1", children: [_jsx(Badge, { variant: "secondary", className: "text-xs", children: paperType }), is2x6Layout && (_jsx(Badge, { variant: "outline", className: "text-xs", children: "Mirror Layout" }))] })] }), _jsx("div", { className: "w-24" })] }) }), _jsx("div", { className: "flex-1 p-4 min-h-0", children: _jsx("div", { className: "max-w-4xl mx-auto h-full", children: _jsxs("div", { className: "grid lg:grid-cols-3 gap-4 h-full", children: [_jsx(Card, { className: "glass-card lg:col-span-3 flex-shrink-0", children: _jsxs(CardContent, { className: "p-4 text-center", children: [_jsxs("div", { className: "flex items-center justify-center gap-2 mb-2", children: [_jsx(Layout, { className: "w-4 h-4 text-mono-700" }), _jsx("h3", { className: "text-base font-bold text-mono-900", children: "Arrange Your Photos" })] }), _jsx("p", { className: "text-mono-600 text-sm mb-1", children: "Drag and drop photos to organize your collage layout" }), is2x6Layout && (_jsx("p", { className: "text-xs text-mono-500", children: "Photos will be duplicated on the right side for 2\u00D76 format" }))] }) }), _jsxs(Card, { className: "glass-card lg:col-span-2 min-h-0", children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "flex items-center gap-2 text-base", children: [_jsx(GripVertical, { className: "w-4 h-4" }), "Drag to Reorder"] }) }), _jsx(CardContent, { className: "flex-1 min-h-0", children: _jsx(DndContext, { sensors: sensors, collisionDetection: closestCenter, onDragEnd: handleDragEnd, children: _jsx(SortableContext, { items: organizedPhotos.map((_, index) => `photo-${index}`), strategy: verticalListSortingStrategy, children: _jsx("div", { className: `grid gap-3 h-full ${is2x6Layout
                                                        ? "grid-cols-1 max-w-xs mx-auto"
                                                        : "grid-cols-2 max-w-lg mx-auto"}`, children: organizedPhotos
                                                        .slice(0, requiredPhotos)
                                                        .map((photo, index) => (_jsx(SortablePhoto, { id: `photo-${index}`, photo: photo, index: index, originalIndex: originalIndices[index] }, `photo-${index}`))) }) }) }) })] }), _jsxs("div", { className: "lg:col-span-1 flex flex-col gap-4", children: [is2x6Layout && (_jsx(Card, { className: "glass-card flex-1", children: _jsxs(CardContent, { className: "p-4 h-full flex flex-col", children: [_jsx("h4", { className: "font-bold text-mono-900 mb-3 text-center text-sm", children: "Final Layout Preview (2\u00D76)" }), _jsxs("div", { className: "flex gap-2 flex-1", children: [_jsx("div", { className: "flex-1 text-center", children: _jsxs("div", { className: "bg-white border-2 border-dashed border-mono-300 rounded-lg p-2 h-full flex flex-col justify-center", children: [_jsx("div", { className: "text-xs font-medium text-mono-700 mb-1", children: "Left Side" }), _jsx("div", { className: "text-xs text-mono-500", children: "Your arrangement" })] }) }), _jsx("div", { className: "flex-1 text-center", children: _jsxs("div", { className: "bg-white border-2 border-dashed border-mono-300 rounded-lg p-2 h-full flex flex-col justify-center", children: [_jsx("div", { className: "text-xs font-medium text-mono-700 mb-1", children: "Right Side" }), _jsx("div", { className: "text-xs text-mono-500", children: "Duplicate copy" })] }) })] })] }) })), _jsx(Card, { className: "glass-card flex-shrink-0", children: _jsx(CardContent, { className: "p-4 text-center", children: _jsx(Button, { onClick: buildCollage, disabled: isBuilding, size: "lg", className: "bg-mono-900 hover:bg-mono-800 text-white w-full", children: isBuilding ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }), "Building..."] })) : (_jsx(_Fragment, { children: "Build Collage & Print" })) }) }) })] })] }) }) })] }));
};
export default OrganizeCollage;
