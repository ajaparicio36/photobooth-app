import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
const PrintQueue = ({ printFile }) => {
    const [isPrinting, setIsPrinting] = useState(false);
    const [printStatus, setPrintStatus] = useState("");
    const [showQR, setShowQR] = useState(false);
    const [availablePrinters, setAvailablePrinters] = useState([]);
    const [selectedPrinter, setSelectedPrinter] = useState("");
    const navigate = useNavigate();
    // Sample QR code (placeholder)
    const sampleQRCode = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ3aGl0ZSIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ibW9ub3NwYWNlIiBmb250LXNpemU9IjE0cHgiPgogICAgUVIgQ29kZQogIDwvdGV4dD4KPC9zdmc+";
    useEffect(() => {
        loadPrinters();
    }, []);
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
            setShowQR(true);
        }
        catch (error) {
            console.error("Failed to print:", error);
            setPrintStatus("Print failed. Please try again.");
        }
        finally {
            setIsPrinting(false);
        }
    };
    const handleDone = () => {
        navigate("/done?message=Photo session completed successfully!");
    };
    if (!printFile) {
        return (_jsxs("div", { className: "flex flex-col items-center justify-center h-screen bg-gray-100", children: [_jsx("h2", { className: "text-3xl font-bold mb-4", children: "Print Queue" }), _jsx("p", { className: "text-gray-600", children: "No print file available" }), _jsx("button", { onClick: () => navigate("/"), className: "mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded", children: "Go Home" })] }));
    }
    return (_jsxs("div", { className: "flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4", children: [_jsx("h2", { className: "text-3xl font-bold mb-6", children: "Print Queue" }), _jsxs("div", { className: "bg-white p-6 rounded-lg shadow-lg mb-6 max-w-md w-full", children: [_jsx("h3", { className: "text-xl font-bold mb-4", children: "Print Details" }), _jsxs("div", { className: "mb-4", children: [_jsxs("p", { children: [_jsx("strong", { children: "File:" }), " ", printFile.name] }), _jsxs("p", { children: [_jsx("strong", { children: "Size:" }), " ", Math.round(printFile.size / 1024), " KB"] }), _jsxs("p", { children: [_jsx("strong", { children: "Type:" }), " ", printFile.type] })] }), availablePrinters.length > 0 && (_jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-bold mb-2", children: "Select Printer:" }), _jsx("select", { value: selectedPrinter, onChange: (e) => setSelectedPrinter(e.target.value), className: "w-full p-2 border border-gray-300 rounded", children: availablePrinters.map((printer) => (_jsxs("option", { value: printer.name, children: [printer.displayName, " ", printer.isDefault ? "(Default)" : ""] }, printer.name))) })] })), printStatus && (_jsx("div", { className: `mb-4 p-3 rounded ${printStatus.includes("failed") || printStatus.includes("No")
                            ? "bg-red-100 text-red-700"
                            : printStatus.includes("success")
                                ? "bg-green-100 text-green-700"
                                : "bg-blue-100 text-blue-700"}`, children: printStatus })), _jsx("div", { className: "flex gap-4", children: _jsx("button", { onClick: handlePrint, disabled: isPrinting || !selectedPrinter, className: "flex-1 bg-green-500 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded", children: isPrinting ? "Printing..." : "Print Now" }) })] }), showQR && (_jsxs("div", { className: "bg-white p-6 rounded-lg shadow-lg mb-6 max-w-md w-full text-center", children: [_jsx("h3", { className: "text-xl font-bold mb-4", children: "Get Digital Copies" }), _jsx("p", { className: "text-gray-600 mb-4", children: "Scan QR code for soft copies:" }), _jsx("div", { className: "flex justify-center mb-4", children: _jsx("img", { src: sampleQRCode, alt: "QR Code for digital copies", className: "w-48 h-48 border" }) }), _jsx("p", { className: "text-sm text-gray-500", children: "QR code expires in 24 hours" })] })), _jsx("button", { onClick: handleDone, className: "bg-blue-500 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg", children: "Done" })] }));
};
export default PrintQueue;
