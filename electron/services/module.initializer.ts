export class ModuleInitializer {
  async initializeModules(): Promise<void> {
    console.log("🚀 Starting module initialization...");

    try {
      // Initialize Sharp
      console.log("📸 Initializing Sharp module...");
      const { sharpManager } = await import("../utils/sharp");

      if (sharpManager.isSharpAvailable()) {
        console.log("✅ Sharp module is available and ready");
      } else {
        console.warn(
          "⚠️ Sharp module failed to initialize - trying to reinitialize..."
        );
        const reinitResult = await sharpManager.reinitializeSharp();
        if (reinitResult) {
          console.log("✅ Sharp module successfully reinitialized");
        } else {
          console.error(
            "❌ Sharp module could not be initialized - image processing will be limited"
          );
        }
      }

      // Initialize PDF capabilities
      if (sharpManager.isPDFAvailable()) {
        console.log("✅ PDFKit is available for PDF generation");
      } else {
        console.warn("⚠️ PDFKit not available - PDF features will be disabled");
      }

      // Initialize FFmpeg
      console.log("🎬 Initializing FFmpeg module...");
      const { ffmpegManager } = await import("../utils/ffmpeg");

      if (ffmpegManager.isFFmpegAvailable()) {
        console.log("✅ FFmpeg is available and ready");
      } else {
        console.warn(
          "⚠️ FFmpeg not available - video processing will be limited"
        );
      }

      console.log("🎉 Module initialization completed");
    } catch (error) {
      console.error("❌ Module initialization failed:", error);
      console.error("Some features may not work properly");
    }
  }
}
