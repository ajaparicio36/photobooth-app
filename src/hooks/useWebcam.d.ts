export declare const useWebcam: () => {
    videoRef: import("react").RefObject<HTMLVideoElement>;
    webcamReady: boolean;
    webcamError: string | null;
    isInitializing: boolean;
    isWebcamInitInProgress: boolean;
    resetWebcam: () => void;
    cleanup: () => void;
};
