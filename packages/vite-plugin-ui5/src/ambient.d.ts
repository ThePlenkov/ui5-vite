declare module "@ui5/logger" {
  export interface Logger {
    silly(...args: unknown[]): void;
    verbose(...args: unknown[]): void;
    info(...args: unknown[]): void;
    warn(...args: unknown[]): void;
    error(...args: unknown[]): void;
    isSillyEnabled(): boolean;
    isVerboseEnabled(): boolean;
    setLevel?(level: number): void;
  }
  export function getLogger(moduleName?: string): Logger;
  export function setLogLevel(levelName: string): void;
  export function getLogLevel(): string;
  export function isLogLevelEnabled(levelName: string): boolean;
}

declare module "less" {
  export interface LessOptions {
    filename?: string;
    math?: "always" | "strict" | "parens-division" | "parens" | "always-nested";
    rewriteUrls?: "off" | "all";
    [key: string]: unknown;
  }
  export interface RenderOutput {
    css: string;
    map?: string;
    imports?: string[];
  }
  export interface LessStatic {
    render(source: string, options?: LessOptions): Promise<RenderOutput>;
  }
  const less: LessStatic;
  export default less;
}