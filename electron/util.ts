import { app } from "electron";

export const isDev = !app.isPackaged || process.env.NODE_ENV === "development";
