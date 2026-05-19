export function parseHtml(content) {
  const title = content.match(/<title>([^<]*)<\/title>/i);
  const scripts = [
    ...content.matchAll(/<script[^>]*src=["']([^"']*)["'][^>]*>/gi),
  ].map((m) => m[1]);
  const styles = [
    ...content.matchAll(/<link[^>]*href=["']([^"']*)["'][^>]*>/gi),
  ].map((m) => m[1]);
  return {
    imports: [...scripts, ...styles].map((s) => ({ type: "html", source: s })),
    exports: title ? [{ name: title[1], kind: "page-title" }] : [],
    functions: [],
    classes: [],
    routes: [],
  };
}
