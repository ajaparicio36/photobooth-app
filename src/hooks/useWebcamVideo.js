import { useState, useRef, useCallback } from "react";
export const useWebcamVideo = () => {
    const [recordingState, setRecordingState] = useState("idle");
    const [recordedVideo, setRecordedVideo] = useState(null);
    const [countdown, setCountdown] = useState(null);
    const [recordingProgress, setRecordingProgress] = useState(0);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const countdownTimerRef = useRef(null);
    const recordingTimerRef = useRef(null);
    const progressIntervalRef = useRef(null);
    const clearTimers = useCallback(() => {
        if (countdownTimerRef.current) {
            clearTimeout(countdownTimerRef.current);
            countdownTimerRef.current = null;
        }
        if (recordingTimerRef.current) {
            clearTimeout(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
    }, []);
    const startCountdown = useCallback((onComplete) => {
        setRecordingState("countdown");
        let count = 3;
        setCountdown(count);
        const countdownInterval = setInterval(() => {
            count -= 1;
            if (count > 0) {
                setCountdown(count);
            }
            else {
                clearInterval(countdownInterval);
                setCountdown(null);
                onComplete();
            }
        }, 1000);
        countdownTimerRef.current = countdownInterval;
    }, []);
    const startRecording = useCallback(async (videoRef, duration = 7000) => {
        try {
            if (!videoRef.current || !videoRef.current.srcObject) {
                throw new Error("Video stream not available");
            }
            const stream = videoRef.current.srcObject;
            // Clear any existing recorded data
            recordedChunksRef.current = [];
            // Create MediaRecorder
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: "video/webm;codecs=vp9", // Use VP9 for better quality
            });
            mediaRecorderRef.current = mediaRecorder;
            // Set up event handlers
            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                }
            };
            mediaRecorder.onstop = () => {
                setRecordingState("processing");
                // Create video file from recorded chunks
                const blob = new Blob(recordedChunksRef.current, {
                    type: "video/webm",
                });
                const videoFile = new File([blob], `flipbook_video_${Date.now()}.webm`, { type: "video/webm" });
                setRecordedVideo(videoFile);
                setRecordingState("complete");
                setRecordingProgress(0);
            };
            // Start recording
            setRecordingState("recording");
            setRecordingProgress(0);
            mediaRecorder.start(100); // Collect data every 100ms
            // Set up progress tracking
            const startTime = Date.now();
            progressIntervalRef.current = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min((elapsed / duration) * 100, 100);
                setRecordingProgress(progress);
            }, 100);
            // Stop recording after duration
            recordingTimerRef.current = setTimeout(() => {
                if (mediaRecorderRef.current &&
                    mediaRecorderRef.current.state === "recording") {
                    mediaRecorderRef.current.stop();
                }
                clearTimers();
            }, duration);
        }
        catch (error) {
            console.error("Failed to start recording:", error);
            setRecordingState("idle");
            throw error;
        }
    }, [clearTimers]);
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current &&
            mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
        }
        clearTimers();
    }, [clearTimers]);
    const resetRecording = useCallback(() => {
        clearTimers();
        setRecordingState("idle");
        setRecordedVideo(null);
        setCountdown(null);
        setRecordingProgress(0);
        recordedChunksRef.current = [];
        mediaRecorderRef.current = null;
    }, [clearTimers]);
    const startVideoSession = useCallback(async (videoRef) => {
        return new Promise((resolve) => {
            startCountdown(() => {
                startRecording(videoRef, 7000)
                    .then(() => {
                    resolve();
                })
                    .catch((error) => {
                    console.error("Recording failed:", error);
                    setRecordingState("idle");
                    resolve();
                });
            });
        });
    }, [startCountdown, startRecording]);
    return {
        recordingState,
        recordedVideo,
        countdown,
        recordingProgress,
        startVideoSession,
        stopRecording,
        resetRecording,
    };
};
