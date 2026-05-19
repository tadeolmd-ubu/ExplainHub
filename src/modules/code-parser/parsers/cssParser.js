
export function parseCss(content) {
  const classes = [...content.matchAll(/\.([a-zA-Z0-9_-]+)\s*\{/g)].map(
    (m) => m[1],
  );
  const variables = [...content.matchAll(/--([a-zA-Z0-9_-]+)\s*:/g)].map(
    (m) => m[1],
  );
  const imports = [...content.matchAll(/@import\s+["']([^"']*)["']/g)].map(
    (m) => ({ type: "css", source: m[1] }),
  );
  const animations = [
    ...content.matchAll(/@keyframes\s+([a-zA-Z0-9_-]+)/g),
  ].map((m) => m[1]);
  return {
    imports,
    exports: [...classes, ...animations].map((name) => ({
      name,
      kind: "class",
    })),
    functions: variables.map((v) => ({ name: v, kind: "css-variable" })),
    classes: [],
    routes: [],
  };
}
