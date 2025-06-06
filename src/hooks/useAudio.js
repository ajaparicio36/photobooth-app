import { useCallback } from "react";
export const useAudio = () => {
    const playCountdownTick = useCallback(async () => {
        try {
            if (window.electronAPI) {
                const result = await window.electronAPI.playAudio("/audio/countdown-tick.mp3", 0.6);
                if (!result.success && result.fallback) {
                    console.warn("Audio playback not available, continuing silently");
                }
            }
            else {
                // Fallback to HTML Audio API for web/dev
                const audio = new Audio("/audio/countdown-tick.mp3");
                audio.volume = 0.6;
                await audio.play().catch(console.warn);
            }
        }
        catch (error) {
            console.warn("Failed to play countdown tick:", error);
            // Don't throw error to avoid breaking the countdown flow
        }
    }, []);
    const playShutterSound = useCallback(async () => {
        try {
            if (window.electronAPI) {
                const result = await window.electronAPI.playAudio("/audio/shutter-sound.mp3", 0.8);
                if (!result.success && result.fallback) {
                    console.warn("Audio playback not available, continuing silently");
                }
            }
            else {
                // Fallback to HTML Audio API for web/dev
                const audio = new Audio("/audio/shutter-sound.mp3");
                audio.volume = 0.8;
                await audio.play().catch(console.warn);
            }
        }
        catch (error) {
            console.warn("Failed to play shutter sound:", error);
            // Don't throw error to avoid breaking the photo capture flow
        }
    }, []);
    return {
        playCountdownTick,
        playShutterSound,
    };
};
