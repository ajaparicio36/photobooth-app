import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface PrintQueueProps {
  printFile: File | null;
}

const PrintQueue: React.FC<PrintQueueProps> = ({ printFile }) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [printStatus, setPrintStatus] = useState<string>("");
  const [showQR, setShowQR] = useState(false);
  const [availablePrinters, setAvailablePrinters] = useState<any[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>("");
  const navigate = useNavigate();

  // Sample QR code (placeholder)
  const sampleQRCode =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ3aGl0ZSIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ibW9ub3NwYWNlIiBmb250LXNpemU9IjE0cHgiPgogICAgUVIgQ29kZQogIDwvdGV4dD4KPC9zdmc+";
  useEffect(() => {
    loadPrinters();
  }, []);

  const loadPrinters = async () => {
    try {
      const printers = await window.electronAPI.getAvailablePrinters();
      setAvailablePrinters(printers);

      // Auto-select default printer
      const defaultPrinter = printers.find((p: any) => p.isDefault);
      if (defaultPrinter) {
        setSelectedPrinter(defaultPrinter.name);
      } else if (printers.length > 0) {
        setSelectedPrinter(printers[0].name);
      }
    } catch (error) {
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
        quality: "high" as const,
        orientation: "portrait" as const,
      };

      await window.electronAPI.printImage(
        tempPath,
        selectedPrinter,
        printOptions
      );

      setPrintStatus("Print job sent successfully!");
      setShowQR(true);
    } catch (error) {
      console.error("Failed to print:", error);
      setPrintStatus("Print failed. Please try again.");
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDone = () => {
    navigate("/done?message=Photo session completed successfully!");
  };

  if (!printFile) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <h2 className="text-3xl font-bold mb-4">Print Queue</h2>
        <p className="text-gray-600">No print file available</p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h2 className="text-3xl font-bold mb-6">Print Queue</h2>

      <div className="bg-white p-6 rounded-lg shadow-lg mb-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">Print Details</h3>
        <div className="mb-4">
          <p>
            <strong>File:</strong> {printFile.name}
          </p>
          <p>
            <strong>Size:</strong> {Math.round(printFile.size / 1024)} KB
          </p>
          <p>
            <strong>Type:</strong> {printFile.type}
          </p>
        </div>

        {availablePrinters.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-bold mb-2">
              Select Printer:
            </label>
            <select
              value={selectedPrinter}
              onChange={(e) => setSelectedPrinter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              {availablePrinters.map((printer) => (
                <option key={printer.name} value={printer.name}>
                  {printer.displayName} {printer.isDefault ? "(Default)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {printStatus && (
          <div
            className={`mb-4 p-3 rounded ${
              printStatus.includes("failed") || printStatus.includes("No")
                ? "bg-red-100 text-red-700"
                : printStatus.includes("success")
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {printStatus}
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={handlePrint}
            disabled={isPrinting || !selectedPrinter}
            className="flex-1 bg-green-500 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded"
          >
            {isPrinting ? "Printing..." : "Print Now"}
          </button>
        </div>
      </div>

      {showQR && (
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6 max-w-md w-full text-center">
          <h3 className="text-xl font-bold mb-4">Get Digital Copies</h3>
          <p className="text-gray-600 mb-4">Scan QR code for soft copies:</p>
          <div className="flex justify-center mb-4">
            <img
              src={sampleQRCode}
              alt="QR Code for digital copies"
              className="w-48 h-48 border"
            />
          </div>
          <p className="text-sm text-gray-500">QR code expires in 24 hours</p>
        </div>
      )}

      <button
        onClick={handleDone}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg"
      >
        Done
      </button>
    </div>
  );
};

export default PrintQueue;
