const sharp = require("sharp");

// Configure Sharp for Electron
if (process.versions.electron) {
  // Ensure Sharp uses the correct binaries for Electron
  try {
    sharp.cache(false);
    sharp.concurrency(1);
    console.log("Sharp configured for Electron");
  } catch (error) {
    console.error("Failed to configure Sharp for Electron:", error);
  }
}

module.exports = sharp;
