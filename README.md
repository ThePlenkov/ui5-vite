# @ui5/vite-monorepo

> First-class Vite plugins for the UI5 / SAP Fiori ecosystem. Serve
> `/resources/*` and `/test-resources/*` from the UI5 CDN, render a local
> Fiori Launchpad sandbox, and keep your existing `ui5.yaml` as the single
> source of truth — all on top of [Vite](https://vitejs.dev/).

## Why

The official UI5 CLI (`@ui5/cli` / formerly `@ui5/tooling`) is great for
`ui5 serve` and `ui5 build`, but it predates Vite and doesn't give you HMR,
ESM, or the modern plugin ecosystem. This monorepo provides a thin set of
Vite plugins that:

1. **Read your existing `ui5.yaml`** — no parallel config, the
   `ui5 serve` path remains a valid fallback.
2. **Proxy `/resources/*` and `/test-resources/*` to the UI5 CDN**
   (`https://ui5.sap.com/<version>/...`) so the dev server works with zero
   local framework installation.
3. **Render a virtual Fiori Launchpad sandbox** at any mount path, with
   support for both the legacy (`< 1.136`) and the async (`>= 1.136`)
   bootstrap paths.
4. **Serve the project's own webapp** (or `src/` for libraries) using the
   path mappings declared in `ui5.yaml`.

## Packages

| Package | Description |
| --- | --- |
| [`@ui5/vite-plugin-ui5`](./packages/vite-plugin-ui5) | Base plugin. `ui5.yaml` parser + middleware for `/resources/*` and `/test-resources/*`. |
| [`@ui5/vite-plugin-ui5-launchpad`](./packages/vite-plugin-ui5-launchpad) | Virtual Fiori Launchpad sandbox HTML. |
| [`examples/launchpad`](./examples/launchpad) | Runnable end-to-end example. |

## Quickstart

```bash
npm install
npm run build
npm run dev -w examples/launchpad
# → http://localhost:8080
```

## Usage in a real UI5 project

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
        { semanticObject: "MyApp", action: "preview", component: "ns.MyApp" }
      ]
    })
  ]
});
```

`ui5.yaml`:

```yaml
specVersion: "4.0"
type: application
metadata:
  name: ns.myapp
framework:
  name: OpenUI5
  version: 1.136.0
  libraries:
    - name: sap.ui.core
    - name: sap.m
    - name: sap.ushell
```

That's it. Open <http://localhost:8080/> and you get a working Fiori
Launchpad with a tile that navigates into your app.

## Commands

| Command | Effect |
| --- | --- |
| `npm run build` | Build all packages and the example. |
| `npm run typecheck` | TypeScript check across the monorepo. |
| `npm run test` | Run `node:test` unit tests. |
| `npm run dev -w examples/launchpad` | Start the example dev server. |
| `nx <target> <project>` | Run a target on a single project. |

## Documentation for AI agents

- [`AGENTS.md`](./AGENTS.md) — top-level orientation, quickstart, and
  architectural rules.
- [`.kilo/skills/ui5-vite-plugin-dev/SKILL.md`](./.kilo/skills/ui5-vite-plugin-dev/SKILL.md) —
  how to extend the plugins.
- [`.kilo/skills/ui5-flp-bootstrap/SKILL.md`](./.kilo/skills/ui5-flp-bootstrap/SKILL.md) —
  reference for the Fiori Launchpad bootstrap sequence.

## Roadmap

- [ ] TypeScript source transformation (ESM imports → `sap.ui.define`).
- [ ] Optional local `npm` install of the UI5 framework
      (currently CDN-only).
- [ ] UI5 CLI fallback integration via `@ui5/cli` programmatic API.
- [ ] Component preload generation hook.
- [ ] RTA (Runtime Adaptation) preview mode.

## License

Apache-2.0 © 2026 SAP SE and contributors.