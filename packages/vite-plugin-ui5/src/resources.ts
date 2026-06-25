import type { Plugin, ViteDevServer } from "vite";
import { resolve as resolvePath } from "node:path";
import { readFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { ResolvedUi5Project, Ui5VitePluginOptions } from "./types.js";
import { loadUi5Config, resolveVirtualPath } from "./ui5-config.js";
import { getLogger } from "./logger.js";
import { fetchFrameworkResource, resolveFramework, type FrameworkInfo } from "./framework.js";

const RESOURCE_PREFIX = "/resources";
const TEST_RESOURCE_PREFIX = "/test-resources";

interface MiddlewareContext {
  project: ResolvedUi5Project;
  framework: FrameworkInfo;
  options: Required<Ui5VitePluginOptions>;
  log: ReturnType<typeof getLogger>;
}

function setCorsHeaders(res: ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-cache");
}

async function serveFromDisk(physicalPath: string, res: ServerResponse): Promise<boolean> {
  try {
    const stat = statSync(physicalPath);
    if (!stat.isFile()) {
      return false;
    }
    const body = await readFile(physicalPath);
    res.end(body);
    return true;
  } catch {
    return false;
  }
}

function matchesFrameworkPath(pathname: string): { kind: "resources" | "test-resources"; remainder: string } | undefined {
  if (pathname.startsWith(`${RESOURCE_PREFIX}/`)) {
    return { kind: "resources", remainder: pathname.slice(RESOURCE_PREFIX.length + 1) };
  }
  if (pathname.startsWith(`${TEST_RESOURCE_PREFIX}/`)) {
    return { kind: "test-resources", remainder: pathname.slice(TEST_RESOURCE_PREFIX.length + 1) };
  }
  return undefined;
}

async function handleUi5Request(req: IncomingMessage, res: ServerResponse, ctx: MiddlewareContext): Promise<boolean> {
  if (!req.url || (req.method !== "GET" && req.method !== "HEAD")) {
    return false;
  }
  const pathname = decodeURIComponent(req.url.split("?")[0]);
  ctx.log.silly(`ui5-resources: incoming ${req.method} ${pathname}`);

  setCorsHeaders(res);

  // 1) Application webapp (and any other declared virtual mount) first.
  const projectMatch = resolveVirtualPath(ctx.project, pathname);
  if (projectMatch && existsSync(projectMatch.physicalPath)) {
    const ok = await serveFromDisk(projectMatch.physicalPath, res);
    if (ok) return true;
  }

  // 2) Framework resources / test-resources from CDN.
  const frameworkMatch = matchesFrameworkPath(pathname);
  if (frameworkMatch) {
    // 2a) Local framework installation (when configured).
    if (ctx.options.useLocalFramework && ctx.options.localFrameworkPath) {
      const candidate = resolvePath(ctx.options.localFrameworkPath, frameworkMatch.kind, frameworkMatch.remainder);
      if (existsSync(candidate)) {
        const ok = await serveFromDisk(candidate, res);
        if (ok) return true;
      }
    }
    // 2b) Public CDN.
    const fetched = await fetchFrameworkResource(ctx.framework, frameworkMatch.kind, frameworkMatch.remainder, ctx.log);
    if (fetched) {
      res.setHeader("Content-Type", fetched.contentType);
      res.statusCode = 200;
      if (req.method === "HEAD") {
        res.end();
      } else {
        res.end(fetched.body);
      }
      return true;
    }
  }

  // Not ours - let other middlewares try.
  return false;
}

/**
 * Vite plugin that wires up UI5 resource serving.
 *
 * Resolution order for any incoming request:
 *   1. Project-relative physical file (consults ui5.yaml path mappings).
 *   2. Local framework installation (when useLocalFramework is true, for /resources/* only).
 *   3. Public CDN (for /resources/* and /test-resources/* only).
 *
 * Requests that don't match any UI5 path are passed through to other plugins.
 */
export function ui5Resources(options: Ui5VitePluginOptions = {}): Plugin {
  const resolved: Required<Ui5VitePluginOptions> = {
    configPath: options.configPath ?? "ui5.yaml",
    frameworkUrl: options.frameworkUrl ?? "",
    useLocalFramework: Boolean(options.useLocalFramework),
    localFrameworkPath: options.localFrameworkPath ?? "",
    theme: options.theme ?? "sap_horizon",
    pathMappings: options.pathMappings ?? {},
    verbose: Boolean(options.verbose)
  };

  const log = getLogger({ level: resolved.verbose ? "verbose" : "info" });

  let ctx: MiddlewareContext | undefined;

  function ensureCtx(): MiddlewareContext {
    if (ctx) return ctx;
    const project = loadUi5Config(resolved.configPath);
    if (Object.keys(resolved.pathMappings).length > 0) {
      project.resources = { ...project.resources, ...resolved.pathMappings };
    }
    const framework = resolveFramework(project, resolved.frameworkUrl || undefined);
    log.info(`UI5 project "${project.name}" (${project.framework.name} ${project.framework.version})`);
    log.info(`Framework CDN: ${framework.cdnUrl}`);
    ctx = { project, framework, options: resolved, log };
    return ctx;
  }

  return {
    name: "ui5-resources",
    configureServer(server: ViteDevServer) {
      const localCtx = ensureCtx();
      // Register BEFORE Vite's own middlewares so we win the race for /resources/*.
      server.middlewares.use(async (req, res, next) => {
        try {
          const handled = await handleUi5Request(req, res, localCtx);
          if (!handled) next();
        } catch (err) {
          localCtx.log.error(`UI5 middleware error: ${(err as Error).message}`);
          next(err);
        }
      });
    },
    configurePreviewServer(server) {
      const localCtx = ensureCtx();
      server.middlewares.use(async (req, res, next) => {
        try {
          const handled = await handleUi5Request(req, res, localCtx);
          if (!handled) next();
        } catch (err) {
          next(err);
        }
      });
    },
    resolveId(source) {
      if (!source.startsWith("ui5:")) {
        return null;
      }
      // Resolve virtual UI5 module references like `ui5:sap/m/Button` to a CDN URL
      // so that client-side code can use `import "ui5:sap/m/Button"` as a hint.
      const remainder = source.slice(4);
      return { id: `/__ui5_virtual__/${remainder}.js`, moduleSideEffects: true };
    }
  };
}