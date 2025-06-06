import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FlipbookPage } from "@/lib/enums";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Loader2, Video, Camera } from "lucide-react";
const FlipbookStartScreen = ({ setCurrentPage, setSelectedFilter, setCaptureMode, }) => {
    const [availableFilters, setAvailableFilters] = useState([]);
    const [loadingFilters, setLoadingFilters] = useState(true);
    const [currentFilter, setCurrentFilter] = useState("none"); // Default to no filter
    const [currentMode, setCurrentMode] = useState("webcam");
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                setLoadingFilters(true);
                const filters = await window.electronAPI.getAvailableImageFilters();
                setAvailableFilters([
                    {
                        key: "none",
                        name: "No Filter (Original)",
                        description: "Use original video frames.",
                    },
                    ...filters,
                ]);
            }
            catch (error) {
                console.error("Failed to fetch image filters:", error);
                setAvailableFilters([
                    {
                        key: "none",
                        name: "No Filter (Original)",
                        description: "Use original video frames.",
                    },
                ]); // Fallback
            }
            finally {
                setLoadingFilters(false);
            }
        };
        fetchFilters();
    }, []);
    const handleStart = () => {
        setSelectedFilter(currentFilter);
        setCaptureMode(currentMode);
        setCurrentPage(FlipbookPage.RecordingPage);
    };
    return (_jsx("div", { className: "min-h-screen mono-gradient flex items-center justify-center p-6", children: _jsxs(Card, { className: "glass-card w-full max-w-lg", children: [_jsxs(CardHeader, { className: "text-center", children: [_jsx(CardTitle, { className: "text-3xl font-bold text-mono-900", children: "Flipbook Mode" }), _jsx(CardDescription, { className: "text-mono-600", children: "Create a fun flipbook from a short video! Select your style and camera." })] }), _jsxs(CardContent, { className: "space-y-8 p-8", children: [_jsxs("div", { className: "space-y-3", children: [_jsx(Label, { htmlFor: "filter-select", className: "text-lg font-semibold text-mono-800", children: "Choose a Visual Style" }), loadingFilters ? (_jsxs("div", { className: "flex items-center space-x-2 text-mono-600", children: [_jsx(Loader2, { className: "h-5 w-5 animate-spin" }), _jsx("span", { children: "Loading styles..." })] })) : (_jsxs(Select, { value: currentFilter, onValueChange: setCurrentFilter, disabled: availableFilters.length === 0, children: [_jsx(SelectTrigger, { id: "filter-select", className: "w-full text-base py-3", children: _jsx(SelectValue, { placeholder: "Select a filter style" }) }), _jsx(SelectContent, { children: availableFilters.map((filter) => (_jsx(SelectItem, { value: filter.key, className: "text-base", children: filter.name }, filter.key))) })] })), currentFilter !== "none" &&
                                    availableFilters.find((f) => f.key === currentFilter) && (_jsx("p", { className: "text-xs text-mono-500 pt-1", children: availableFilters.find((f) => f.key === currentFilter)
                                        ?.description }))] }), _jsxs("div", { className: "space-y-3", children: [_jsx(Label, { className: "text-lg font-semibold text-mono-800", children: "Select Camera" }), _jsxs(RadioGroup, { value: currentMode, onValueChange: (value) => setCurrentMode(value), className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [_jsxs(Label, { htmlFor: "webcam-mode", className: `flex flex-col items-center justify-center rounded-md border-2 p-6 cursor-pointer transition-all hover:border-mono-700 ${currentMode === "webcam"
                                                ? "border-mono-900 bg-mono-50 shadow-md"
                                                : "border-mono-300"}`, children: [_jsx(RadioGroupItem, { value: "webcam", id: "webcam-mode", className: "sr-only" }), _jsx(Video, { className: `h-10 w-10 mb-3 ${currentMode === "webcam" ? "text-mono-900" : "text-mono-500"}` }), _jsx("span", { className: `font-semibold text-lg ${currentMode === "webcam" ? "text-mono-900" : "text-mono-700"}`, children: "Webcam" }), _jsx("span", { className: `text-xs ${currentMode === "webcam" ? "text-mono-700" : "text-mono-500"}`, children: "Use built-in camera" })] }), _jsxs(Label, { htmlFor: "dslr-mode", className: `flex flex-col items-center justify-center rounded-md border-2 p-6 cursor-pointer transition-all hover:border-mono-700 ${currentMode === "dslr"
                                                ? "border-mono-900 bg-mono-50 shadow-md"
                                                : "border-mono-300"}`, children: [_jsx(RadioGroupItem, { value: "dslr", id: "dslr-mode", className: "sr-only" }), _jsx(Camera, { className: `h-10 w-10 mb-3 ${currentMode === "dslr" ? "text-mono-900" : "text-mono-500"}` }), _jsx("span", { className: `font-semibold text-lg ${currentMode === "dslr" ? "text-mono-900" : "text-mono-700"}`, children: "DSLR Camera" }), _jsx("span", { className: `text-xs ${currentMode === "dslr" ? "text-mono-700" : "text-mono-500"}`, children: "(Coming Soon)" })] })] }), currentMode === "dslr" && (_jsx("p", { className: "text-xs text-orange-600 pt-1 text-center", children: "DSLR video capture is not yet implemented. Please select Webcam for now." }))] }), _jsx(Button, { onClick: handleStart, size: "lg", className: "w-full bg-mono-900 hover:bg-mono-800 text-white text-lg py-4 mt-4", disabled: loadingFilters || currentMode === "dslr", children: "Start Recording Session" })] })] }) }));
};
export default FlipbookStartScreen;
