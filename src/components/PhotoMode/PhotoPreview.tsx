import { PaperType, PhotoModePage } from "@/lib/enums";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Images, ArrowRight } from "lucide-react";

interface PhotoPreviewProps {
  photos: File[];
  setCurrentPage: (page: PhotoModePage) => void;
  paperType: PaperType;
}

const PhotoPreview: React.FC<PhotoPreviewProps> = ({
  photos,
  setCurrentPage,
  paperType,
}) => {
  return (
    <div className="h-screen mono-gradient flex items-center justify-center p-4 overflow-hidden">
      <Card className="glass-card max-w-2xl w-full max-h-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Images className="w-5 h-5" />
            Photo Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-h-96 overflow-y-auto">
          {photos.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-mono-900">
                  Captured Photos
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {photos.length} photos
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {photos.map((photo, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-white rounded-lg border border-mono-200"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-mono-100 rounded-lg flex items-center justify-center">
                        <Images className="w-4 h-4 text-mono-600" />
                      </div>
                      <div>
                        <div className="font-medium text-mono-900 text-xs truncate">
                          {photo.name}
                        </div>
                        <div className="text-xs text-mono-600">
                          {Math.round(photo.size / 1024)} KB
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Photo {index + 1}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <Images className="w-12 h-12 mx-auto mb-3 text-mono-400" />
              <p className="text-mono-600 text-sm">No photos captured yet.</p>
            </div>
          )}

          <div className="text-center pt-2">
            <Button
              onClick={() => setCurrentPage(PhotoModePage.SelectFilterPage)}
              className="bg-mono-900 hover:bg-mono-800 text-white px-6"
            >
              Continue to Filters
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PhotoPreview;
