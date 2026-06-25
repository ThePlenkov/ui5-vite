/**
 * Compile a UI5 theme .less file to CSS, mirroring the on-the-fly
 * compilation performed by the UI5 CLI serveThemes middleware.
 *
 * The UI5 theme variables must already be imported by the caller; this
 * helper simply feeds the source to the LESS compiler with default
 * options that work for UI5's theme structure.
 */
export async function compileLess(
  filename: string,
  source: string,
  lessOptions: Record<string, unknown> = {}
): Promise<string> {
  const less = (await import("less")).default ?? (await import("less"));
  const result = await less.render(source, {
    filename,
    math: "always",
    rewriteUrls: "all",
    ...lessOptions
  });
  return result.css;
}