import type { Ui5Logger } from "./logger.js";

export interface Ui5VitePluginOptions {
  /** Path to the project's ui5.yaml. Defaults to "./ui5.yaml". */
  configPath?: string;

  /** Override the CDN base URL for the UI5 framework. */
  frameworkUrl?: string;

  /** Inline UI5 framework resources from node_modules instead of using the CDN. */
  useLocalFramework?: boolean;

  /** Path to local UI5 framework root when useLocalFramework is true. */
  localFrameworkPath?: string;

  /** Default UI5 theme. Defaults to "sap_horizon". */
  theme?: string;

  /** Additional path mappings - merged with those from ui5.yaml. */
  pathMappings?: Record<string, string>;

  /** Enable verbose logging. */
  verbose?: boolean;
}

export interface Ui5ResourceRequest {
  /** URL pathname, e.g. "/resources/sap/m/Button.js". */
  pathname: string;
  /** The decoded physical path on disk. */
  physicalPath: string;
  /** The matched ui5.yaml project. */
  project: ResolvedUi5Project;
  /** True when served from node_modules / framework installation. */
  fromFramework: boolean;
}

export interface ResolvedUi5Project {
  name: string;
  type: "application" | "library" | "module" | "theme-library";
  kind: "project" | "extension";
  specVersion: string;
  rootPath: string;
  webappPath: string;
  resources: Record<string, string>;
  framework: {
    name: "OpenUI5" | "SAPUI5";
    version: string;
    libraries: Array<{ name: string; optional?: boolean; development?: boolean }>;
  };
}

export interface Ui5VitePluginContext {
  project: ResolvedUi5Project;
  frameworkUrl: string;
  theme: string;
  log: Ui5Logger;
}