import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PhotoModePage } from "@/lib/enums";
import { useState, useEffect } from "react";
const SelectFilterPage = ({ photos, setPhotos, setCurrentPage, }) => {
    const [availableFilters, setAvailableFilters] = useState([]);
    const [selectedFilter, setSelectedFilter] = useState("");
    const [isApplying, setIsApplying] = useState(false);
    const [previewUrls, setPreviewUrls] = useState([]);
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
        const urls = photos.map((photo) => URL.createObjectURL(photo));
        setPreviewUrls(urls);
    };
    const applyFilterToPhotos = async () => {
        if (!selectedFilter) {
            setCurrentPage(PhotoModePage.OrganizeCollage);
            return;
        }
        setIsApplying(true);
        try {
            const filteredPhotos = [];
            for (let i = 0; i < photos.length; i++) {
                const photo = photos[i];
                const tempPath = `/tmp/original_${i}_${Date.now()}.jpg`;
                const outputPath = `/tmp/filtered_${i}_${Date.now()}.jpg`;
                // Save original to temp file
                const arrayBuffer = await photo.arrayBuffer();
                await window.electronAPI.saveFile(arrayBuffer, tempPath);
                // Apply filter
                const filterResult = await window.electronAPI.applyImageFilter(tempPath, selectedFilter, outputPath);
                if (filterResult.success && filterResult.outputPath) {
                    // Read filtered image back
                    const filteredData = await window.electronAPI.readFile(filterResult.outputPath);
                    const blob = new Blob([filteredData], { type: "image/jpeg" });
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
            setPhotos(filteredPhotos);
            setCurrentPage(PhotoModePage.OrganizeCollage);
        }
        catch (error) {
            console.error("Failed to apply filters:", error);
            // Continue with original photos if filter fails
            setCurrentPage(PhotoModePage.OrganizeCollage);
        }
        finally {
            setIsApplying(false);
        }
    };
    return (_jsxs("div", { className: "flex flex-col items-center justify-center h-screen bg-gray-100 p-4", children: [_jsx("h2", { className: "text-3xl font-bold mb-6", children: "Select Filter" }), _jsx("div", { className: "flex gap-4 mb-6", children: previewUrls.map((url, index) => (_jsx("img", { src: url, alt: `Photo ${index + 1}`, className: "w-32 h-24 object-cover rounded border" }, index))) }), _jsxs("div", { className: "grid grid-cols-3 gap-4 mb-6 max-w-2xl", children: [_jsx("button", { onClick: () => setSelectedFilter(""), className: `p-4 rounded border ${!selectedFilter ? "bg-blue-500 text-white" : "bg-white"}`, children: "No Filter" }), availableFilters.map((filter) => (_jsxs("button", { onClick: () => setSelectedFilter(filter.key), className: `p-4 rounded border ${selectedFilter === filter.key
                            ? "bg-blue-500 text-white"
                            : "bg-white"}`, children: [_jsx("div", { className: "text-sm font-bold", children: filter.name }), _jsx("div", { className: "text-xs", children: filter.description })] }, filter.key)))] }), _jsx("button", { onClick: applyFilterToPhotos, disabled: isApplying, className: "bg-green-500 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-4 px-8 rounded-lg", children: isApplying ? "Applying Filter..." : "Continue" })] }));
};
export default SelectFilterPage;
