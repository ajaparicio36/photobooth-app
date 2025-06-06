export type CaptureState = "idle" | "countdown" | "capturing" | "preview" | "complete";
export declare const usePhotoCapture: (requiredPhotos: number) => {
    captureState: CaptureState;
    sessionStarted: boolean;
    countdown: number | null;
    capturedPhotos: File[];
    currentPhotoPreview: string | null;
    canvasRef: import("react").RefObject<HTMLCanvasElement>;
    photosArrayRef: import("react").MutableRefObject<File[]>;
    countdownValueRef: import("react").MutableRefObject<number>;
    setSessionStarted: import("react").Dispatch<import("react").SetStateAction<boolean>>;
    setCountdownDisplay: import("react").Dispatch<import("react").SetStateAction<number | null>>;
    setCaptureState: import("react").Dispatch<import("react").SetStateAction<CaptureState>>;
    resetSession: () => void;
    capturePhoto: (videoRef: React.RefObject<HTMLVideoElement>, onPhotoCapture: (photo: File) => void, playShutterSound: () => void, startNextCountdown?: () => void) => Promise<void>;
    clearTimers: () => void;
    countdownTimerRef: import("react").MutableRefObject<NodeJS.Timeout | null>;
};
