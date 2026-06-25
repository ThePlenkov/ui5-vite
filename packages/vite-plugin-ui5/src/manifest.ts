export interface Manifest {
  _version?: string;
  "sap.app"?: Record<string, unknown>;
  "sap.ui5"?: Record<string, unknown>;
  "sap.ui"?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Enrich a UI5 manifest.json with the supportedLocales derived from the
 * project's available i18n .properties files. This mirrors the behaviour
 * of the UI5 CLI serveResources middleware.
 */
export function enrichManifest(manifest: Manifest, supportedLocales: string[] = []): Manifest {
  if (!manifest["sap.ui5"] || typeof manifest["sap.ui5"] !== "object") {
    manifest["sap.ui5"] = {};
  }
  const ui5 = manifest["sap.ui5"] as Record<string, unknown>;
  if (supportedLocales.length > 0 && !Array.isArray(ui5.supportedLocales)) {
    ui5.supportedLocales = supportedLocales;
  }
  return manifest;
}

/**
 * Escape non-ASCII characters in i18n .properties files.
 * Mirrors the behaviour of the UI5 CLI escapeNonAsciiCharacters build task.
 */
export function transformProperties(source: string): string {
  let out = "";
  for (let i = 0; i < source.length; i++) {
    const code = source.charCodeAt(i);
    if (code > 127) {
      out += `\\u${code.toString(16).padStart(4, "0")}`;
    } else {
      out += source[i];
    }
  }
  return out;
}