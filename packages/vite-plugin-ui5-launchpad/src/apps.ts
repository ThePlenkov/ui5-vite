import type { LaunchpadApp } from "./types.js";

/** Render an array of LaunchpadApp to a JS string that mutates window["sap-ushell-config"].applications. */
export function renderApplicationsConfig(apps: LaunchpadApp[] = []): string {
  const payload: Record<string, Record<string, unknown>> = {};
  for (const app of apps) {
    const key = `${app.semanticObject}-${app.action}`;
    const entry: Record<string, unknown> = {
      title: app.title ?? `${app.semanticObject} ${app.action}`,
      description: app.description ?? ""
    };
    if (app.applicationType === "URL") {
      entry.applicationType = "URL";
      entry.url = app.url ?? "/";
    } else {
      entry.applicationType = "SAPUI5.Component";
      entry.additionalInformation = `SAPUI5.Component=${app.component ?? app.semanticObject}`;
    }
    if (app.icon) {
      entry.icon = app.icon;
    }
    if (app.tileSize) {
      entry.tileSize = app.tileSize;
    }
    if (app.keywords?.length) {
      entry.keywords = app.keywords;
    }
    if (app.additionalInformation && !entry.additionalInformation) {
      entry.additionalInformation = app.additionalInformation;
    }
    for (const [k, v] of Object.entries(app)) {
      if (
        k === "semanticObject" ||
        k === "action" ||
        k === "title" ||
        k === "description" ||
        k === "component" ||
        k === "url" ||
        k === "applicationType" ||
        k === "icon" ||
        k === "tileSize" ||
        k === "keywords" ||
        k === "additionalInformation"
      ) {
        continue;
      }
      entry[k] = v;
    }
    payload[key] = entry;
  }
  return `window["sap-ushell-config"] = window["sap-ushell-config"] || {};\n` +
    `if (!window["sap-ushell-config"].applications) {\n` +
    `  window["sap-ushell-config"].applications = {};\n` +
    `}\n` +
    `Object.assign(window["sap-ushell-config"].applications, ${JSON.stringify(payload, null, 2)});\n`;
}

/** Render the runtime JSON of the launchpad config (services, renderers, etc.). */
export function renderInitialConfig(opts: {
  renderer?: string;
  enableSearch?: boolean;
  enableUserDefaultParameters?: boolean;
  rootIntent?: string;
}): string {
  const config = {
    defaultRenderer: opts.renderer ?? "fiori2",
    renderers: {
      fiori2: {
        componentData: {
          config: {
            enableSearch: opts.enableSearch ?? false,
            enableUserDefaultParameters: opts.enableUserDefaultParameters ?? true,
            rootIntent: opts.rootIntent ?? "Shell-home"
          }
        }
      }
    },
    services: {
      NavTargetResolution: {
        config: {
          allowTestUrlComponentConfig: true,
          enableClientSideTargetResolution: true
        }
      }
    }
  };
  return `window["sap-ushell-config"] = window["sap-ushell-config"] || {};\n` +
    `Object.assign(window["sap-ushell-config"], ${JSON.stringify(config, null, 2)});\n`;
}