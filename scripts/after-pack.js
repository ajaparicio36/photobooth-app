const fs = require("fs");
const path = require("path");

function safeExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    console.warn(`⚠️ Error checking ${filePath}:`, error.message);
    return false;
  }
}

function safeReadDir(dirPath) {
  try {
    return fs.readdirSync(dirPath);
  } catch (error) {
    console.warn(`⚠️ Error reading directory ${dirPath}:`, error.message);
    return [];
  }
}

exports.default = async function (context) {
  console.log("🔧 Running after-pack script...");

  const { appOutDir, packager } = context;
  const resourcesPath = path.join(appOutDir, "resources");

  console.log("📦 App output directory:", appOutDir);
  console.log("📁 Resources path:", resourcesPath);

  // Check if native modules are properly included
  const nativeModules = ["@grandchef/node-printer", "sharp"];

  for (const moduleName of nativeModules) {
    const moduleInAsar = path.join(
      resourcesPath,
      "app.asar.unpacked",
      "node_modules",
      moduleName
    );
    const moduleInResources = path.join(
      resourcesPath,
      "node_modules",
      moduleName
    );

    console.log(`🔍 Checking ${moduleName}:`);
    console.log(
      `  - ASAR unpacked: ${
        safeExists(moduleInAsar) ? "✅" : "❌"
      } ${moduleInAsar}`
    );
    console.log(
      `  - Resources: ${
        safeExists(moduleInResources) ? "✅" : "❌"
      } ${moduleInResources}`
    );

    if (safeExists(moduleInAsar)) {
      const buildPath = path.join(moduleInAsar, "build", "Release");
      if (safeExists(buildPath)) {
        const files = safeReadDir(buildPath);
        const nodeFiles = files.filter((f) => f.endsWith(".node"));
        console.log(
          `  - Native binaries: ${
            nodeFiles.length > 0 ? "✅" : "❌"
          } ${nodeFiles.join(", ")}`
        );
      }
    }
  }

  // Clean up any remaining problematic files in the packed app
  const problematicPaths = [
    path.join(resourcesPath, "app.asar.unpacked", "node_modules", ".bin"),
    path.join(resourcesPath, "node_modules", ".bin"),
  ];

  for (const problematicPath of problematicPaths) {
    if (safeExists(problematicPath)) {
      try {
        fs.rmSync(problematicPath, { recursive: true, force: true });
        console.log(`🧹 Cleaned up problematic path: ${problematicPath}`);
      } catch (error) {
        console.warn(`⚠️ Failed to clean ${problematicPath}:`, error.message);
      }
    }
  }

  console.log("✅ After-pack script completed");
};
