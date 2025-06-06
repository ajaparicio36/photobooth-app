import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FlipbookPage } from "@/lib/enums";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, } from "@/components/ui/card";
import { Printer, RotateCcw, Image as ImageIcon, AlertTriangle, Loader2, } from "lucide-react";
const PrintPreview = ({ setCurrentPage, flipbookAssets, }) => {
    const [previewImage, setPreviewImage] = useState(null);
    const [isPrinting, setIsPrinting] = useState(false);
    const [printError, setPrintError] = useState(null);
    const [printers, setPrinters] = useState([]);
    const [selectedPrinter, setSelectedPrinter] = useState(undefined);
    useEffect(() => {
        if (flipbookAssets && flipbookAssets.pages.length > 0) {
            const loadPreview = async () => {
                try {
                    // Read the file as base64 for display in the renderer
                    const imageData = await window.electronAPI.readFile(flipbookAssets.pages[0]);
                    // Fix type checking - the response should have success and data properties
                    if (imageData &&
                        typeof imageData === "object" &&
                        "success" in imageData &&
                        imageData.success &&
                        "data" in imageData &&
                        imageData.data) {
                        // Convert buffer to base64 data URL
                        const base64 = btoa(new Uint8Array(imageData.data).reduce((data, byte) => data + String.fromCharCode(byte), ""));
                        setPreviewImage(`data:image/jpeg;base64,${base64}`);
                    }
                    else {
                        throw new Error("Failed to read image file");
                    }
                }
                catch (e) {
                    console.error("Error loading preview image:", e);
                    setPrintError("Could not load preview image.");
                }
            };
            loadPreview();
        }
        // Fetch available printers
        const fetchPrinters = async () => {
            try {
                const availablePrinters = await window.electronAPI.getAvailablePrinters();
                setPrinters(availablePrinters);
                const defaultPrinter = availablePrinters.find((p) => p.isDefault);
                if (defaultPrinter) {
                    setSelectedPrinter(defaultPrinter.name);
                }
                else if (availablePrinters.length > 0) {
                    setSelectedPrinter(availablePrinters[0].name);
                }
            }
            catch (error) {
                console.error("Failed to fetch printers:", error);
                setPrintError("Could not fetch printer list.");
            }
        };
        fetchPrinters();
    }, [flipbookAssets]);
    const handlePrint = async () => {
        if (!flipbookAssets || !flipbookAssets.pdfPath) {
            setPrintError("No PDF file available to print.");
            return;
        }
        setIsPrinting(true);
        setPrintError(null);
        try {
            // Assuming printImage can handle PDF paths
            const result = await window.electronAPI.printImage(flipbookAssets.pdfPath, selectedPrinter, {
            // Add any specific PDF print options here if supported
            // e.g., paperSize: 'A6' - though PDF is already A6
            });
            console.log("Print job status:", result);
            // Handle result: success/error message
            // For now, just log and stop loading
        }
        catch (error) {
            console.error("Printing failed:", error);
            setPrintError(`Printing failed: ${error.message || "Unknown error"}`);
        }
        finally {
            setIsPrinting(false);
        }
    };
    const handleStartOver = () => {
        // Potentially cleanup generated files on backend if needed
        setCurrentPage(FlipbookPage.FlipbookStartScreen);
    };
    if (!flipbookAssets) {
        return (_jsx("div", { className: "min-h-screen mono-gradient flex items-center justify-center p-6", children: _jsxs(Card, { className: "glass-card w-full max-w-md text-center", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-2xl font-bold text-mono-900", children: "Generating Flipbook..." }) }), _jsxs(CardContent, { className: "p-8", children: [_jsx(Loader2, { className: "h-12 w-12 text-mono-700 mx-auto animate-spin mb-4" }), _jsx("p", { className: "text-mono-600", children: "Please wait while your flipbook is being prepared." }), _jsx(Button, { onClick: handleStartOver, variant: "outline", className: "mt-6", children: "Cancel and Start Over" })] })] }) }));
    }
    return (_jsx("div", { className: "min-h-screen mono-gradient flex flex-col items-center justify-center p-6", children: _jsxs(Card, { className: "glass-card w-full max-w-2xl", children: [_jsxs(CardHeader, { className: "text-center", children: [_jsx(CardTitle, { className: "text-3xl font-bold text-mono-900", children: "Your Flipbook is Ready!" }), _jsxs(CardDescription, { className: "text-mono-600", children: ["Preview your flipbook cover page below. You can print the full PDF. (", flipbookAssets?.pageCount, " pages, ", flipbookAssets?.frameCount, " ", "frames total)"] })] }), _jsxs(CardContent, { className: "p-8 space-y-6", children: [previewImage ? (_jsx("div", { className: "border border-mono-200 rounded-lg shadow-lg overflow-hidden", children: _jsx("img", { src: previewImage, alt: "Flipbook Preview", className: "w-full h-auto object-contain max-h-[50vh] bg-gray-100" }) })) : (_jsxs("div", { className: "h-64 flex flex-col items-center justify-center bg-mono-100 rounded-lg text-mono-500", children: [printError && !previewImage ? (_jsx(AlertTriangle, { className: "h-10 w-10 mb-2" })) : (_jsx(ImageIcon, { className: "h-10 w-10 mb-2" })), _jsx("span", { children: printError && !previewImage
                                        ? printError
                                        : "No preview available" })] })), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "printer-select", className: "block text-sm font-medium text-mono-700", children: "Select Printer:" }), _jsxs("select", { id: "printer-select", value: selectedPrinter || "", onChange: (e) => setSelectedPrinter(e.target.value), className: "mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md", disabled: printers.length === 0 || isPrinting, children: [printers.length === 0 && _jsx("option", { children: "No printers found" }), printers.map((p) => (_jsx("option", { value: p.name, children: p.displayName || p.name }, p.name)))] })] }), printError && (_jsx("div", { className: "bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-md text-sm", role: "alert", children: _jsxs("p", { children: [_jsx("span", { className: "font-bold", children: "Print Error:" }), " ", printError] }) })), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4", children: [_jsxs(Button, { onClick: handleStartOver, variant: "outline", size: "lg", className: "text-lg py-3 border-mono-700 text-mono-800 hover:bg-mono-100", disabled: isPrinting, children: [_jsx(RotateCcw, { className: "mr-2 h-5 w-5" }), "Start Over"] }), _jsxs(Button, { onClick: handlePrint, size: "lg", className: "text-lg py-3 bg-blue-600 hover:bg-blue-700 text-white", disabled: isPrinting || !flipbookAssets.pdfPath || printers.length === 0, children: [isPrinting ? (_jsx(Loader2, { className: "mr-2 h-5 w-5 animate-spin" })) : (_jsx(Printer, { className: "mr-2 h-5 w-5" })), isPrinting ? "Printing..." : "Print Flipbook PDF"] })] }), _jsxs("div", { className: "text-center text-xs text-mono-500 pt-2", children: ["PDF Path: ", flipbookAssets.pdfPath] })] })] }) }));
};
export default PrintPreview;
