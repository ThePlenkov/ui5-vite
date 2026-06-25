import type { Ui5Logger } from "./logger.js";
import type { ResolvedUi5Project } from "./types.js";

const DEFAULT_FRAMEWORK_URLS = {
  // ui5.sap.com hosts both the OpenUI5 and SAPUI5 distributions and is the
  // single best source for /test-resources (the OpenUI5 SDK does not serve them).
  OpenUI5: "https://ui5.sap.com",
  SAPUI5: "https://ui5.sap.com"
} as const;

export function defaultFrameworkUrl(name: "OpenUI5" | "SAPUI5"): string {
  return DEFAULT_FRAMEWORK_URLS[name];
}

export function normalizeFrameworkUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

export interface FrameworkInfo {
  /** Fully qualified CDN base URL for the framework, e.g. https://ui5.sap.com/1.120.0 */
  cdnUrl: string;
  /** Version string as configured in ui5.yaml */
  version: string;
  /** "OpenUI5" or "SAPUI5" */
  name: "OpenUI5" | "SAPUI5";
}

export function resolveFramework(project: ResolvedUi5Project, override?: string): FrameworkInfo {
  const base = override ? normalizeFrameworkUrl(override) : defaultFrameworkUrl(project.framework.name);
  const cdnUrl = `${base.replace(/\/$/, "")}/${project.framework.version}`;
  return {
    cdnUrl,
    version: project.framework.version,
    name: project.framework.name
  };
}

/** Fetch a single framework resource from the CDN and return its body + content-type. */
export async function fetchFrameworkResource(
  info: FrameworkInfo,
  kind: "resources" | "test-resources",
  resourcePath: string,
  log: Ui5Logger
): Promise<{ body: Buffer; contentType: string } | undefined> {
  const url = `${info.cdnUrl}/${kind}/${resourcePath.replace(/^\//, "")}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      log.verbose(`Framework resource ${url} responded ${response.status}`);
      return undefined;
    }
    const contentType = response.headers.get("content-type") ?? "application/octet-stream";
    const body = Buffer.from(await response.arrayBuffer());
    return { body, contentType };
  } catch (err) {
    log.warn(`Failed to fetch framework resource ${url}: ${(err as Error).message}`);
    return undefined;
  }
}