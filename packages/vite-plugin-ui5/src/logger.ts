import { getLogger as getUi5Logger, setLogLevel, type Logger } from "@ui5/logger";

export type Ui5Logger = Logger;

export interface LoggerOptions {
  level?: "silent" | "error" | "warn" | "info" | "verbose" | "silly";
  prefix?: string;
}

let projectLogger: Logger | undefined;

/**
 * Returns a singleton UI5 logger that uses the library name "ui5-vite".
 * The optional level argument also calls `setLogLevel` so the level
 * change persists for all loggers in the process.
 */
export function getLogger(options: LoggerOptions = {}): Ui5Logger {
  if (!projectLogger) {
    projectLogger = getUi5Logger("ui5-vite");
  }
  if (options.level) {
    setLogLevel(options.level);
  }
  return projectLogger;
}