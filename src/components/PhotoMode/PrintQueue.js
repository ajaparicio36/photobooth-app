import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
const PrintQueue = ({ printFile }) => {
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
    }, []);
    const generateCollagePreview = () => {
        if (printFile) {
            const url = URL.createObjectURL(printFile);
            setCollagePreview(url);
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
    if (!printFile) {
        return (_jsxs("div", { className: "flex flex-col items-center justify-center h-screen bg-gray-100", children: [_jsx("h2", { className: "text-3xl font-bold mb-4", children: "Print Queue" }), _jsx("p", { className: "text-gray-600", children: "No print file available" }), _jsx("button", { onClick: () => navigate("/"), className: "mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded", children: "Go Home" })] }));
    }
    return (_jsxs("div", { className: "flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4", children: [_jsx("h2", { className: "text-3xl font-bold mb-6", children: "Print Preview" }), _jsxs("div", { className: "bg-white p-4 rounded-lg shadow-lg mb-6", children: [_jsx("h3", { className: "text-xl font-bold mb-4 text-center", children: "Your Collage" }), collagePreview && (_jsx("img", { src: collagePreview, alt: "Collage Preview", className: "max-w-md max-h-96 object-contain border rounded" }))] }), _jsxs("div", { className: "bg-white p-6 rounded-lg shadow-lg mb-6 max-w-md w-full", children: [_jsx("h3", { className: "text-xl font-bold mb-4", children: "Print Details" }), _jsxs("div", { className: "mb-4", children: [_jsxs("p", { children: [_jsx("strong", { children: "File:" }), " ", printFile.name] }), _jsxs("p", { children: [_jsx("strong", { children: "Size:" }), " ", Math.round(printFile.size / 1024), " KB"] }), _jsxs("p", { children: [_jsx("strong", { children: "Type:" }), " ", printFile.type] })] }), availablePrinters.length > 0 && (_jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-bold mb-2", children: "Select Printer:" }), _jsx("select", { value: selectedPrinter, onChange: (e) => setSelectedPrinter(e.target.value), className: "w-full p-2 border border-gray-300 rounded", children: availablePrinters.map((printer) => (_jsxs("option", { value: printer.name, children: [printer.displayName, " ", printer.isDefault ? "(Default)" : ""] }, printer.name))) })] })), printStatus && (_jsx("div", { className: `mb-4 p-3 rounded ${printStatus.includes("failed") || printStatus.includes("No")
                            ? "bg-red-100 text-red-700"
                            : printStatus.includes("success")
                                ? "bg-green-100 text-green-700"
                                : "bg-blue-100 text-blue-700"}`, children: printStatus })), _jsxs("div", { className: "flex gap-4", children: [_jsx("button", { onClick: handlePrint, disabled: isPrinting || !selectedPrinter, className: "flex-1 bg-green-500 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded", children: isPrinting ? "Printing..." : "Print Now" }), _jsx("button", { onClick: () => setShowSoftCopiesDialog(true), className: "flex-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded", children: "Get Soft Copies" })] })] }), showSoftCopiesDialog && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4", children: [_jsx("h3", { className: "text-xl font-bold mb-4", children: "Get Soft Copies" }), _jsx("p", { className: "mb-4 text-gray-600", children: "Save your photos to get digital copies delivered to your email or phone." }), softCopiesResult && (_jsx("div", { className: `mb-4 p-3 rounded ${softCopiesResult.includes("Failed")
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"}`, children: softCopiesResult })), _jsxs("div", { className: "flex gap-4", children: [_jsx("button", { onClick: () => setShowSoftCopiesDialog(false), className: "flex-1 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded", children: "Cancel" }), _jsx("button", { onClick: handleGetSoftCopies, disabled: isSavingSoftCopies, className: "flex-1 bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded", children: isSavingSoftCopies ? "Saving..." : "Save Copies" })] })] }) })), _jsx("button", { onClick: handleDone, className: "bg-blue-500 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg", children: "Done" })] }));
};
export default PrintQueue;
