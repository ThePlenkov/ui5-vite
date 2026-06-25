import { test } from "node:test";
import assert from "node:assert/strict";
import { renderApplicationsConfig, renderInitialConfig } from "../src/apps.js";

test("renderInitialConfig emits fiori2 renderer and search settings", () => {
  const out = renderInitialConfig({ enableSearch: true });
  assert.match(out, /defaultRenderer/);
  assert.match(out, /"fiori2"/);
  assert.match(out, /"enableSearch":\s*true/);
  assert.match(out, /NavTargetResolution/);
});

test("renderApplicationsConfig creates intents for each app", () => {
  const out = renderApplicationsConfig([
    { semanticObject: "Sample", action: "hello", component: "ns.sample.App", title: "Hi" },
    { semanticObject: "Other", action: "x", applicationType: "URL", url: "/x.html" }
  ]);
  assert.match(out, /Sample-hello/);
  assert.match(out, /Other-x/);
  assert.match(out, /SAPUI5\.Component=ns\.sample\.App/);
  assert.match(out, /applicationType": "URL"/);
  assert.match(out, /url": "\/x\.html"/);
});

test("renderApplicationsConfig handles empty input gracefully", () => {
  const out = renderApplicationsConfig([]);
  assert.match(out, /sap-ushell-config/);
  assert.match(out, /applications/);
});