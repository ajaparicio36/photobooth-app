export class ModuleInitializer {
  async initializeModules(): Promise<void> {
    try {
      const { sharpManager } = await import("../utils/sharp");

      if (sharpManager.isSharpAvailable()) {
        console.log("Sharp module is available and ready");
      } else {
        console.warn(
          "Sharp module failed to initialize - trying to reinitialize..."
        );
        const reinitResult = await sharpManager.reinitializeSharp();
        if (reinitResult) {
          console.log("Sharp module successfully reinitialized");
        } else {
          console.error(
            "Sharp module could not be initialized - image processing will be limited"
          );
        }
      }
    } catch (error) {
      console.error("Module initialization failed:", error);
      console.error("Some features may not work properly");
    }
  }
}
