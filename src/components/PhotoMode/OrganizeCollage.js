import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { PaperType, PhotoModePage, PAPER_TYPE_PHOTO_COUNT } from "@/lib/enums";
import { useState, useEffect } from "react";
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
    return (_jsxs("div", { ref: setNodeRef, style: style, ...attributes, ...listeners, className: "relative bg-white border-2 border-dashed border-gray-300 rounded-lg p-2 cursor-move hover:border-blue-400 transition-colors", children: [_jsxs("div", { className: "text-xs font-bold mb-1 text-center", children: ["Photo ", originalIndex + 1] }), _jsx("img", { src: previewUrl, alt: `Photo ${originalIndex + 1}`, className: "w-full h-32 object-cover rounded" })] }));
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
    return (_jsxs("div", { className: "flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4", children: [_jsx("h2", { className: "text-3xl font-bold mb-6", children: "Organize Your Collage" }), _jsxs("div", { className: "mb-4 text-center", children: [_jsxs("p", { className: "text-lg", children: ["Paper Type: ", paperType] }), is2x6Layout && (_jsx("p", { className: "text-sm text-gray-600", children: "Organize photos on one side - they will be duplicated on the right" }))] }), _jsxs("div", { className: "bg-white p-6 rounded-lg shadow-lg mb-6", children: [_jsx("h3", { className: "text-xl font-bold mb-4 text-center", children: "Drag to Reorder" }), _jsx(DndContext, { sensors: sensors, collisionDetection: closestCenter, onDragEnd: handleDragEnd, children: _jsx(SortableContext, { items: organizedPhotos.map((_, index) => `photo-${index}`), strategy: verticalListSortingStrategy, children: _jsx("div", { className: `grid gap-4 ${is2x6Layout ? "grid-cols-1 max-w-xs" : "grid-cols-2 max-w-md"}`, children: organizedPhotos.slice(0, requiredPhotos).map((photo, index) => (_jsx(SortablePhoto, { id: `photo-${index}`, photo: photo, index: index, originalIndex: originalIndices[index] }, `photo-${index}`))) }) }) })] }), is2x6Layout && (_jsxs("div", { className: "bg-blue-50 p-4 rounded-lg mb-6 max-w-md", children: [_jsx("h4", { className: "font-bold mb-2", children: "Preview Layout (2x6):" }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("div", { className: "flex-1 text-center text-xs", children: [_jsx("div", { className: "bg-white border rounded p-2", children: "Left Side" }), _jsx("div", { className: "text-gray-600", children: "Your arrangement" })] }), _jsxs("div", { className: "flex-1 text-center text-xs", children: [_jsx("div", { className: "bg-white border rounded p-2", children: "Right Side" }), _jsx("div", { className: "text-gray-600", children: "Duplicate copy" })] })] })] })), _jsx("button", { onClick: buildCollage, disabled: isBuilding, className: "bg-green-500 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-4 px-8 rounded-lg", children: isBuilding ? "Building Collage..." : "Build Collage & Print" })] }));
};
export default OrganizeCollage;
