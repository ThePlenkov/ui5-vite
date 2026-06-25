import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname, isAbsolute, posix } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import type { ResolvedUi5Project } from "./types.js";

interface RawUi5Yaml {
  specVersion?: string;
  kind?: string;
  type?: string;
  metadata?: { name?: string };
  resources?: { configuration?: { paths?: Record<string, string> } };
  framework?: {
    name?: string;
    version?: string;
    libraries?: Array<{ name?: string; optional?: boolean; development?: boolean }>;
  };
}

const DEFAULT_PATHS_BY_TYPE: Record<string, Record<string, string>> = {
  application: { "/": "webapp" },
  library: { "/resources": "src", "/test-resources": "test" },
  "theme-library": { "/resources": "src", "/test-resources": "test" },
  module: {}
};

function dirnameFromUrl(metaUrl: string): string {
  return dirname(fileURLToPath(metaUrl));
}

/**
 * Parse a ui5.yaml file and return a normalized project description.
 * The function is intentionally schema-light: it focuses on the fields the
 * Vite plugins actually consume and ignores unknown keys for forward-compat.
 */
export function loadUi5Config(yamlPath: string, opts: { cwd?: string } = {}): ResolvedUi5Project {
  const absolutePath = isAbsolute(yamlPath) ? yamlPath : resolve(opts.cwd ?? process.cwd(), yamlPath);
  if (!existsSync(absolutePath)) {
    throw new Error(`ui5.yaml not found at ${absolutePath}`);
  }
  const raw = yaml.load(readFileSync(absolutePath, "utf8")) as RawUi5Yaml | null;
  if (!raw || typeof raw !== "object") {
    throw new Error(`ui5.yaml at ${absolutePath} is empty or invalid`);
  }
  if (!raw.metadata?.name) {
    throw new Error(`ui5.yaml at ${absolutePath} is missing metadata.name`);
  }

  const projectType = (raw.type ?? "application") as ResolvedUi5Project["type"];
  const declaredPaths = raw.resources?.configuration?.paths ?? {};
  const defaultPaths = DEFAULT_PATHS_BY_TYPE[projectType] ?? {};
  // UI5 YAML uses POSIX-style keys for virtual paths.
  const paths: Record<string, string> = {};
  for (const [key, value] of Object.entries(defaultPaths)) {
    paths[normalizeVirtualPath(key)] = value;
  }
  for (const [key, value] of Object.entries(declaredPaths)) {
    paths[normalizeVirtualPath(key)] = value;
  }

  const rootPath = dirname(absolutePath);
  const webappPath = resolve(rootPath, paths["/"] ?? paths["/resources"] ?? "webapp");

  const frameworkName = raw.framework?.name === "SAPUI5" ? "SAPUI5" : "OpenUI5";
  const libraries = (raw.framework?.libraries ?? [])
    .filter((lib): lib is { name: string } => Boolean(lib?.name))
    .map((lib) => ({
      name: lib.name,
      optional: Boolean((lib as { optional?: boolean }).optional),
      development: Boolean((lib as { development?: boolean }).development)
    }));

  return {
    name: raw.metadata.name,
    type: projectType,
    kind: raw.kind === "extension" ? "extension" : "project",
    specVersion: raw.specVersion ?? "4.0",
    rootPath,
    webappPath,
    resources: paths,
    framework: {
      name: frameworkName,
      version: raw.framework?.version ?? "1.120.0",
      libraries
    }
  };
}

/** Convert keys like "webapp" or "/resources" to canonical "/resources" form. */
function normalizeVirtualPath(key: string): string {
  if (key.startsWith("/")) {
    return posix.normalize(key);
  }
  // Bare "webapp" maps to the application root ("/").
  return key === "webapp" ? "/" : `/${key}`;
}

export { dirnameFromUrl };

/**
 * Resolve a virtual URL pathname (e.g. "/resources/sap/m/Button.js") to a
 * physical file on disk, consulting the path mappings of the project.
 * Returns undefined when no mapping matches.
 */
export function resolveVirtualPath(
  project: ResolvedUi5Project,
  pathname: string
): { physicalPath: string; virtualPath: string } | undefined {
  const normalized = posix.normalize(pathname);
  // Try longest prefixes first to avoid "/resources" swallowing "/resources/sap/m".
  const sortedKeys = Object.keys(project.resources).sort((a, b) => b.length - a.length);
  for (const virtual of sortedKeys) {
    const physicalBase = project.resources[virtual];
    if (virtual === "/") {
      // Application root maps to the project's webapp directory; sub-paths belong entirely to the app.
      if (normalized === "/") {
        return { physicalPath: resolve(project.rootPath, physicalBase), virtualPath: "/" };
      }
      if (normalized.startsWith("/")) {
        return {
          physicalPath: resolve(project.rootPath, physicalBase, normalized.slice(1)),
          virtualPath: virtual
        };
      }
      continue;
    }
    if (normalized === virtual || normalized.startsWith(`${virtual}/`)) {
      const remainder = normalized.slice(virtual.length).replace(/^\//, "");
      return {
        physicalPath: remainder
          ? resolve(project.rootPath, physicalBase, remainder)
          : resolve(project.rootPath, physicalBase),
        virtualPath: virtual
      };
    }
  }
  return undefined;
}