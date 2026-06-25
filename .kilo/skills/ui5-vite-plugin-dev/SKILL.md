---
name: ui5-vite-plugin-dev
description: |
  Workflow for AI agents adding or extending @ui5/vite-* plugins in this
  monorepo. Covers how to read ui5.yaml, register a Vite plugin, serve
  /resources and /test-resources from the UI5 CDN, and generate the local
  Fiori Launchpad sandbox HTML. Use when the user asks to add a new UI5
  feature to the Vite plugin family, fix resource resolution issues, or
  align the launchpad plugin with newer UI5 versions.
---

# UI5 Vite Plugin Development

This skill describes the **conventions and gotchas** of this monorepo.
Follow it step-by-step when an AI agent is asked to change the
`@ui5/vite-plugin-ui5*` packages.

## 1. Understand the boundary

Two packages cooperate:

| Package | Owns |
| --- | --- |
| `packages/vite-plugin-ui5` | `ui5.yaml` parsing, framework URL resolution, `/resources/*` and `/test-resources/*` middlewares, theme `.less` compilation, manifest enrichment. |
| `packages/vite-plugin-ui5-launchpad` | Rendering of the local Fiori Launchpad sandbox HTML, `sap-ushell-config` initial + apps config, async vs legacy bootstrap detection. |

The launchpad plugin **must** consume the base plugin's exports
(`loadUi5Config`, `getLogger`, types) — never re-implement them.

## 2. Read ui5.yaml correctly

`packages/vite-plugin-ui5/src/ui5-config.ts` is the only parser. It returns
a `ResolvedUi5Project` with:

- `name`, `type` (`application` | `library` | `module` | `theme-library`)
- `kind` (`project` | `extension`)
- `framework.name` (`OpenUI5` | `SAPUI5`) and `framework.version`
- `resources`: a `Record<virtualPath, physicalPath>` map. **Keys are
  POSIX-normalized** (always start with `/`).

If you need a new field, extend the parser and `ResolvedUi5Project`
together — never read `ui5.yaml` ad-hoc inside a consumer.

## 3. CDN URL construction

`resolveFramework(project)` in `framework.ts` builds a CDN URL of the form
`<base>/<version>`. Default base is `https://ui5.sap.com` for both
OpenUI5 and SAPUI5 (it is the **only** CDN that serves `/test-resources/*`).

When you fetch a framework resource, **always** include the bucket:

```ts
const url = `${info.cdnUrl}/${kind}/${remainder}`;   // kind: "resources" | "test-resources"
```

Forgetting the bucket (e.g. emitting `…/1.136.0/sap-ui-core.js`) is the
#1 source of 404s in this codebase.

## 4. Vite plugin shape

Every plugin in this monorepo follows the same shape:

```ts
export function ui5Foo(options: Ui5FooOptions = {}): Plugin {
  const log = getLogger({ level: options.verbose ? "verbose" : "info" });
  return {
    name: "ui5-foo",
    configureServer(server) {
      // Register BEFORE Vite installs its own middlewares so we win the race.
      server.middlewares.use(async (req, res, next) => {
        if (!matches(req.url)) return next();
        try {
          if (await handle(req, res)) return; // handled
          next();
        } catch (err) {
          log.error(`ui5-foo middleware error: ${(err as Error).message}`);
          next(err);
        }
      });
    },
    configurePreviewServer(server) { /* same as dev */ }
  };
}
```

Rules of thumb:

- **Never** call `next()` after you started writing a response. End the
  response and `return`.
- Use `decodeURIComponent(req.url.split("?")[0])` to get the pathname.
- The middleware should be **fast-fail**: if the URL doesn't match your
  pattern, call `next()` immediately and synchronously.
- All network IO must happen inside `configureServer` /
  `configurePreviewServer`. Tests must not hit the network — see rule 6 of
  `AGENTS.md`.

## 5. Launchpad HTML template

The `renderLaunchpadHtml` function in
`packages/vite-plugin-ui5-launchpad/src/templates.ts` produces the full
Fiori Launchpad sandbox HTML. Two things to keep in mind:

1. **Bootstrap order matters.** The `sap-ushell-bootstrap` script MUST be
   parsed before the `sap-ui-bootstrap` script so that `window["sap-ushell-config"]`
   is in place when the UI5 runtime reads it.
2. **Async vs legacy** is controlled by the framework version
   (>= 1.136 → `sap/ushell/sandbox/launchpadBootstrap` oninit). The plugin
   auto-detects this when `options.async === "auto"` (the default).
3. **Always escape user-provided values** (title, headInjection, bodyInjection).
   The template helper already calls `escapeHtml` on the bootstrap attributes.

## 6. Adding a new option

1. Add it to the `Options` interface in `src/types.ts`.
2. Wire it into the plugin function.
3. If it changes rendered output, add a test in `test/*.test.ts`.
4. Update the package `README.md` and the relevant section of the
   top-level `README.md`.

## 7. Common tasks

### Bump the default UI5 version in the example
`examples/launchpad/ui5.yaml` → `framework.version`. Choose a version that
is currently served by `https://ui5.sap.com/<version>/...` (newer is
better; check that `/test-resources/sap/ushell/bootstrap/sandbox.js` is
200).

### Add a new tile
In `examples/launchpad/vite.config.ts`, add an entry to the `apps:`
array of `ui5Launchpad(...)`. Restart the dev server; the new tile
appears in the FLP home page.

### Serve a custom UI5 framework installation
Set `useLocalFramework: true` and `localFrameworkPath: "/path/to/openui5"`
in the `ui5Resources(...)` options. The plugin will check that path
before falling back to the CDN.

### Add a new middleware
Place it in `packages/vite-plugin-ui5/src/<name>.ts`, export from
`index.ts`, and add a test. Mirror the `configureServer` /
`configurePreviewServer` shape from `resources.ts`.

## 8. When you finish

Run, in this order:

```bash
npm run typecheck          # nx run-many -t typecheck
npm run test               # node --test --import tsx test/**/*.test.ts
npm run build              # tsup produces dist/
npm run dev -w examples/launchpad &
curl -fsSL http://localhost:8080/ | head
pkill -f vite
```

If any of these fail, fix the cause — do **not** silence the failing
command (no `--legacy-peer-deps`, no `// @ts-ignore`, no `.skip()` in tests).

## 9. Pitfalls to avoid

- **Don't re-implement the UI5 server.** This plugin family is a
  minimal, dev-time preview layer. Heavy features (RTA, ADAPT, full
  manifest builds) belong in `@ui5/cli` + `@sap/ux-ui5-tooling`.
- **Don't introduce client-side bundling** of UI5 sources. The dev
  experience is "ship script tags from the CDN" — that is the whole
  point of the plugin.
- **Don't add a `node_modules` linker.** `useLocalFramework` is a
  debug feature, not a build feature.
- **Don't forget to escape HTML in templates.** The launchpad plugin
  has `escapeHtml` — use it.