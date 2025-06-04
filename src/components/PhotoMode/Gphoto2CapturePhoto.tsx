import { PaperType, PhotoModePage, PAPER_TYPE_PHOTO_COUNT } from "@/lib/enums";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Camera, Timer, CheckCircle } from "lucide-react";
import path from "path";

interface Gphoto2CapturePhotoProps {
  setPhotos: (photos: File[]) => void;
  setCurrentPage: (page: PhotoModePage) => void;
  paperType: PaperType;
}

const Gphoto2CapturePhoto: React.FC<Gphoto2CapturePhotoProps> = ({
  setPhotos,
  setCurrentPage,
  paperType,
}) => {
  const [capturedPhotos, setCapturedPhotos] = useState<File[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);

  const requiredPhotos = PAPER_TYPE_PHOTO_COUNT[paperType];

  useEffect(() => {
    setPhotos([]);
    setCapturedPhotos([]);
  }, []);

  const startPhotoSession = () => {
    setSessionStarted(true);
    startCountdown(5);
  };

  const startCountdown = (seconds: number) => {
    setCountdown(seconds);

    if (seconds <= 0) {
      setTimeout(capturePhoto, 100);
      return;
    }

    setTimeout(() => {
      startCountdown(seconds - 1);
    }, 1000);
  };

  const capturePhoto = async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    setCountdown(null);

    try {
      const outputPath = path.join(
        require("os").tmpdir(),
        "photobooth-app",
        `photo_${Date.now()}.jpg`
      );

      const result = await window.electronAPI.captureImage(outputPath);
      const fileData = await window.electronAPI.readFile(result);
      const blob = new Blob([fileData], { type: "image/jpeg" });

      const photoFile = new File(
        [blob],
        `photo_${capturedPhotos.length + 1}.jpg`,
        { type: "image/jpeg" }
      );

      const newPhotos = [...capturedPhotos, photoFile];
      setCapturedPhotos(newPhotos);

      console.log(
        `DSLR Photo ${newPhotos.length} captured. Total needed: ${requiredPhotos}`
      );

      if (newPhotos.length >= requiredPhotos) {
        setPhotos(newPhotos);
        setCurrentPage(PhotoModePage.SelectFilterPage);
      } else {
        setTimeout(() => startCountdown(5), 1500);
      }
    } catch (error) {
      console.error("DSLR capture failed:", error);
      alert(
        "Failed to capture photo with DSLR camera. Please check your connection."
      );
    } finally {
      setIsCapturing(false);
    }
  };

  const progress = (capturedPhotos.length / requiredPhotos) * 100;

  return (
    <div className="h-screen mono-gradient flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-mono-200 bg-white/50 backdrop-blur-sm flex-shrink-0">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-xl font-bold text-mono-900">Photo Session</h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              DSLR Camera
            </Badge>
            <Badge variant="outline" className="text-xs">
              {capturedPhotos.length} of {requiredPhotos} photos
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 min-h-0">
        <div className="max-w-2xl w-full h-full flex flex-col">
          {/* Progress Bar */}
          <Card className="glass-card mb-4 flex-shrink-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-mono-700" />
                  <span className="font-semibold text-mono-900 text-sm">
                    Progress
                  </span>
                </div>
                <span className="text-xs text-mono-600">
                  {Math.round(progress)}% Complete
                </span>
              </div>
              <Progress value={progress} className="h-2 mb-1" />
              <div className="text-xs text-mono-600">
                Photo {capturedPhotos.length + 1} of {requiredPhotos}
              </div>
            </CardContent>
          </Card>

          {/* Camera Preview */}
          <Card className="glass-card mb-4 flex-1 min-h-0">
            <CardContent className="p-4 h-full">
              <div className="relative h-full">
                <div className="capture-frame w-full h-full bg-mono-900 flex items-center justify-center text-white rounded-lg">
                  <div className="text-center">
                    <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <div className="text-base font-medium">
                      DSLR Camera View
                    </div>
                    <div className="text-xs opacity-75">Live Preview</div>
                  </div>
                </div>

                {countdown !== null && (
                  <div className="countdown-overlay">
                    <div className="text-center animate-pulse">
                      <div className="text-6xl font-bold text-white mb-2">
                        {countdown}
                      </div>
                      <div className="text-lg text-white/80">Get Ready!</div>
                    </div>
                  </div>
                )}

                {isCapturing && (
                  <div className="countdown-overlay">
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-white/20 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-white animate-pulse"></div>
                      </div>
                      <div className="text-lg text-white font-semibold">
                        Capturing Photo...
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Controls */}
          <Card className="glass-card flex-shrink-0">
            <CardContent className="p-4 text-center">
              {!sessionStarted ? (
                <div>
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-mono-900 mb-2">
                      Ready to Start?
                    </h3>
                    <p className="text-mono-600">
                      We'll capture {requiredPhotos} photos with a 5-second
                      countdown between each shot
                    </p>
                  </div>
                  <Button
                    onClick={startPhotoSession}
                    size="lg"
                    className="bg-mono-900 hover:bg-mono-800 text-white px-8 py-4"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Start Photo Session
                  </Button>
                </div>
              ) : (
                <div>
                  {isCapturing ? (
                    <div className="flex items-center justify-center gap-3 text-mono-900">
                      <div className="w-6 h-6 rounded-full bg-mono-900 animate-pulse"></div>
                      <span className="text-lg font-semibold">
                        Capturing Photo {capturedPhotos.length + 1}...
                      </span>
                    </div>
                  ) : countdown !== null ? (
                    <div className="flex items-center justify-center gap-3 text-mono-900">
                      <Timer className="w-6 h-6" />
                      <span className="text-lg font-semibold">
                        Get ready for photo {capturedPhotos.length + 1}!
                      </span>
                    </div>
                  ) : capturedPhotos.length >= requiredPhotos ? (
                    <div className="flex items-center justify-center gap-3 text-green-700">
                      <CheckCircle className="w-6 h-6" />
                      <span className="text-lg font-semibold">
                        All photos captured! Moving to filters...
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3 text-mono-600">
                      <div className="w-6 h-6 rounded-full bg-mono-300 animate-pulse"></div>
                      <span className="text-lg">
                        Processing... Next photo coming up!
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Gphoto2CapturePhoto;
