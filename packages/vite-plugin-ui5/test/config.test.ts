import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadUi5Config, resolveVirtualPath } from "../src/ui5-config.js";

function makeProject(name: string, yaml: string): string {
  const dir = mkdtempSync(join(tmpdir(), "ui5-vite-test-"));
  writeFileSync(join(dir, "ui5.yaml"), yaml);
  return dir;
}

test("loadUi5Config parses application project", () => {
  const dir = makeProject("app", [
    'specVersion: "4.0"',
    "type: application",
    "metadata:",
    "  name: ns.app",
    "framework:",
    "  name: OpenUI5",
    "  version: 1.120.0",
    "  libraries:",
    "    - name: sap.ui.core",
    "    - name: sap.m"
  ].join("\n"));

  const cfg = loadUi5Config(join(dir, "ui5.yaml"));
  assert.equal(cfg.name, "ns.app");
  assert.equal(cfg.type, "application");
  assert.equal(cfg.framework.name, "OpenUI5");
  assert.equal(cfg.framework.version, "1.120.0");
  assert.equal(cfg.framework.libraries.length, 2);
  assert.equal(cfg.resources["/"], "webapp");
});

test("loadUi5Config parses library project", () => {
  const dir = makeProject("lib", [
    'specVersion: "4.0"',
    "type: library",
    "metadata:",
    "  name: ns.lib"
  ].join("\n"));

  const cfg = loadUi5Config(join(dir, "ui5.yaml"));
  assert.equal(cfg.type, "library");
  assert.equal(cfg.resources["/resources"], "src");
  assert.equal(cfg.resources["/test-resources"], "test");
});

test("loadUi5Config respects custom path mapping", () => {
  const dir = makeProject("custom", [
    'specVersion: "4.0"',
    "type: application",
    "metadata:",
    "  name: ns.custom",
    "resources:",
    "  configuration:",
    "    paths:",
    "      webapp: dist/app"
  ].join("\n"));

  const cfg = loadUi5Config(join(dir, "ui5.yaml"));
  assert.equal(cfg.resources["/"], "dist/app");
});

test("resolveVirtualPath matches application webapp", () => {
  const dir = makeProject("app2", [
    'specVersion: "4.0"',
    "type: application",
    "metadata:",
    "  name: ns.app2"
  ].join("\n"));
  const cfg = loadUi5Config(join(dir, "ui5.yaml"));
  const res = resolveVirtualPath(cfg, "/Component.js");
  assert.ok(res);
  assert.equal(res.virtualPath, "/");
});

test("loadUi5Config throws when file is missing", () => {
  assert.throws(() => loadUi5Config("/tmp/does-not-exist-ui5.yaml"));
});

test("loadUi5Config throws when metadata.name is missing", () => {
  const dir = makeProject("noname", 'specVersion: "4.0"\ntype: application\n');
  assert.throws(() => loadUi5Config(join(dir, "ui5.yaml")));
});