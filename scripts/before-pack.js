const fs = require("fs");
const path = require("path");

exports.default = async function (context) {
  console.log("🔧 Running before-pack script...");

  // Get app directory from context - handle different context structures safely
  const appDir = context.appDir || process.cwd();
  console.log("📦 App directory:", appDir);

  // Log useful context properties without circular references
  console.log("📦 Context info:");
  console.log("  - outDir:", context.outDir);
  console.log("  - platform:", context.platform?.name);
  console.log("  - arch:", context.arch);
  console.log("  - target:", context.target?.name);

  // Clean problematic files one more time before packing
  try {
    const { cleanProblematicFiles } = require("./clean-build");
    cleanProblematicFiles();
  } catch (error) {
    console.warn("⚠️ Could not run cleanup:", error.message);
  }

  // Ensure critical native modules are present
  const criticalModules = ["@grandchef/node-printer", "sharp"];

  for (const moduleName of criticalModules) {
    const modulePath = path.join(appDir, "node_modules", moduleName);
    if (!fs.existsSync(modulePath)) {
      console.warn(
        `⚠️ Critical module ${moduleName} not found at ${modulePath}`
      );
    } else {
      console.log(`✅ Critical module ${moduleName} found`);

      // Check for native binaries
      const buildPath = path.join(modulePath, "build", "Release");
      if (fs.existsSync(buildPath)) {
        try {
          const files = fs.readdirSync(buildPath);
          const nodeFiles = files.filter((f) => f.endsWith(".node"));
          console.log(
            `  - Native binaries: ${
              nodeFiles.length > 0 ? "✅" : "⚠️"
            } ${nodeFiles.join(", ")}`
          );
        } catch (readError) {
          console.warn(
            `  - Could not read build directory: ${readError.message}`
          );
        }
      } else {
        console.warn(`  - No build directory found for ${moduleName}`);
      }
    }
  }

  console.log("✅ Before-pack script completed");
};
