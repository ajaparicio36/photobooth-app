import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Printer,
  Download,
  CheckCircle,
  AlertCircle,
  Home,
  Loader2,
} from "lucide-react";

interface PrintQueueProps {
  printFile: File | null;
}

const PrintQueue: React.FC<PrintQueueProps> = ({ printFile }) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [printStatus, setPrintStatus] = useState<string>("");
  const [availablePrinters, setAvailablePrinters] = useState<any[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>("");
  const [collagePreview, setCollagePreview] = useState<string>("");
  const [showSoftCopiesDialog, setShowSoftCopiesDialog] = useState(false);
  const [isSavingSoftCopies, setIsSavingSoftCopies] = useState(false);
  const [softCopiesResult, setSoftCopiesResult] = useState<string>("");
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
    } catch (error) {
      console.error("Failed to print:", error);
      setPrintStatus("Print failed. Please try again.");
    } finally {
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
      formData.append("collage", printFile!);

      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/save`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setSoftCopiesResult(
          `Soft copies saved! Access code: ${result.code || "SUCCESS"}`
        );
      } else {
        setSoftCopiesResult("Failed to save soft copies. Please try again.");
      }
    } catch (error) {
      console.error("Failed to save soft copies:", error);
      setSoftCopiesResult("Failed to save soft copies. Please try again.");
    } finally {
      setIsSavingSoftCopies(false);
    }
  };

  const handleDone = async () => {
    // Clean up tmp folder
    try {
      await window.electronAPI.cleanupTempFiles();
    } catch (error) {
      console.error("Failed to cleanup temp files:", error);
    }

    navigate("/done?message=Photo session completed successfully!");
  };

  if (!printFile) {
    return (
      <div className="min-h-screen mono-gradient flex items-center justify-center p-6">
        <Card className="glass-card max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-mono-900 mb-3">
              No Print File Available
            </h2>
            <p className="text-mono-600 mb-6">
              Something went wrong with generating your collage
            </p>
            <Button
              onClick={() => navigate("/")}
              className="w-full bg-mono-900 hover:bg-mono-800 text-white"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen mono-gradient flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-mono-200 bg-white/50 backdrop-blur-sm flex-shrink-0">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-xl font-bold text-mono-900">Print Preview</h1>
          <p className="text-xs text-mono-600">Review and print your collage</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 min-h-0">
        <div className="max-w-4xl mx-auto h-full">
          <div className="grid lg:grid-cols-2 gap-4 h-full">
            {/* Preview Section */}
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Your Collage
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 h-full flex flex-col">
                <div className="flex-1 flex items-center justify-center mb-3">
                  {collagePreview && (
                    <img
                      src={collagePreview}
                      alt="Collage Preview"
                      className="max-w-full max-h-full object-contain rounded-lg border border-mono-200 shadow-lg"
                    />
                  )}
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-mono-600">File:</span>
                    <span className="font-medium text-mono-900 truncate ml-2">
                      {printFile.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-mono-600">Size:</span>
                    <span className="font-medium text-mono-900">
                      {Math.round(printFile.size / 1024)} KB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-mono-600">Type:</span>
                    <Badge variant="secondary" className="text-xs">
                      {printFile.type}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Print Controls */}
            <div className="flex flex-col gap-4 min-h-0">
              {/* Printer Selection */}
              <Card className="glass-card flex-1">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Printer className="w-4 h-4" />
                    Print Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 flex flex-col gap-3">
                  {availablePrinters.length > 0 ? (
                    <div>
                      <label className="text-xs font-medium text-mono-700 mb-1 block">
                        Select Printer:
                      </label>
                      <Select
                        value={selectedPrinter}
                        onValueChange={setSelectedPrinter}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Choose a printer" />
                        </SelectTrigger>
                        <SelectContent>
                          {availablePrinters.map((printer) => (
                            <SelectItem key={printer.name} value={printer.name}>
                              {printer.displayName}{" "}
                              {printer.isDefault ? "(Default)" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="text-center py-3">
                      <AlertCircle className="w-6 h-6 mx-auto mb-1 text-amber-500" />
                      <p className="text-xs text-mono-600">
                        No printers available
                      </p>
                    </div>
                  )}

                  {printStatus && (
                    <div
                      className={`p-2 rounded-lg text-xs ${
                        printStatus.includes("failed") ||
                        printStatus.includes("No")
                          ? "bg-red-100 text-red-700 border border-red-200"
                          : printStatus.includes("success")
                          ? "bg-green-100 text-green-700 border border-green-200"
                          : "bg-blue-100 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {printStatus}
                    </div>
                  )}

                  <Button
                    onClick={handlePrint}
                    disabled={isPrinting || !selectedPrinter}
                    className="w-full bg-mono-900 hover:bg-mono-800 text-white"
                  >
                    {isPrinting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Printing...
                      </>
                    ) : (
                      <>
                        <Printer className="w-4 h-4 mr-2" />
                        Print Now
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Digital Copies */}
              <Card className="glass-card flex-shrink-0">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Download className="w-4 h-4" />
                    Digital Copies
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-xs text-mono-600 mb-3">
                    Get your photos delivered digitally to your email or phone
                  </p>
                  <Button
                    onClick={() => setShowSoftCopiesDialog(true)}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Get Soft Copies
                  </Button>
                </CardContent>
              </Card>

              {/* Done Button */}
              <Button
                onClick={handleDone}
                size="lg"
                className="w-full bg-green-700 hover:bg-green-800 text-white flex-shrink-0"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete Session
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Soft Copies Dialog */}
      <Dialog
        open={showSoftCopiesDialog}
        onOpenChange={setShowSoftCopiesDialog}
      >
        <DialogContent className="glass-card border-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Get Soft Copies
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-mono-600">
              Save your photos to get digital copies delivered to your email or
              phone.
            </p>

            {softCopiesResult && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  softCopiesResult.includes("Failed")
                    ? "bg-red-100 text-red-700 border border-red-200"
                    : "bg-green-100 text-green-700 border border-green-200"
                }`}
              >
                {softCopiesResult}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowSoftCopiesDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGetSoftCopies}
                disabled={isSavingSoftCopies}
                className="flex-1 bg-mono-900 hover:bg-mono-800 text-white"
              >
                {isSavingSoftCopies ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Save Copies
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrintQueue;
