/** Default public CDNs for UI5 distributions. */
export const DEFAULT_FRAMEWORK_URLS = {
  OpenUI5: "https://sdk.openui5.org",
  SAPUI5: "https://ui5.sap.com"
} as const;

export function defaultFrameworkUrl(name: "OpenUI5" | "SAPUI5"): string {
  return DEFAULT_FRAMEWORK_URLS[name];
}

export function normalizeFrameworkUrl(url: string): string {
  return url.replace(/\/+$/, "");
}