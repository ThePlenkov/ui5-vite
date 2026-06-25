import { defineConfig } from "vite";
import { ui5Resources } from "@ui5/vite-plugin-ui5";
import { ui5Launchpad } from "@ui5/vite-plugin-ui5-launchpad";

export default defineConfig({
  plugins: [
    ui5Resources({
      configPath: "./ui5.yaml",
      theme: "sap_horizon"
    }),
    ui5Launchpad({
      configPath: "./ui5.yaml",
      theme: "sap_horizon",
      libs: "sap.m, sap.ushell",
      enableSearch: true,
      groups: [
        {
          id: "samples",
          title: "Sample Apps",
          tiles: [
            { semanticObject: "Sample", action: "hello", title: "Hello World", icon: "sap-icon://hello-world" }
          ]
        }
      ],
      apps: [
        {
          semanticObject: "Sample",
          action: "hello",
          title: "Hello World",
          description: "A minimal UI5 app",
          component: "ns.sample.App",
          icon: "sap-icon://hello-world"
        }
      ]
    })
  ],
  server: {
    port: 8080
  }
});