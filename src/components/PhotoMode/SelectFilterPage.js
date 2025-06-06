import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { PhotoModePage, PaperType, PAPER_TYPE_PHOTO_COUNT } from "@/lib/enums";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Palette, Loader2 } from "lucide-react";
const SelectFilterPage = ({ photos, originalPhotos, setPhotos, setCurrentPage, paperType, }) => {
    const [availableFilters, setAvailableFilters] = useState([]);
    const [selectedFilter, setSelectedFilter] = useState("");
    const [isApplying, setIsApplying] = useState(false);
    const [previewUrls, setPreviewUrls] = useState([]);
    const [previewUrl, setPreviewUrl] = useState("");
    const [selectedPreviewPhotoIndex, setSelectedPreviewPhotoIndex] = useState(0);
    useEffect(() => {
        loadFilters();
        createPreviewUrls();
    }, [photos]);
    const loadFilters = async () => {
        try {
            const filters = await window.electronAPI.getAvailableImageFilters();
            setAvailableFilters(filters);
        }
        catch (error) {
            console.error("Failed to load filters:", error);
        }
    };
    const createPreviewUrls = () => {
        // Always use original photos for display
        const urls = originalPhotos.map((photo) => URL.createObjectURL(photo));
        setPreviewUrls(urls);
    };
    const requiredPhotos = PAPER_TYPE_PHOTO_COUNT[paperType];
    const generatePreview = async () => {
        if (previewUrls.length === 0)
            return;
        try {
            if (!selectedFilter) {
                // No filter - create collage preview with original photos
                const imagePaths = [];
                const photosToUse = originalPhotos.slice(0, requiredPhotos);
                for (let i = 0; i < photosToUse.length; i++) {
                    const tempPath = `/tmp/preview_original_${i}_${Date.now()}.jpg`;
                    const arrayBuffer = await photosToUse[i].arrayBuffer();
                    await window.electronAPI.saveFile(arrayBuffer, tempPath);
                    imagePaths.push(tempPath);
                }
                const outputPath = `/tmp/preview_collage_${Date.now()}.jpg`;
                const result = await window.electronAPI.buildCollage(imagePaths, outputPath, {
                    paperType: paperType === PaperType.TwoBySix ? "2x6" : "4x6",
                    spacing: 10,
                    backgroundColor: "#ffffff",
                });
                const fileData = await window.electronAPI.readFile(result.jpegPath);
                if (fileData.success && fileData.data) {
                    const uint8Array = new Uint8Array(fileData.data);
                    const blob = new Blob([uint8Array], { type: "image/jpeg" });
                    const url = URL.createObjectURL(blob);
                    setPreviewUrl(url);
                }
            }
            else {
                // Apply filter to selected original photo for preview
                const photoToPreview = originalPhotos[selectedPreviewPhotoIndex];
                const tempPath = `/tmp/preview_original_${Date.now()}.jpg`;
                const outputPath = `/tmp/preview_filtered_${Date.now()}.jpg`;
                const arrayBuffer = await photoToPreview.arrayBuffer();
                await window.electronAPI.saveFile(arrayBuffer, tempPath);
                const filterResult = await window.electronAPI.applyImageFilter(tempPath, selectedFilter, outputPath);
                if (filterResult.success && filterResult.outputPath) {
                    const fileResponse = await window.electronAPI.readFile(filterResult.outputPath);
                    if (fileResponse.success && fileResponse.data) {
                        const uint8Array = new Uint8Array(fileResponse.data);
                        const blob = new Blob([uint8Array], { type: "image/jpeg" });
                        const url = URL.createObjectURL(blob);
                        setPreviewUrl(url);
                    }
                }
            }
        }
        catch (error) {
            console.error("Failed to generate preview:", error);
        }
    };
    useEffect(() => {
        generatePreview();
    }, [selectedFilter, previewUrls, selectedPreviewPhotoIndex]);
    const applyFilterToPhotos = async () => {
        if (!selectedFilter) {
            // No filter selected - use original photos (only required amount)
            const photosToUse = originalPhotos.slice(0, requiredPhotos);
            setPhotos(photosToUse);
            setCurrentPage(PhotoModePage.OrganizeCollage);
            return;
        }
        setIsApplying(true);
        try {
            const filteredPhotos = [];
            const photosToProcess = originalPhotos.slice(0, requiredPhotos);
            for (let i = 0; i < photosToProcess.length; i++) {
                const photo = photosToProcess[i];
                const tempPath = `/tmp/original_${i}_${Date.now()}.jpg`;
                const outputPath = `/tmp/filtered_${i}_${Date.now()}.jpg`;
                // Save original to temp file
                const arrayBuffer = await photo.arrayBuffer();
                await window.electronAPI.saveFile(arrayBuffer, tempPath);
                // Apply filter
                const filterResult = await window.electronAPI.applyImageFilter(tempPath, selectedFilter, outputPath);
                if (filterResult.success && filterResult.outputPath) {
                    // Read filtered image back
                    const filteredResponse = await window.electronAPI.readFile(filterResult.outputPath);
                    if (filteredResponse.success && filteredResponse.data) {
                        const uint8Array = new Uint8Array(filteredResponse.data);
                        const blob = new Blob([uint8Array], { type: "image/jpeg" });
                        const filteredFile = new File([blob], `filtered_${photo.name}`, {
                            type: "image/jpeg",
                        });
                        filteredPhotos.push(filteredFile);
                    }
                    else {
                        // If filter failed, use original
                        filteredPhotos.push(photo);
                    }
                }
                else {
                    // If filter failed, use original
                    filteredPhotos.push(photo);
                }
            }
            setPhotos(filteredPhotos);
            setCurrentPage(PhotoModePage.OrganizeCollage);
        }
        catch (error) {
            console.error("Failed to apply filters:", error);
            // Continue with original photos if filter fails
            const photosToUse = originalPhotos.slice(0, requiredPhotos);
            setPhotos(photosToUse);
            setCurrentPage(PhotoModePage.OrganizeCollage);
        }
        finally {
            setIsApplying(false);
        }
    };
    return (_jsxs("div", { className: "h-screen mono-gradient flex flex-col overflow-hidden", children: [_jsx("div", { className: "p-4 border-b border-mono-200 bg-white/50 backdrop-blur-sm flex-shrink-0", children: _jsxs("div", { className: "max-w-6xl mx-auto flex items-center justify-between", children: [_jsxs(Button, { variant: "ghost", onClick: () => setCurrentPage(PhotoModePage.CapturePhotoScreen), className: "text-mono-700 hover:text-mono-900", children: [_jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }), "Back to Capture"] }), _jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-xl font-bold text-mono-900", children: "Select Filter" }), _jsx("p", { className: "text-xs text-mono-600", children: "Enhance your photos" })] }), _jsx("div", { className: "w-24" })] }) }), _jsx("div", { className: "flex-1 p-4 min-h-0", children: _jsx("div", { className: "max-w-6xl mx-auto h-full", children: _jsxs("div", { className: "grid lg:grid-cols-3 gap-4 h-full", children: [_jsx(Card, { className: "glass-card lg:col-span-1", children: _jsxs(CardContent, { className: "p-4 h-full flex flex-col", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(Palette, { className: "w-4 h-4 text-mono-700" }), _jsx("h3", { className: "text-base font-bold text-mono-900", children: "Filter Preview" }), selectedFilter && (_jsx(Badge, { variant: "secondary", className: "text-xs", children: availableFilters.find((f) => f.key === selectedFilter)
                                                        ?.name || selectedFilter }))] }), _jsx("div", { className: "flex-1 flex items-center justify-center", children: previewUrl ? (_jsx("img", { src: previewUrl, alt: "Filter Preview", className: "max-w-full max-h-full object-contain rounded-lg border border-mono-200 shadow-lg" })) : (_jsx("div", { className: "w-full aspect-square bg-mono-100 rounded-lg border border-mono-200 flex items-center justify-center", children: _jsxs("div", { className: "text-center text-mono-500", children: [_jsx(Loader2, { className: "w-6 h-6 mx-auto mb-2 animate-spin" }), _jsx("span", { className: "text-xs", children: "Generating preview..." })] }) })) })] }) }), _jsxs("div", { className: "lg:col-span-2 flex flex-col gap-4 min-h-0", children: [_jsx(Card, { className: "glass-card flex-shrink-0", children: _jsxs(CardContent, { className: "p-4", children: [_jsx("h3", { className: "text-base font-bold text-mono-900 mb-3", children: "Choose Filter" }), _jsxs("div", { className: "flex gap-3 overflow-x-auto pb-2", children: [_jsx("button", { onClick: () => setSelectedFilter(""), className: `flex-shrink-0 p-3 rounded-lg border-2 transition-all duration-200 min-w-[100px] ${!selectedFilter
                                                                ? "border-mono-900 bg-mono-900 text-white shadow-lg"
                                                                : "border-mono-200 bg-white hover:border-mono-400 hover:shadow-md"}`, children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-8 h-8 mx-auto mb-1 rounded-lg bg-mono-100 flex items-center justify-center", children: _jsx("div", { className: "w-6 h-6 bg-gradient-to-br from-mono-300 to-mono-500 rounded" }) }), _jsx("div", { className: "font-bold text-xs", children: "No Filter" }), _jsx("div", { className: "text-xs opacity-75", children: "Original" })] }) }), availableFilters.map((filter) => (_jsx("button", { onClick: () => setSelectedFilter(filter.key), className: `flex-shrink-0 p-3 rounded-lg border-2 transition-all duration-200 min-w-[100px] ${selectedFilter === filter.key
                                                                ? "border-mono-900 bg-mono-900 text-white shadow-lg"
                                                                : "border-mono-200 bg-white hover:border-mono-400 hover:shadow-md"}`, children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-8 h-8 mx-auto mb-1 rounded-lg bg-mono-100 flex items-center justify-center", children: _jsx(Palette, { className: "w-4 h-4 text-mono-600" }) }), _jsx("div", { className: "font-bold text-xs", children: filter.name }), _jsx("div", { className: "text-xs opacity-75", children: filter.description })] }) }, filter.key)))] })] }) }), _jsx(Card, { className: "glass-card flex-1 min-h-0", children: _jsxs(CardContent, { className: "p-4 h-full flex flex-col", children: [_jsxs("h3", { className: "text-base font-bold text-mono-900 mb-3", children: ["Your Photos ", selectedFilter && "(Click to preview filter)"] }), _jsx("div", { className: `grid gap-3 flex-1 ${requiredPhotos === 2
                                                        ? "grid-cols-2"
                                                        : "grid-cols-2 md:grid-cols-4"}`, children: previewUrls.slice(0, requiredPhotos).map((url, index) => (_jsxs("div", { className: "text-center", children: [_jsx("button", { onClick: () => setSelectedPreviewPhotoIndex(index), className: `w-full group ${selectedFilter &&
                                                                    selectedPreviewPhotoIndex === index
                                                                    ? "ring-2 ring-mono-900 ring-offset-2"
                                                                    : ""}`, disabled: !selectedFilter, children: _jsx("img", { src: url, alt: `Photo ${index + 1}`, className: `w-full aspect-square object-cover rounded-lg border border-mono-200 shadow-sm transition-all ${selectedFilter
                                                                        ? "group-hover:shadow-md group-hover:border-mono-400 cursor-pointer"
                                                                        : ""}` }) }), _jsxs(Badge, { variant: selectedFilter &&
                                                                    selectedPreviewPhotoIndex === index
                                                                    ? "default"
                                                                    : "outline", className: "mt-1 text-xs", children: ["Photo ", index + 1] })] }, index))) }), _jsx(Button, { onClick: applyFilterToPhotos, disabled: isApplying, className: "bg-mono-900 hover:bg-mono-800 text-white mt-3", children: isApplying ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }), "Applying Filter..."] })) : (_jsx(_Fragment, { children: "Continue to Layout" })) })] }) })] })] }) }) })] }));
};
export default SelectFilterPage;
