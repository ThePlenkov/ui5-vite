# examples/launchpad

Runnable demo that wires `@ui5/vite-plugin-ui5` and
`@ui5/vite-plugin-ui5-launchpad` into a Vite dev server.

## Run

```bash
npm install            # at the repo root
npm run build          # builds the plugin packages
npm run dev -w examples/launchpad
# → http://localhost:8080
```

## What's here

```
.
├── ui5.yaml           # UI5 CLI project descriptor
├── vite.config.ts     # wires both plugins
├── webapp/
│   └── sample-app/    # a minimal UI5 app with manifest + view + controller
└── project.json       # Nx targets
```

The launchpad renders a single tile ("Hello World") that navigates into
`webapp/sample-app/`, which is a regular UI5 XML view driven by
`Hello.controller.js`.

## Trying things

- Edit `webapp/sample-app/view/Hello.view.xml` and the page updates
  immediately (Vite HMR).
- Add more apps to the `apps:` array in `vite.config.ts` to see new
  tiles in the launchpad.
- Change the framework version in `ui5.yaml` to switch between the
  legacy and async bootstrap paths.