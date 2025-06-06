import { app } from "electron";

// Check if we're in development based on multiple factors
export const isDev =
  process.env.NODE_ENV === "development" ||
  (!app.isPackaged && process.argv.includes("--dev"));

// Add a specific check for production testing
export const isTestingProd =
  !app.isPackaged &&
  process.env.NODE_ENV !== "development" &&
  !process.argv.includes("--dev");
