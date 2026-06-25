---
name: ui5-flp-bootstrap
description: |
  Reference knowledge about the SAP Fiori Launchpad sandbox bootstrap
  sequence, including the legacy (pre-1.136) and the async (>=1.136)
  rendering paths. Load this skill when implementing or debugging
  ui5Launchpad, generating FLP HTML, or wiring custom apps into
  sap-ushell-config.
---

# SAP Fiori Launchpad Bootstrap

This skill captures the exact HTML emitted by the official SAP Fiori
Launchpad sandbox (`https://ui5.sap.com/test-resources/sap/ushell/shells/sandbox/fioriSandbox.html`)
and what the modern async path replaces it with.

## Ground-truth template (legacy, < 1.136)

```html
<script src="fioriSandboxInitialConfig.js"></script>
<script src="sandboxApplicationsConfig.js"></script>
<script id="sap-ushell-bootstrap" src="../../bootstrap/sandbox.js"></script>
<script id="sap-ui-bootstrap"
        src="../../../../../resources/sap-ui-core.js"
        data-sap-ui-compatVersion="edge"
        data-sap-ui-theme="sap_horizon"
        data-sap-ui-libs="sap.m"
        data-sap-ui-async="true"
        data-sap-ui-oninit="module:sap/ushell/shells/sandbox/fioriSandboxInit"
        data-sap-ui-resourceroots='{ "sap.ushell.shells.sandbox": "./" }'></script>
```

## Modern async template (>= 1.136)

```html
<script id="sap-ushell-bootstrap" src="/resources/sap/ushell/bootstrap/sandbox.js"></script>
<script>
  // initialConfig + appsConfig injected here
</script>
<script id="sap-ui-bootstrap"
        src="/resources/sap-ui-core.js"
        data-sap-ui-async="true"
        data-sap-ui-oninit="module:sap/ushell/sandbox/launchpadBootstrap"
        data-sap-ui-theme="sap_horizon"
        data-sap-ui-libs="sap.m, sap.ushell"></script>
```

The async path skips the legacy `fioriSandboxInit` module and the
`fioriSandboxInitialConfig.js` / `sandboxApplicationsConfig.js` files; all
configuration is embedded directly into the page.

## sap-ushell-config shape

`window["sap-ushell-config"]` is the global configuration object that the
ushell bootstrap reads. It has three top-level sections relevant to us:

```ts
{
  defaultRenderer: "fiori2",
  renderers: {
    fiori2: {
      componentData: {
        config: {
          enableSearch: false,
          enableUserDefaultParameters: true,
          rootIntent: "Shell-home"
        }
      }
    }
  },
  services: {
    NavTargetResolution: { config: { allowTestUrlComponentConfig: true, enableClientSideTargetResolution: true } }
  },
  applications: {
    "MyApp-preview": {
      title: "My App",
      applicationType: "SAPUI5.Component",
      additionalInformation: "SAPUI5.Component=ns.MyApp",
      url: "/webapp"
    }
  }
}
```

Applications are keyed by `<semanticObject>-<action>` (the intent).

## App descriptor mapping

| UI5 launchpad concept | `applications.<intent>` key |
| --- | --- |
| Tile intent `Shell-home` | `applications["Shell-home"]` (rare; usually built-in) |
| Tile `Sales-Display` | `applications["Sales-Display"]` |
| App descriptor | `additionalInformation: "SAPUI5.Component=<componentId>"` for components, or `applicationType: "URL"` + `url: "<absoluteOrAppRelativeUrl>"` for plain URLs. |

## Adding apps to the local launchpad

The `@ui5/vite-plugin-ui5-launchpad` plugin's `apps` option builds the
`sap-ushell-config.applications` map for you. Each entry produces an intent
key `<semanticObject>-<action>` and an entry with the correct
`applicationType` and `additionalInformation`.

## Performance note

Per the cds-launchpad blog (Dec 2023), the async path renders the
launchpad in ~2.2s vs ~9.5s for the legacy renderer on a typical app.

## Common pitfalls

- **Forgetting `data-sap-ui-async="true"`** — the bootstrap will block the
  UI thread and you will not get the speedup.
- **Putting `data-sap-ui-oninit` after `src`** — order matters: the `src`
  attribute is the script tag, attributes configure the loader. Always
  set them on the same `<script>` element.
- **Wrong `data-sap-ui-libs`** — must include `sap.ushell` for the shell
  to function, plus `sap.m` for the standard control set. Add
  `sap.ui.rta` only when RTA is requested.