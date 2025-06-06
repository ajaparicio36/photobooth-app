import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Printer, Download, CheckCircle, AlertCircle, Home, Loader2, } from "lucide-react";
const PrintQueue = ({ printFile, jpegPreviewPath, }) => {
    const [isPrinting, setIsPrinting] = useState(false);
    const [printStatus, setPrintStatus] = useState("");
    const [availablePrinters, setAvailablePrinters] = useState([]);
    const [selectedPrinter, setSelectedPrinter] = useState("");
    const [collagePreview, setCollagePreview] = useState("");
    const [showSoftCopiesDialog, setShowSoftCopiesDialog] = useState(false);
    const [isSavingSoftCopies, setIsSavingSoftCopies] = useState(false);
    const [softCopiesResult, setSoftCopiesResult] = useState("");
    const navigate = useNavigate();
    useEffect(() => {
        loadPrinters();
        generateCollagePreview();
    }, [jpegPreviewPath, printFile]);
    const generateCollagePreview = async () => {
        // Try multiple approaches to load the preview
        if (jpegPreviewPath) {
            try {
                // First, try to read the file and create a blob URL
                const fileResponse = await window.electronAPI.readFile(jpegPreviewPath);
                if (fileResponse.success && fileResponse.data) {
                    // Convert the number array back to Uint8Array for blob creation
                    const uint8Array = new Uint8Array(fileResponse.data);
                    const blob = new Blob([uint8Array], { type: "image/jpeg" });
                    const url = URL.createObjectURL(blob);
                    setCollagePreview(url);
                    console.log("Successfully loaded JPEG preview from file data");
                    return;
                }
                else {
                    console.warn("Failed to read file:", fileResponse.error);
                }
            }
            catch (error) {
                console.warn("Failed to load JPEG preview from file data:", error);
            }
            try {
                // Fallback: try file:// URL (normalize path separators)
                const normalizedPath = jpegPreviewPath.replace(/\\/g, "/");
                const fileUrl = `file://${normalizedPath}`;
                setCollagePreview(fileUrl);
                console.log("Using file URL for preview:", fileUrl);
                return;
            }
            catch (error) {
                console.warn("Failed to create file URL:", error);
            }
        }
        // Final fallback: use the print file blob
        if (printFile) {
            const url = URL.createObjectURL(printFile);
            setCollagePreview(url);
            console.log("Using print file blob as fallback");
        }
    };
    const loadPrinters = async () => {
        try {
            const printers = await window.electronAPI.getAvailablePrinters();
            setAvailablePrinters(printers);
            // Auto-select default printer
            const defaultPrinter = printers.find((p) => p.isDefault);
            if (defaultPrinter) {
                setSelectedPrinter(defaultPrinter.name);
            }
            else if (printers.length > 0) {
                setSelectedPrinter(printers[0].name);
            }
        }
        catch (error) {
            console.error("Failed to load printers:", error);
            setPrintStatus("No printers available");
        }
    };
    const handlePrint = async () => {
        if (!printFile || !selectedPrinter) {
            setPrintStatus("No print file or printer selected");
            return;
        }
        setIsPrinting(true);
        setPrintStatus("Preparing to print...");
        try {
            // Save print file to temp location
            const tempPath = `/tmp/print_${Date.now()}.pdf`;
            const arrayBuffer = await printFile.arrayBuffer();
            await window.electronAPI.saveFile(arrayBuffer, tempPath);
            setPrintStatus("Sending to printer...");
            const printOptions = {
                copies: 1,
                paperSize: "A6",
                quality: "high",
                orientation: "portrait",
            };
            await window.electronAPI.printImage(tempPath, selectedPrinter, printOptions);
            setPrintStatus("Print job sent successfully!");
        }
        catch (error) {
            console.error("Failed to print:", error);
            setPrintStatus("Print failed. Please try again.");
        }
        finally {
            setIsPrinting(false);
        }
    };
    const handleGetSoftCopies = async () => {
        setIsSavingSoftCopies(true);
        setSoftCopiesResult("");
        try {
            // Get photos from the photos state (we'll need to pass this from parent)
            // For now, we'll use the print file
            const formData = new FormData();
            formData.append("collage", printFile);
            const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:3001";
            const response = await fetch(`${apiUrl}/save`, {
                method: "POST",
                body: formData,
            });
            if (response.ok) {
                const result = await response.json();
                setSoftCopiesResult(`Soft copies saved! Access code: ${result.code || "SUCCESS"}`);
            }
            else {
                setSoftCopiesResult("Failed to save soft copies. Please try again.");
            }
        }
        catch (error) {
            console.error("Failed to save soft copies:", error);
            setSoftCopiesResult("Failed to save soft copies. Please try again.");
        }
        finally {
            setIsSavingSoftCopies(false);
        }
    };
    const handleDone = async () => {
        // Clean up tmp folder
        try {
            await window.electronAPI.cleanupTempFiles();
        }
        catch (error) {
            console.error("Failed to cleanup temp files:", error);
        }
        navigate("/done?message=Photo session completed successfully!");
    };
    const getDisplayFileName = () => {
        // Return a user-friendly name instead of technical filename
        return "Photo Collage";
    };
    const getDisplayFileSize = () => {
        if (printFile) {
            return Math.round(printFile.size / 1024);
        }
        return "Unknown";
    };
    const getDisplayFileType = () => {
        // Show user-friendly type
        return "Print Ready";
    };
    if (!printFile) {
        return (_jsx("div", { className: "min-h-screen mono-gradient flex items-center justify-center p-6", children: _jsx(Card, { className: "glass-card max-w-md w-full", children: _jsxs(CardContent, { className: "p-8 text-center", children: [_jsx("div", { className: "w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center", children: _jsx(AlertCircle, { className: "w-8 h-8 text-red-600" }) }), _jsx("h2", { className: "text-2xl font-bold text-mono-900 mb-3", children: "No Print File Available" }), _jsx("p", { className: "text-mono-600 mb-6", children: "Something went wrong with generating your collage" }), _jsxs(Button, { onClick: () => navigate("/"), className: "w-full bg-mono-900 hover:bg-mono-800 text-white", children: [_jsx(Home, { className: "w-4 h-4 mr-2" }), "Go Home"] })] }) }) }));
    }
    return (_jsxs("div", { className: "h-screen mono-gradient flex flex-col overflow-hidden", children: [_jsx("div", { className: "p-4 border-b border-mono-200 bg-white/50 backdrop-blur-sm flex-shrink-0", children: _jsxs("div", { className: "max-w-4xl mx-auto text-center", children: [_jsx("h1", { className: "text-xl font-bold text-mono-900", children: "Print Preview" }), _jsx("p", { className: "text-xs text-mono-600", children: "Review and print your collage" })] }) }), _jsx("div", { className: "flex-1 p-4 min-h-0", children: _jsx("div", { className: "max-w-4xl mx-auto h-full", children: _jsxs("div", { className: "grid lg:grid-cols-2 gap-4 h-full", children: [_jsxs(Card, { className: "glass-card", children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "flex items-center gap-2 text-base", children: [_jsx(CheckCircle, { className: "w-4 h-4 text-green-600" }), "Your Collage"] }) }), _jsxs(CardContent, { className: "p-4 h-full flex flex-col", children: [_jsx("div", { className: "flex-1 flex items-center justify-center mb-3", children: collagePreview ? (_jsx("img", { src: collagePreview, alt: "Collage Preview", className: "max-w-full max-h-full object-contain rounded-lg border border-mono-200 shadow-lg", onLoad: () => {
                                                        console.log("Preview image loaded successfully");
                                                    }, onError: (e) => {
                                                        console.error("Failed to load preview image:", e);
                                                        console.log("Preview URL was:", collagePreview);
                                                        setCollagePreview("");
                                                    } })) : (_jsxs("div", { className: "text-center py-8", children: [_jsx("div", { className: "w-16 h-16 mx-auto mb-4 rounded-full bg-mono-100 flex items-center justify-center", children: _jsx(Loader2, { className: "w-8 h-8 text-mono-600 animate-spin" }) }), _jsx("p", { className: "text-sm text-mono-600 mb-2", children: "Loading preview..." }), jpegPreviewPath && (_jsxs("p", { className: "text-xs text-mono-400", children: ["Path: ", jpegPreviewPath] }))] })) }), _jsxs("div", { className: "space-y-1 text-xs", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-mono-600", children: "File:" }), _jsx("span", { className: "font-medium text-mono-900", children: getDisplayFileName() })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-mono-600", children: "Size:" }), _jsxs("span", { className: "font-medium text-mono-900", children: [getDisplayFileSize(), " KB"] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-mono-600", children: "Type:" }), _jsx(Badge, { variant: "secondary", className: "text-xs", children: getDisplayFileType() })] })] })] })] }), _jsxs("div", { className: "flex flex-col gap-4 min-h-0", children: [_jsxs(Card, { className: "glass-card flex-1", children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "flex items-center gap-2 text-base", children: [_jsx(Printer, { className: "w-4 h-4" }), "Print Settings"] }) }), _jsxs(CardContent, { className: "p-4 flex flex-col gap-3", children: [availablePrinters.length > 0 ? (_jsxs("div", { children: [_jsx("label", { className: "text-xs font-medium text-mono-700 mb-1 block", children: "Select Printer:" }), _jsxs(Select, { value: selectedPrinter, onValueChange: setSelectedPrinter, children: [_jsx(SelectTrigger, { className: "h-8", children: _jsx(SelectValue, { placeholder: "Choose a printer" }) }), _jsx(SelectContent, { children: availablePrinters.map((printer) => (_jsxs(SelectItem, { value: printer.name, children: [printer.displayName, " ", printer.isDefault ? "(Default)" : ""] }, printer.name))) })] })] })) : (_jsxs("div", { className: "text-center py-3", children: [_jsx(AlertCircle, { className: "w-6 h-6 mx-auto mb-1 text-amber-500" }), _jsx("p", { className: "text-xs text-mono-600", children: "No printers available" })] })), printStatus && (_jsx("div", { className: `p-2 rounded-lg text-xs ${printStatus.includes("failed") ||
                                                            printStatus.includes("No")
                                                            ? "bg-red-100 text-red-700 border border-red-200"
                                                            : printStatus.includes("success")
                                                                ? "bg-green-100 text-green-700 border border-green-200"
                                                                : "bg-blue-100 text-blue-700 border border-blue-200"}`, children: printStatus })), _jsx(Button, { onClick: handlePrint, disabled: isPrinting || !selectedPrinter, className: "w-full bg-mono-900 hover:bg-mono-800 text-white", children: isPrinting ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }), "Printing..."] })) : (_jsxs(_Fragment, { children: [_jsx(Printer, { className: "w-4 h-4 mr-2" }), "Print Now"] })) })] })] }), _jsxs(Card, { className: "glass-card flex-shrink-0", children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "flex items-center gap-2 text-base", children: [_jsx(Download, { className: "w-4 h-4" }), "Digital Copies"] }) }), _jsxs(CardContent, { className: "p-4", children: [_jsx("p", { className: "text-xs text-mono-600 mb-3", children: "Get your photos delivered digitally to your email or phone" }), _jsxs(Button, { onClick: () => setShowSoftCopiesDialog(true), variant: "outline", className: "w-full", children: [_jsx(Download, { className: "w-4 h-4 mr-2" }), "Get Soft Copies"] })] })] }), _jsxs(Button, { onClick: handleDone, size: "lg", className: "w-full bg-green-700 hover:bg-green-800 text-white flex-shrink-0", children: [_jsx(CheckCircle, { className: "w-4 h-4 mr-2" }), "Complete Session"] })] })] }) }) }), _jsx(Dialog, { open: showSoftCopiesDialog, onOpenChange: setShowSoftCopiesDialog, children: _jsxs(DialogContent, { className: "glass-card border-0", children: [_jsx(DialogHeader, { children: _jsxs(DialogTitle, { className: "flex items-center gap-2", children: [_jsx(Download, { className: "w-5 h-5" }), "Get Soft Copies"] }) }), _jsxs("div", { className: "space-y-4", children: [_jsx("p", { className: "text-mono-600", children: "Save your photos to get digital copies delivered to your email or phone." }), softCopiesResult && (_jsx("div", { className: `p-3 rounded-lg text-sm ${softCopiesResult.includes("Failed")
                                        ? "bg-red-100 text-red-700 border border-red-200"
                                        : "bg-green-100 text-green-700 border border-green-200"}`, children: softCopiesResult })), _jsxs("div", { className: "flex gap-3", children: [_jsx(Button, { variant: "outline", onClick: () => setShowSoftCopiesDialog(false), className: "flex-1", children: "Cancel" }), _jsx(Button, { onClick: handleGetSoftCopies, disabled: isSavingSoftCopies, className: "flex-1 bg-mono-900 hover:bg-mono-800 text-white", children: isSavingSoftCopies ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }), "Saving..."] })) : (_jsxs(_Fragment, { children: [_jsx(Download, { className: "w-4 h-4 mr-2" }), "Save Copies"] })) })] })] })] }) })] }));
};
export default PrintQueue;
