import type { LaunchpadPluginOptions, RenderedLaunchpad } from "./types.js";
import { renderApplicationsConfig, renderInitialConfig } from "./apps.js";

const FLIP_LIBS_DEFAULT = "sap.m, sap.ushell";

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface TemplateInputs extends LaunchpadPluginOptions {
  frameworkName: "OpenUI5" | "SAPUI5";
  frameworkVersion: string;
  useAsync: boolean;
}

export function renderLaunchpadHtml(input: TemplateInputs): RenderedLaunchpad {
  const useAsync = input.useAsync;
  const libs = input.libs ?? FLIP_LIBS_DEFAULT;
  const theme = input.theme ?? "sap_horizon";
  const compatVersion = input.compatVersion ?? "edge";
  const language = input.language;

  const initialConfig = renderInitialConfig({
    renderer: input.renderer ?? "fiori2",
    enableSearch: input.enableSearch ?? false,
    enableUserDefaultParameters: true,
    rootIntent: input.initialIntent
      ? `Shell-${input.initialIntent.action}`
      : "Shell-home"
  });

  const appsConfig = renderApplicationsConfig(input.apps ?? []);

  const bootstrapSrc = useAsync
    ? "/resources/sap/ushell/bootstrap/sandbox.js"
    : "/resources/sap/ushell/bootstrap/sandbox.js";

  const onInitModule = useAsync
    ? "sap/ushell/sandbox/launchpadBootstrap"
    : "module:sap/ushell/shells/sandbox/fioriSandboxInit";

  const resourceRoots = {
    "sap.ushell.shells.sandbox": "./"
  };

  const rtaLib = input.enableRta ? ", sap.ui.rta" : "";
  const html = `<!DOCTYPE html>
<html class="sapUShellFullHeight">
<head>
    <meta charset="utf-8" />
    <title>${escapeHtml(input.title ?? "Fiori Launchpad")}</title>
    <script id="sap-ushell-bootstrap" src="${bootstrapSrc}"></script>
    <script>${initialConfig}</script>
    <script>${appsConfig}</script>
    <script id="sap-ui-bootstrap"
            src="/resources/sap-ui-core.js"
            data-sap-ui-compatVersion="${escapeHtml(compatVersion)}"
            data-sap-ui-theme="${escapeHtml(theme)}"
${language ? `            data-sap-ui-language="${escapeHtml(language)}"\n` : ""}            data-sap-ui-libs="${escapeHtml(libs)}${rtaLib}"
            data-sap-ui-async="true"
            data-sap-ui-oninit="${escapeHtml(onInitModule)}"
            data-sap-ui-resourceroots='${JSON.stringify(resourceRoots)}'></script>
    ${input.headInjection ?? ""}
</head>
<body class="sapUiBody sapUShellFullHeight">
    <div id="canvas" class="sapUShellFullHeight"></div>
    ${input.bodyInjection ?? ""}
</body>
</html>
`;

  const script = appsConfig;
  return { html, script, appsConfig, initialConfig };
}