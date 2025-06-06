const fs = require("fs");
const path = require("path");

console.log("🧹 Cleaning problematic files before build...");

function deleteIfExists(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const stat = fs.lstatSync(filePath);
      if (stat.isSymbolicLink()) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Removed symlink: ${filePath}`);
      } else if (stat.isDirectory()) {
        fs.rmSync(filePath, { recursive: true, force: true });
        console.log(`🗑️ Removed directory: ${filePath}`);
      } else {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Removed file: ${filePath}`);
      }
    }
  } catch (error) {
    console.warn(`⚠️ Failed to remove ${filePath}:`, error.message);
  }
}

function cleanProblematicFiles() {
  // Clean problematic .bin directories and symlinks
  const problematicPaths = [
    "node_modules/cross-spawn/node_modules/.bin",
    "node_modules/cross-spawn/.bin",
    "node_modules/@electron/rebuild",
    "node_modules/.bin/node-which",
    "node_modules/.bin/which",
    "node_modules/.bin/cross-spawn",
    // Clean any build artifacts that might cause issues
    "build",
    "binding.gyp",
    ".node-gyp",
  ];

  problematicPaths.forEach(deleteIfExists);

  // Find and remove all .bin directories that might contain broken symlinks
  function findAndCleanBinDirs(dir) {
    try {
      if (!fs.existsSync(dir)) return;

      const items = fs.readdirSync(dir);

      for (const item of items) {
        const itemPath = path.join(dir, item);

        try {
          const stat = fs.lstatSync(itemPath);

          if (stat.isDirectory()) {
            if (item === ".bin") {
              console.log(`🔍 Found .bin directory: ${itemPath}`);
              try {
                const binContents = fs.readdirSync(itemPath);
                for (const binItem of binContents) {
                  const binItemPath = path.join(itemPath, binItem);
                  try {
                    const binStat = fs.lstatSync(binItemPath);
                    if (binStat.isSymbolicLink()) {
                      try {
                        fs.readlinkSync(binItemPath);
                      } catch (e) {
                        // Broken symlink
                        deleteIfExists(binItemPath);
                      }
                    }
                  } catch (e) {
                    deleteIfExists(binItemPath);
                  }
                }
              } catch (e) {
                console.warn(
                  `⚠️ Could not read .bin directory ${itemPath}:`,
                  e.message
                );
              }
            } else if (
              item === "node_modules" &&
              !itemPath.includes("node_modules\\node_modules")
            ) {
              // Avoid infinite recursion - only go one level deep into nested node_modules
              findAndCleanBinDirs(itemPath);
            }
          }
        } catch (e) {
          console.warn(`⚠️ Could not stat ${itemPath}:`, e.message);
        }
      }
    } catch (error) {
      console.warn(
        `⚠️ Error cleaning bin directories in ${dir}:`,
        error.message
      );
    }
  }

  findAndCleanBinDirs("node_modules");

  console.log("✅ Cleanup completed");
}

if (require.main === module) {
  cleanProblematicFiles();
}

module.exports = { cleanProblematicFiles };
