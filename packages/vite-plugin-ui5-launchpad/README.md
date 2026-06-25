# @ui5/vite-plugin-ui5-launchpad

Vite plugin that renders a local **SAP Fiori Launchpad sandbox** for
UI5 / SAPUI5 application development. Mirrors the official
[`fioriSandbox.html`](https://ui5.sap.com/test-resources/sap/ushell/shells/sandbox/fioriSandbox.html)
and supports both the legacy (`< 1.136`) and the async (`>= 1.136`)
bootstrap paths.

## Install

```bash
npm install -D @ui5/vite-plugin-ui5-launchpad @ui5/vite-plugin-ui5
```

## Usage

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { ui5Resources } from "@ui5/vite-plugin-ui5";
import { ui5Launchpad } from "@ui5/vite-plugin-ui5-launchpad";

export default defineConfig({
  plugins: [
    ui5Resources({ configPath: "./ui5.yaml" }),
    ui5Launchpad({
      configPath: "./ui5.yaml",
      apps: [
        {
          semanticObject: "MyApp",
          action: "preview",
          component: "ns.MyApp",
          title: "My App",
          icon: "sap-icon://document"
        }
      ]
    })
  ]
});
```

Open <http://localhost:8080/> and you get a full Fiori Launchpad with
tiles for every app you declared. Clicking a tile navigates to
`<app-component>/<intent>`.

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `path` | `string` | `"/"` | Mount path of the launchpad. |
| `entry` | `string` | `"index.html"` | Entry file relative to `path`. |
| `configPath` | `string` | `"ui5.yaml"` | Path to `ui5.yaml`. |
| `frameworkUrl` | `string` | _(from `ui5.yaml`)_ | Override CDN base. |
| `async` | `boolean \| "auto"` | `"auto"` | Use the async (`>= 1.136`) bootstrap. |
| `theme` | `string` | `"sap_horizon"` | UI5 theme. |
| `libs` | `string` | `"sap.m, sap.ushell"` | UI5 libs to bootstrap. |
| `compatVersion` | `string` | `"edge"` | UI5 compatVersion. |
| `language` | `string` | _undefined_ | Forced UI5 language. |
| `renderer` | `string` | `"fiori2"` | Default shell renderer. |
| `groups` | `LaunchpadGroup[]` | `[]` | Tile groups for the home page. |
| `apps` | `LaunchpadApp[]` | `[]` | App descriptors exposed to the launchpad. |
| `enableSearch` | `boolean` | `false` | Show the search bar in the shell header. |
| `enableRta` | `boolean` | `false` | Load `sap.ui.rta` for adaptation. |
| `initialIntent` | `{ semanticObject, action }` | _undefined_ | Intent to navigate to on boot. |
| `headInjection` | `string` | `""` | Extra HTML injected before `</head>`. |
| `bodyInjection` | `string` | `""` | Extra HTML injected before `</body>`. |

## App descriptor shape

```ts
interface LaunchpadApp {
  semanticObject: string;          // e.g. "Sales"
  action: string;                  // e.g. "Display"
  title?: string;                  // human-readable
  description?: string;
  component?: string;              // e.g. "ns.sales.app" — for SAPUI5.Component type
  url?: string;                    // for applicationType: "URL"
  applicationType?: "SAPUI5.Component" | "URL";
  icon?: string;                   // e.g. "sap-icon://document"
  keywords?: string[];             // for the shell search
  [extra: string]: unknown;        // any other ushell property
}
```

## License

Apache-2.0.