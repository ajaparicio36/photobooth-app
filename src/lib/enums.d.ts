export declare enum PhotoModePage {
    CapturePhotoScreen = "CapturePhotoScreen",
    SelectFilterPage = "SelectFilterPage",
    OrganizeCollage = "OrganizeCollage",
    PhotoPreview = "PhotoPreview",
    PrintQueue = "PrintQueue",
    ChoosePaperType = "ChoosePaperType"
}
export declare enum FlipbookPage {
    FlipbookStartScreen = "FlipbookStartScreen",
    RecordingPage = "RecordingPage",
    VideoPreview = "VideoPreview",
    FlipbookProcessing = "FlipbookProcessing",// Added for loading state
    PrintPreview = "PrintPreview"
}
export declare enum PaperType {
    TwoBySix = "2x6",
    FourBySix = "4x6"
}
export declare const PAPER_TYPE_PHOTO_COUNT: {
    "2x6": number;
    "4x6": number;
};
