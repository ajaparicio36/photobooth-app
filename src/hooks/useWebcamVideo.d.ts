export type VideoRecordingState = "idle" | "countdown" | "recording" | "processing" | "complete";
export declare const useWebcamVideo: () => {
    recordingState: VideoRecordingState;
    recordedVideo: File | null;
    countdown: number | null;
    recordingProgress: number;
    startVideoSession: (videoRef: React.RefObject<HTMLVideoElement>) => Promise<void>;
    stopRecording: () => void;
    resetRecording: () => void;
};
