export interface LaunchpadApp {
  /** Semantic object name. */
  semanticObject: string;
  /** Action name. */
  action: string;
  /** Human readable title (used for tile label fallback). */
  title?: string;
  /** Subtitle / description. */
  description?: string;
  /** Application component id, e.g. "ns.MyApp". */
  component?: string;
  /** Absolute or relative URL when applicationType is "URL". */
  url?: string;
  /** Application type: "SAPUI5.Component" or "URL". */
  applicationType?: "SAPUI5.Component" | "URL";
  /** Icon URL or icon font reference. */
  icon?: string;
  /** Number of tiles per row when rendered in the launchpad. */
  tileSize?: number;
  /** Additional UI5 ushell properties merged into the applications map entry. */
  additionalInformation?: string;
  /** Application-specific keywords for search. */
  keywords?: string[];
  /** Custom additional properties merged at the application level. */
  [key: string]: unknown;
}

export interface LaunchpadGroup {
  /** Group id (used in tile intent "Group-<id>"). */
  id: string;
  /** Title shown in the launchpad tile catalog. */
  title: string;
  /** Tiles (by semantic object + action). */
  tiles: Array<{ semanticObject: string; action: string; title?: string; icon?: string }>;
}

export interface LaunchpadPluginOptions {
  /** Mount path of the launchpad. Defaults to "/". */
  path?: string;
  /** HTML entry point relative to the mount path. Defaults to "index.html". */
  entry?: string;
  /** Path to the project's ui5.yaml. Defaults to "./ui5.yaml". */
  configPath?: string;
  /** Override the CDN base URL for the UI5 framework. */
  frameworkUrl?: string;
  /** Use the asynchronous ushell sandbox (UI5 >= 1.136). Defaults to "auto". */
  async?: boolean | "auto";
  /** UI5 theme. Defaults to "sap_horizon". */
  theme?: string;
  /** Library list to bootstrap. Defaults to ["sap.m", "sap.ushell"]. */
  libs?: string;
  /** UI5 compatibility version (e.g. "edge", "1.120"). */
  compatVersion?: string;
  /** Language, e.g. "en". Defaults to undefined (browser default). */
  language?: string;
  /** Default renderer. Defaults to "fiori2". */
  renderer?: string;
  /** Tile groups rendered on the home page. */
  groups?: LaunchpadGroup[];
  /** Additional application descriptors to expose to the launchpad. */
  apps?: LaunchpadApp[];
  /** Whether to enable search in the shell header. Defaults to false. */
  enableSearch?: boolean;
  /** Enable RTA support (loads `sap.ui.rta`). Defaults to false. */
  enableRta?: boolean;
  /** Initial intent to navigate to (e.g. { semanticObject: "Shell", action: "home" }). */
  initialIntent?: { semanticObject: string; action: string };
  /** Custom HTML injected just before </head> (advanced). */
  headInjection?: string;
  /** Custom HTML injected just before </body> (advanced). */
  bodyInjection?: string;

  /** Browser <title> for the launchpad HTML. Defaults to "Fiori Launchpad". */
  title?: string;

  /** Verbose logging. */
  verbose?: boolean;
}

export interface RenderedLaunchpad {
  html: string;
  script: string;
  appsConfig: string;
  initialConfig: string;
}