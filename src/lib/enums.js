export var PhotoModePage;
(function (PhotoModePage) {
    PhotoModePage["CapturePhotoScreen"] = "CapturePhotoScreen";
    PhotoModePage["SelectFilterPage"] = "SelectFilterPage";
    PhotoModePage["OrganizeCollage"] = "OrganizeCollage";
    PhotoModePage["PhotoPreview"] = "PhotoPreview";
    PhotoModePage["PrintQueue"] = "PrintQueue";
    PhotoModePage["ChoosePaperType"] = "ChoosePaperType";
})(PhotoModePage || (PhotoModePage = {}));
export var FlipbookPage;
(function (FlipbookPage) {
    FlipbookPage["FlipbookStartScreen"] = "FlipbookStartScreen";
    FlipbookPage["RecordingPage"] = "RecordingPage";
    FlipbookPage["VideoPreview"] = "VideoPreview";
    FlipbookPage["PrintPreview"] = "PrintPreview";
})(FlipbookPage || (FlipbookPage = {}));
export var PaperType;
(function (PaperType) {
    PaperType["TwoBySix"] = "2x6";
    PaperType["FourBySix"] = "4x6";
})(PaperType || (PaperType = {}));
export const PAPER_TYPE_PHOTO_COUNT = {
    [PaperType.TwoBySix]: 2, // Only need 2 unique photos, Sharp will duplicate them
    [PaperType.FourBySix]: 4,
};
