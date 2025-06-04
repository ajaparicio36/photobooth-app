export enum PhotoModePage {
  CapturePhotoScreen = "CapturePhotoScreen",
  SelectFilterPage = "SelectFilterPage",
  OrganizeCollage = "OrganizeCollage",
  PhotoPreview = "PhotoPreview",
  PrintQueue = "PrintQueue",
  ChoosePaperType = "ChoosePaperType",
}

export enum FlipbookPage {
  FlipbookStartScreen = "FlipbookStartScreen",
  RecordingPage = "RecordingPage",
  VideoPreview = "VideoPreview",
  PrintPreview = "PrintPreview",
}

export enum PaperType {
  TwoBySix = "2x6",
  FourBySix = "4x6",
}

export const PAPER_TYPE_PHOTO_COUNT = {
  [PaperType.TwoBySix]: 2,
  [PaperType.FourBySix]: 4,
};
