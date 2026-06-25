import type { Plugin, ViteDevServer, Connect } from "vite";
import { normalizePath } from "vite";
import { loadUi5Config, getLogger, type Ui5Logger } from "@ui5/vite-plugin-ui5";
import { renderLaunchpadHtml } from "./templates.js";
import type { LaunchpadPluginOptions } from "./types.js";

const DEFAULT_PATH = "/";
const DEFAULT_ENTRY = "index.html";

function versionGte(version: string, target: [number, number]): boolean {
  const parts = version.split(".").map((n) => parseInt(n, 10));
  if (parts.length < 2 || parts.some((n) => Number.isNaN(n))) {
    return false;
  }
  const [major, minor] = parts;
  const [tMajor, tMinor] = target;
  if (major > tMajor) return true;
  if (major < tMajor) return false;
  return minor >= tMinor;
}

export function ui5Launchpad(options: LaunchpadPluginOptions = {}): Plugin {
  const path = options.path ?? DEFAULT_PATH;
  const entry = options.entry ?? DEFAULT_ENTRY;
  const configPath = options.configPath ?? "ui5.yaml";
  const log: Ui5Logger = getLogger({ level: options.verbose ? "verbose" : "info" });

  let useAsync = options.async === true;
  let frameworkName: "OpenUI5" | "SAPUI5" = "OpenUI5";
  let frameworkVersion = "1.120.0";

  function bootstrap(): void {
    const project = loadUi5Config(configPath);
    frameworkName = project.framework.name;
    frameworkVersion = project.framework.version;
    if (options.async === "auto" || options.async === undefined) {
      useAsync = versionGte(frameworkVersion, [1, 136]);
    } else {
      useAsync = Boolean(options.async);
    }
    log.info(
      `Fiori launchpad sandbox serving at ${path === "/" ? "/" : path}/${entry} ` +
        `(framework: ${frameworkName} ${frameworkVersion}, async=${useAsync})`
    );
  }

  function renderForRequest(): string {
    const project = loadUi5Config(configPath);
    frameworkName = project.framework.name;
    frameworkVersion = project.framework.version;
    if (options.async === "auto" || options.async === undefined) {
      useAsync = versionGte(frameworkVersion, [1, 136]);
    }
    return renderLaunchpadHtml({
      ...options,
      frameworkName,
      frameworkVersion,
      useAsync
    }).html;
  }

  return {
    name: "ui5-launchpad",
    enforce: "pre",
    configResolved() {
      bootstrap();
    },
    configureServer(server: ViteDevServer) {
      const middleware: Connect.NextHandleFunction = (req, res, next) => {
        if (!req.url || !req.method || (req.method !== "GET" && req.method !== "HEAD")) {
          return next();
        }
        const url = new URL(req.url, "http://localhost");
        // Always intercept exactly <path> or <path>/<entry>; pass through everything else.
        const normalizedEntry = normalizePath(entry);
        const matchesRoot = url.pathname === path || url.pathname === `${path}/`;
        const matchesEntry = url.pathname === `${path}/${normalizedEntry}`;
        if (!matchesRoot && !matchesEntry) {
          return next();
        }
        log.verbose(`Serving launchpad HTML for ${url.pathname}`);
        try {
          const html = renderForRequest();
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.setHeader("Cache-Control", "no-cache");
          if (req.method === "HEAD") {
            res.end();
          } else {
            res.end(html);
          }
        } catch (err) {
          log.error(`Failed to render launchpad: ${(err as Error).message}`);
          res.statusCode = 500;
          res.end(`Launchpad render error: ${(err as Error).message}`);
        }
        return undefined;
      };
      server.middlewares.use(middleware);
    }
  };
}

export { renderLaunchpadHtml } from "./templates.js";
export type { LaunchpadPluginOptions, LaunchpadApp, LaunchpadGroup } from "./types.js";