# @ui5/vite-plugin-ui5

Base Vite plugin for the `@ui5/vite-*` family. Reads your project's
`ui5.yaml`, resolves UI5 framework resources from the public CDN, and
serves your project's own webapp (or `src/`) using the path mappings
declared in `ui5.yaml`.

## Install

```bash
npm install -D @ui5/vite-plugin-ui5
```

## Usage

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { ui5Resources } from "@ui5/vite-plugin-ui5";

export default defineConfig({
  plugins: [
    ui5Resources({
      configPath: "./ui5.yaml",
      // Optional: override the CDN base URL.
      // frameworkUrl: "https://sdk.openui5.org",
      // Optional: use a local UI5 framework install before falling back to the CDN.
      // useLocalFramework: true,
      // localFrameworkPath: "/path/to/openui5-sdk",
    })
  ]
});
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `configPath` | `string` | `"ui5.yaml"` | Path to the project's `ui5.yaml`. |
| `frameworkUrl` | `string` | `https://ui5.sap.com` | Base URL of the UI5 distribution. |
| `useLocalFramework` | `boolean` | `false` | Resolve `/resources/*` from a local install before the CDN. |
| `localFrameworkPath` | `string` | `""` | Filesystem path to the local UI5 framework root. |
| `theme` | `string` | `"sap_horizon"` | Default UI5 theme (informational, used by other plugins). |
| `pathMappings` | `Record<string, string>` | `{}` | Additional virtual → physical path mappings, merged with `ui5.yaml`. |
| `verbose` | `boolean` | `false` | Enable verbose logging. |

## What it serves

| URL prefix | Resolved via |
| --- | --- |
| `/resources/*` | (1) project webapp → (2) local framework install → (3) public CDN. |
| `/test-resources/*` | (1) project webapp → (3) public CDN. |
| Anything else (e.g. `/webapp/manifest.json`) | (1) project webapp. |

The public CDN URL is constructed as
`<frameworkUrl>/<framework.version>/<resources|test-resources>/<path>`,
so the example's `ui5.yaml` with `framework.version: 1.136.0` ends up
hitting `https://ui5.sap.com/1.136.0/resources/sap-ui-core.js`.

## License

Apache-2.0.