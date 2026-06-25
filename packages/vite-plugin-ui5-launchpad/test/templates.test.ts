import { test } from "node:test";
import assert from "node:assert/strict";
import { renderLaunchpadHtml } from "../src/templates.js";

test("renderLaunchpadHtml emits an HTML5 document with ushell bootstrap", () => {
  const out = renderLaunchpadHtml({
    frameworkName: "OpenUI5",
    frameworkVersion: "1.120.0",
    useAsync: false,
    theme: "sap_horizon",
    apps: [{ semanticObject: "Sample", action: "hello", component: "ns.sample.App" }]
  });
  assert.match(out.html, /<!DOCTYPE html>/);
  assert.match(out.html, /sap-ui-core\.js/);
  assert.match(out.html, /data-sap-ui-async="true"/);
  assert.match(out.html, /data-sap-ui-theme="sap_horizon"/);
  assert.match(out.html, /Sample-hello/);
  assert.match(out.html, /sap-ushell-bootstrap/);
});

test("renderLaunchpadHtml respects custom mount paths and libs", () => {
  const out = renderLaunchpadHtml({
    frameworkName: "OpenUI5",
    frameworkVersion: "1.120.0",
    useAsync: true,
    libs: "sap.m, sap.ushell, sap.ui.rta",
    enableRta: true
  });
  assert.match(out.html, /sap\.ui\.rta/);
});

test("renderLaunchpadHtml escapes user-provided title to prevent HTML injection", () => {
  const out = renderLaunchpadHtml({
    frameworkName: "OpenUI5",
    frameworkVersion: "1.120.0",
    useAsync: false,
    title: '"><script>alert(1)</script>'
  });
  assert.doesNotMatch(out.html, /<script>alert/);
});