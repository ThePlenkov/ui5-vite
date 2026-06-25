# AGENTS.md

> AI-first guidance for agents working on the **`@ui5/vite-*`** monorepo.
> If you are an autonomous coding agent (Kilo, Copilot, Cursor, Devin, ...),
> **read this file before doing anything**.

## Mission

Provide first-class [Vite](https://vitejs.dev/) plugins for the UI5 / SAP Fiori
ecosystem so that developers can build and preview Fiori applications
(launchpads, components, freestyle UI5 apps) with the same DX they get from any
modern JS framework.

The monorepo currently ships:

| Package | Purpose |
| --- | --- |
| `@ui5/vite-plugin-ui5` | Base plugin: reads `ui5.yaml`, serves `/resources/*` & `/test-resources/*` from a chosen CDN, resolves project files via the configured path mappings. |
| `@ui5/vite-plugin-ui5-launchpad` | Generates the local **Fiori Launchpad sandbox** HTML at runtime and wires it up with `sap-ushell-config`. |
| `examples/launchpad` | Runnable demo that wires both plugins into a Vite dev server. |

## Quickstart for an AI agent

```bash
# 1. Install (workspace includes packages/* and examples/*).
npm install

# 2. Build the libraries once (their `dist/` is what the example consumes).
npm run build

# 3. Run the example launchpad.
npm run dev -w examples/launchpad
# → http://localhost:8080

# 4. Sanity-check everything (build + typecheck + tests).
npm run build && npm run typecheck && npm run test
```

## Repository layout

```
.
├── AGENTS.md                ← you are here
├── CHANGELOG.md
├── nx.json
├── package.json             ← root, npm workspaces
├── tsconfig.base.json
├── packages/
│   ├── vite-plugin-ui5/
│   │   ├── src/             ← sources (ESM TypeScript)
│   │   ├── test/            ← node:test + tsx
│   │   ├── dist/            ← built artefacts (tsup, ESM only)
│   │   ├── project.json     ← Nx target definitions
│   │   ├── package.json
│   │   └── tsconfig*.json
│   └── vite-plugin-ui5-launchpad/   (same layout)
├── examples/
│   └── launchpad/
│       ├── vite.config.ts
│       ├── ui5.yaml
│       ├── webapp/...       ← sample UI5 application
│       └── project.json
└── .kilo/
    └── skills/
        └── ui5-vite-plugin-dev/SKILL.md  ← AI agent skill
```

## Architectural rules (do not violate)

1. **No hardcoded UI5 framework version.** Always read it from `ui5.yaml`.
   Override via the `frameworkUrl` option only when the user explicitly asks.
2. **Default framework CDN is `https://ui5.sap.com`** for both `OpenUI5` and
   `SAPUI5` because it is the only source that serves `/test-resources/*`.
   Override per-project when the user wants the leaner OpenUI5 SDK.
3. **`ui5.yaml` is the single source of truth.** Never invent a parallel
   config file; the plugins must work with a stock UI5 CLI project so the
   `ui5 serve` path remains a valid fallback.
4. **Library code targets Node 20+ ESM only.** Do not add CommonJS shims.
   Vite plugins must be imported as ESM.
5. **Keep `src/` framework-agnostic.** The launchpad plugin depends on the base
   plugin and on `vite` only.
6. **No silent network access in tests.** Framework fetches happen only in
   `configureServer` / `configurePreviewServer` (i.e. at runtime, never in
   unit tests).
7. **Log via `@ui5/logger`.** Use the singleton exported from the base plugin
   (`getLogger()`) so the CLI tooling shows a unified prefix `ui5-vite`.

## How the launchpad HTML is built

The launchpad plugin mirrors the official
[`fioriSandbox.html`](https://ui5.sap.com/test-resources/sap/ushell/shells/sandbox/fioriSandbox.html):

```html
<script id="sap-ushell-bootstrap" src="/resources/sap/ushell/bootstrap/sandbox.js"></script>
<script>/* initialConfig + appsConfig injected here */</script>
<script id="sap-ui-bootstrap"
        src="/resources/sap-ui-core.js"
        data-sap-ui-async="true"
        data-sap-ui-oninit="module:sap/ushell/sandbox/launchpadBootstrap"  <!-- for >= 1.136 -->
        data-sap-ui-oninit="module:sap/ushell/shells/sandbox/fioriSandboxInit"  <!-- for older versions -->
        data-sap-ui-theme="sap_horizon"
        data-sap-ui-libs="sap.m, sap.ushell"></script>
```

The async path (default for `>= 1.136`) uses `sap/ushell/sandbox/launchpadBootstrap`
and is the recommended approach per the [cds-launchpad blog](https://community.sap.com/t5/technology-blog-posts-by-members/cds-launchpad-plugin-supercharged-ready-for-the-future-cap-plugin-ui5/ba-p/13578282):
9.5s → 2.2s boot time improvement over the legacy renderer.

## Adding a new plugin package

1. `mkdir -p packages/vite-plugin-ui5-<feature>`
2. Copy `package.json` / `tsconfig.json` / `tsconfig.test.json` / `tsup.config.ts`
   / `project.json` from `vite-plugin-ui5-launchpad` and rename.
3. Add the package to `tsup.config.ts` entries if you need split chunks.
4. Add `nx` targets (`project.json`) — keep them thin, they wrap `npm run`.
5. Register the package in the root `package.json` `workspaces` (already
   covered by `packages/*`).
6. Document the new package in this file and in the top-level `README.md`.

## Adding a new example

1. `mkdir -p examples/<name>/webapp`
2. Create `examples/<name>/package.json` (private, depends on the plugins).
3. Create `examples/<name>/vite.config.ts` that imports the plugins.
4. Create `examples/<name>/ui5.yaml` (real UI5 CLI project).
5. Create `examples/<name>/project.json` with `serve` and `build` targets.

## Testing strategy

- Unit tests use the built-in `node:test` runner + `tsx`.
  Run with `npm run test -w <package>`.
- Integration check: `npm run dev -w examples/launchpad` then
  `curl http://localhost:8080/`, `curl http://localhost:8080/resources/sap-ui-version.json`.

## Reference reading list

- UI5 CLI v4 docs — <https://ui5.github.io/cli/v4/>
- Local SAP Fiori Launchpad sandbox — <https://help.sap.com/saphelp_em92/helpdata/en/89/6efc419d994463a7c148b6904760a8/content.htm>
- Async UI5 loading — <https://ui5.github.io/docs/03_Get-Started/use-asynchronous-loading-676b636.html>
- `@sap-ux/preview-middleware` (what we are conceptually re-implementing on Vite)
  — <https://www.npmjs.com/package/@sap-ux/preview-middleware>

## When in doubt

- Read `.kilo/skills/ui5-vite-plugin-dev/SKILL.md`.
- Look at how `examples/launchpad` wires the plugins.
- Check the official SAP Fiori Launchpad sandbox HTML for ground truth on the
  bootstrap sequence.