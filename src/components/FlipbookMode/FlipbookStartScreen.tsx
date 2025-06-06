import { FlipbookPage } from "@/lib/enums";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Video, Camera } from "lucide-react";

interface SharpFilter {
  key: string;
  name: string;
  description: string;
}

interface FlipbookStartScreenProps {
  setCurrentPage: (page: FlipbookPage) => void;
  setSelectedFilter: (filter: string) => void;
  setCaptureMode: (mode: "webcam" | "dslr") => void;
}

const FlipbookStartScreen: React.FC<FlipbookStartScreenProps> = ({
  setCurrentPage,
  setSelectedFilter,
  setCaptureMode,
}) => {
  const [availableFilters, setAvailableFilters] = useState<SharpFilter[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [currentFilter, setCurrentFilter] = useState<string>("none"); // Default to no filter
  const [currentMode, setCurrentMode] = useState<"webcam" | "dslr">("webcam");

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
      } catch (error) {
        console.error("Failed to fetch image filters:", error);
        setAvailableFilters([
          {
            key: "none",
            name: "No Filter (Original)",
            description: "Use original video frames.",
          },
        ]); // Fallback
      } finally {
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

  return (
    <div className="min-h-screen mono-gradient flex items-center justify-center p-6">
      <Card className="glass-card w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-mono-900">
            Flipbook Mode
          </CardTitle>
          <CardDescription className="text-mono-600">
            Create a fun flipbook from a short video! Select your style and
            camera.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 p-8">
          {/* Filter Selection */}
          <div className="space-y-3">
            <Label
              htmlFor="filter-select"
              className="text-lg font-semibold text-mono-800"
            >
              Choose a Visual Style
            </Label>
            {loadingFilters ? (
              <div className="flex items-center space-x-2 text-mono-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading styles...</span>
              </div>
            ) : (
              <Select
                value={currentFilter}
                onValueChange={setCurrentFilter}
                disabled={availableFilters.length === 0}
              >
                <SelectTrigger
                  id="filter-select"
                  className="w-full text-base py-3"
                >
                  <SelectValue placeholder="Select a filter style" />
                </SelectTrigger>
                <SelectContent>
                  {availableFilters.map((filter) => (
                    <SelectItem
                      key={filter.key}
                      value={filter.key}
                      className="text-base"
                    >
                      {filter.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {currentFilter !== "none" &&
              availableFilters.find((f) => f.key === currentFilter) && (
                <p className="text-xs text-mono-500 pt-1">
                  {
                    availableFilters.find((f) => f.key === currentFilter)
                      ?.description
                  }
                </p>
              )}
          </div>

          {/* Capture Mode Selection */}
          <div className="space-y-3">
            <Label className="text-lg font-semibold text-mono-800">
              Select Camera
            </Label>
            <RadioGroup
              value={currentMode}
              onValueChange={(value) =>
                setCurrentMode(value as "webcam" | "dslr")
              }
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <Label
                htmlFor="webcam-mode"
                className={`flex flex-col items-center justify-center rounded-md border-2 p-6 cursor-pointer transition-all hover:border-mono-700 ${
                  currentMode === "webcam"
                    ? "border-mono-900 bg-mono-50 shadow-md"
                    : "border-mono-300"
                }`}
              >
                <RadioGroupItem
                  value="webcam"
                  id="webcam-mode"
                  className="sr-only"
                />
                <Video
                  className={`h-10 w-10 mb-3 ${
                    currentMode === "webcam" ? "text-mono-900" : "text-mono-500"
                  }`}
                />
                <span
                  className={`font-semibold text-lg ${
                    currentMode === "webcam" ? "text-mono-900" : "text-mono-700"
                  }`}
                >
                  Webcam
                </span>
                <span
                  className={`text-xs ${
                    currentMode === "webcam" ? "text-mono-700" : "text-mono-500"
                  }`}
                >
                  Use built-in camera
                </span>
              </Label>
              <Label
                htmlFor="dslr-mode"
                className={`flex flex-col items-center justify-center rounded-md border-2 p-6 cursor-pointer transition-all hover:border-mono-700 ${
                  currentMode === "dslr"
                    ? "border-mono-900 bg-mono-50 shadow-md"
                    : "border-mono-300"
                }`}
              >
                <RadioGroupItem
                  value="dslr"
                  id="dslr-mode"
                  className="sr-only"
                />
                <Camera
                  className={`h-10 w-10 mb-3 ${
                    currentMode === "dslr" ? "text-mono-900" : "text-mono-500"
                  }`}
                />
                <span
                  className={`font-semibold text-lg ${
                    currentMode === "dslr" ? "text-mono-900" : "text-mono-700"
                  }`}
                >
                  DSLR Camera
                </span>
                <span
                  className={`text-xs ${
                    currentMode === "dslr" ? "text-mono-700" : "text-mono-500"
                  }`}
                >
                  (Coming Soon)
                </span>
              </Label>
            </RadioGroup>
            {currentMode === "dslr" && (
              <p className="text-xs text-orange-600 pt-1 text-center">
                DSLR video capture is not yet implemented. Please select Webcam
                for now.
              </p>
            )}
          </div>

          <Button
            onClick={handleStart}
            size="lg"
            className="w-full bg-mono-900 hover:bg-mono-800 text-white text-lg py-4 mt-4"
            disabled={loadingFilters || currentMode === "dslr"} // Disable if DSLR selected until implemented
          >
            Start Recording Session
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default FlipbookStartScreen;
