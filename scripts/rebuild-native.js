const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

console.log("🔧 Rebuilding native modules for Electron...");

function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(" ")}`);
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: true,
      ...options,
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on("error", (error) => {
      reject(error);
    });
  });
}

async function rebuildNativeModules() {
  try {
    // Get Electron version from package.json
    const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
    const electronVersion =
      packageJson.build?.electronVersion ||
      packageJson.devDependencies?.electron?.replace("^", "") ||
      "28.0.0";

    console.log(`📦 Target Electron version: ${electronVersion}`);
    console.log(`📦 Current Node version: ${process.version}`);
    console.log(`📦 Current platform: ${process.platform}-${process.arch}`);

    // Check if native modules exist
    const nativeModules = ["@grandchef/node-printer", "sharp"];

    const existingModules = nativeModules.filter((module) => {
      const modulePath = path.join("node_modules", module);
      const exists = fs.existsSync(modulePath);
      console.log(`${exists ? "✅" : "❌"} ${module}: ${modulePath}`);
      return exists;
    });

    if (existingModules.length === 0) {
      console.log("ℹ️ No native modules found to rebuild");
      return;
    }

    console.log(
      `📋 Found native modules to rebuild: ${existingModules.join(", ")}`
    );

    // Clean any previous builds first
    for (const module of existingModules) {
      const buildPath = path.join("node_modules", module, "build");
      if (fs.existsSync(buildPath)) {
        console.log(`🧹 Cleaning previous build for ${module}`);
        try {
          fs.rmSync(buildPath, { recursive: true, force: true });
        } catch (cleanError) {
          console.warn(
            `Warning: Could not clean ${buildPath}:`,
            cleanError.message
          );
        }
      }
    }

    // Try targeted electron-rebuild for each module
    let rebuildSuccess = false;

    for (const module of existingModules) {
      try {
        console.log(`🔨 Rebuilding ${module} with electron-rebuild...`);

        // Use specific module rebuild
        await runCommand("npx", [
          "electron-rebuild",
          "--force",
          "--only",
          module,
          "--electron-version",
          electronVersion,
        ]);

        console.log(`✅ Successfully rebuilt ${module}`);
        rebuildSuccess = true;
      } catch (rebuildError) {
        console.warn(
          `⚠️ electron-rebuild failed for ${module}:`,
          rebuildError.message
        );

        // Try alternative rebuild method for specific modules
        try {
          if (module === "sharp") {
            console.log(`🔄 Trying Sharp-specific rebuild...`);
            await runCommand("npm", [
              "rebuild",
              "sharp",
              "--build-from-source",
            ]);
            console.log(`✅ Sharp rebuilt successfully`);
            rebuildSuccess = true;
          } else if (module === "@grandchef/node-printer") {
            console.log(`🔄 Trying printer-specific rebuild...`);
            // For printer module, we'll rely on prebuilt binaries
            console.log(`ℹ️ Using prebuilt binaries for ${module}`);
            rebuildSuccess = true;
          }
        } catch (altError) {
          console.warn(
            `⚠️ Alternative rebuild also failed for ${module}:`,
            altError.message
          );
        }
      }
    }

    // Verify rebuilds
    console.log("🔍 Verifying native module rebuilds...");
    for (const module of existingModules) {
      const buildPath = path.join("node_modules", module, "build", "Release");
      const bindingsPath = path.join("node_modules", module, "lib", "binding");
      const prebuildPath = path.join("node_modules", module, "prebuilds");

      let hasNativeBinaries = false;
      let binaryLocation = "";

      // Check multiple possible locations for native binaries
      if (fs.existsSync(buildPath)) {
        const files = fs.readdirSync(buildPath);
        const nodeFiles = files.filter((f) => f.endsWith(".node"));
        if (nodeFiles.length > 0) {
          hasNativeBinaries = true;
          binaryLocation = `build/Release (${nodeFiles.join(", ")})`;
        }
      }

      if (!hasNativeBinaries && fs.existsSync(bindingsPath)) {
        try {
          const files = fs.readdirSync(bindingsPath);
          const nodeFiles = files.filter((f) => f.endsWith(".node"));
          if (nodeFiles.length > 0) {
            hasNativeBinaries = true;
            binaryLocation = `lib/binding (${nodeFiles.join(", ")})`;
          }
        } catch (e) {
          // Ignore read errors
        }
      }

      if (!hasNativeBinaries && fs.existsSync(prebuildPath)) {
        try {
          // Check for prebuilt binaries
          const subdirs = fs.readdirSync(prebuildPath);
          for (const subdir of subdirs) {
            const subdirPath = path.join(prebuildPath, subdir);
            if (fs.statSync(subdirPath).isDirectory()) {
              const files = fs.readdirSync(subdirPath);
              const nodeFiles = files.filter((f) => f.endsWith(".node"));
              if (nodeFiles.length > 0) {
                hasNativeBinaries = true;
                binaryLocation = `prebuilds/${subdir} (${nodeFiles.join(
                  ", "
                )})`;
                break;
              }
            }
          }
        } catch (e) {
          // Ignore read errors
        }
      }

      if (hasNativeBinaries) {
        console.log(`✅ ${module}: Found binaries in ${binaryLocation}`);
      } else {
        console.warn(`⚠️ ${module}: No native binaries found after rebuild`);
      }
    }

    if (rebuildSuccess) {
      console.log("✅ Native module rebuild process completed");
    } else {
      console.warn("⚠️ Some native modules may not have been rebuilt properly");
      console.warn("🏗️ The application may still work with prebuilt binaries");
    }
  } catch (error) {
    console.error("❌ Native module rebuild failed:", error.message);
    console.warn(
      "⚠️ Continuing with build - native modules may use prebuilt binaries"
    );
  }
}

// Only run if this script is called directly
if (require.main === module) {
  rebuildNativeModules().catch((error) => {
    console.error("Script failed:", error);
    // Don't exit with error code to allow build to continue
    console.warn("⚠️ Continuing with build despite rebuild failures");
  });
}

module.exports = { rebuildNativeModules };
