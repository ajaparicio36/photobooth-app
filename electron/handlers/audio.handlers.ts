import { ipcMain, app } from "electron";
import * as fs from "fs";
import * as path from "path";
import { isDev } from "../util";

let audioPlayer: any = null;

export function registerAudioHandlers(mainWindow: Electron.BrowserWindow) {
  ipcMain.handle(
    "play-audio",
    async (_, audioPath: string, volume: number = 0.7) => {
      try {
        // Stop any currently playing audio
        if (audioPlayer) {
          audioPlayer.kill();
          audioPlayer = null;
        }

        // Resolve the audio file path
        let resolvedPath = audioPath;

        if (audioPath.startsWith("/")) {
          const relativePath = audioPath.substring(1);

          if (isDev) {
            resolvedPath = path.join(__dirname, "../public", relativePath);
          } else if (app.isPackaged) {
            resolvedPath = path.join(
              process.resourcesPath,
              "public",
              relativePath
            );
          } else {
            const possiblePaths = [
              path.join(__dirname, "../dist", relativePath),
              path.join(__dirname, "../public", relativePath),
              path.join(process.cwd(), "dist", relativePath),
              path.join(process.cwd(), "public", relativePath),
            ];

            resolvedPath = "";
            for (const testPath of possiblePaths) {
              if (fs.existsSync(testPath)) {
                resolvedPath = testPath;
                break;
              }
            }

            if (!resolvedPath) {
              throw new Error(
                `Audio file not found in any expected location: ${relativePath}`
              );
            }
          }
        }

        console.log("Attempting to play audio:", resolvedPath);

        if (!fs.existsSync(resolvedPath)) {
          throw new Error(`Audio file not found: ${resolvedPath}`);
        }

        const fileUrl = `file://${resolvedPath.replace(/\\/g, "/")}`;

        // Try using the main window's webContents to play audio
        try {
          if (mainWindow && !mainWindow.isDestroyed()) {
            const audioPlayResult = await mainWindow.webContents
              .executeJavaScript(`
              (async () => {
                try {
                  if (window.currentElectronAudio) {
                    window.currentElectronAudio.pause();
                    window.currentElectronAudio = null;
                  }
                  
                  const audio = new Audio("${fileUrl}");
                  audio.volume = ${Math.max(0, Math.min(1, volume))};
                  window.currentElectronAudio = audio;
                  
                  return new Promise((resolve, reject) => {
                    audio.oncanplaythrough = () => {
                      audio.play()
                        .then(() => resolve({ success: true, method: 'webContents' }))
                        .catch(reject);
                    };
                    audio.onerror = (e) => reject(new Error('Audio load failed: ' + e.type));
                    audio.onended = () => {
                      window.currentElectronAudio = null;
                    };
                    
                    setTimeout(() => reject(new Error('Audio load timeout')), 5000);
                  });
                } catch (error) {
                  throw new Error('WebContents audio failed: ' + error.message);
                }
              })()
            `);

            return { success: true, path: resolvedPath, method: "webContents" };
          }
        } catch (webContentsError) {
          console.warn("WebContents audio playback failed:", webContentsError);
        }

        // Fallback to platform-specific audio players
        return await playAudioWithSystemPlayer(resolvedPath, volume);
      } catch (error: any) {
        console.error("Failed to play audio:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          fallback: true,
        };
      }
    }
  );

  ipcMain.handle("stop-audio", async () => {
    try {
      if (audioPlayer) {
        audioPlayer.kill();
        audioPlayer = null;
      }

      if (mainWindow && !mainWindow.isDestroyed()) {
        try {
          await mainWindow.webContents.executeJavaScript(`
            if (window.currentElectronAudio) {
              window.currentElectronAudio.pause();
              window.currentElectronAudio = null;
            }
          `);
        } catch (err) {
          console.warn("Failed to stop webContents audio:", err);
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error("Failed to stop audio:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });
}

async function playAudioWithSystemPlayer(resolvedPath: string, volume: number) {
  const { spawn } = require("child_process");

  if (process.platform === "win32") {
    try {
      const psScript = `
        Add-Type -AssemblyName presentationCore
        $mediaPlayer = New-Object system.windows.media.mediaplayer
        $mediaPlayer.open([uri]"${resolvedPath}")
        $mediaPlayer.Volume = ${volume}
        $mediaPlayer.Play()
        Start-Sleep -Seconds 3
        $mediaPlayer.Stop()
        $mediaPlayer.Close()
      `;

      audioPlayer = spawn("powershell", ["-Command", psScript], {
        stdio: "pipe",
        windowsHide: true,
      });

      return new Promise((resolve, reject) => {
        let resolved = false;

        audioPlayer.on("close", (code: number | null) => {
          if (!resolved) {
            resolved = true;
            if (code === 0) {
              resolve({
                success: true,
                path: resolvedPath,
                method: "powershell-mci",
              });
            } else {
              reject(new Error(`Audio playback failed with code: ${code}`));
            }
          }
        });

        audioPlayer.on("error", (err: Error) => {
          if (!resolved) {
            resolved = true;
            reject(new Error(`PowerShell audio error: ${err.message}`));
          }
        });

        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            if (audioPlayer && !audioPlayer.killed) {
              audioPlayer.kill();
            }
            resolve({
              success: true,
              path: resolvedPath,
              method: "powershell-timeout",
            });
          }
        }, 4000);
      });
    } catch (error) {
      console.warn("PowerShell audio failed:", error);
    }
  } else if (process.platform === "darwin") {
    audioPlayer = spawn("afplay", [resolvedPath], { stdio: "ignore" });
    return { success: true, path: resolvedPath, method: "afplay" };
  } else {
    try {
      audioPlayer = spawn("aplay", [resolvedPath], { stdio: "ignore" });
      return { success: true, path: resolvedPath, method: "aplay" };
    } catch {
      try {
        audioPlayer = spawn("paplay", [resolvedPath], { stdio: "ignore" });
        return { success: true, path: resolvedPath, method: "paplay" };
      } catch {
        audioPlayer = spawn("play", [resolvedPath], { stdio: "ignore" });
        return { success: true, path: resolvedPath, method: "play" };
      }
    }
  }

  return {
    success: true,
    path: resolvedPath,
    method: "silent-fallback",
    warning: "Audio playback not available",
  };
}

export function cleanupAudio() {
  if (audioPlayer) {
    audioPlayer.kill();
    audioPlayer = null;
  }
}
