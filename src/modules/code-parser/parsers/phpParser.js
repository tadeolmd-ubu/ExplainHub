import Engine from "php-parser";

export function parsePhp(content) {
  const parser = new Engine({
    parser: { extractDoc: false, locations: true },
    ast: { withPositions: true },
  });
  const ast = parser.parseCode(content);

  const imports = [];
  const functions = [];
  const classes = [];
  const routes = [];
  const exports = [];

  function walk(nodes) {
    for (const node of nodes) {
      if (node.kind === "usegroup") {
        for (const item of node.items) {
          imports.push({
            source: item.name,
            alias: item.alias,
            line: node.loc?.start?.line || null,
          });
        }
      }
      if (node.kind === "function") {
        functions.push({
          name: node.name.name,
          params: node.arguments?.map((a) => a.name?.name) || [],
          line: node.loc?.start?.line || null,
        });
        exports.push({
          name: node.name.name,
          kind: "function",
          line: node.loc?.start?.line || null,
        });
      }
      if (["class", "interface", "trait", "enum"].includes(node.kind)) {
        const methods = (node.body || [])
          .filter((m) => m.kind === "method")
          .map((m) => ({
            name: m.name?.name,
            visibility: m.visibility,
            params: m.arguments?.map((a) => a.name?.name) || [],
            line: m.loc?.start?.line || null,
          }));
        const constants = (node.body || [])
          .filter((m) => m.kind === "classconstant")
          .flatMap((cc) =>
            (cc.constants || []).map((c) => ({
              name: c.name?.name,
              value: c.value?.value,
              visibility: cc.visibility,
              line: c.loc?.start?.line || null,
            })),
          );
        classes.push({
          name: node.name?.name,
          kind: node.kind,
          extends: node.extends?.name || null,
          methods,
          constants,
          line: node.loc?.start?.line || null,
        });
        exports.push({
          name: node.name.name,
          kind: node.kind,
          line: node.loc?.start?.line || null,
        });
      }
      if (node.kind === "constantstatement") {
        for (const c of node.constants)
          exports.push({
            name: c.name.name,
            kind: "const",
            line: node.loc?.start?.line || null,
          });
      }
      if (
        node.kind === "expressionstatement" &&
        node.expression?.kind === "assign"
      ) {
        exports.push({
          name: node.expression.left.name,
          kind: "variable",
          line: node.loc?.start?.line || null,
        });
      }
      if (
        node.what?.kind === "staticlookup" &&
        node.what.what?.name === "Route" &&
        ["get", "post", "put", "patch", "delete", "options"].includes(
          node.what.offset?.name,
        )
      ) {
        routes.push({
          method: node.what.offset.name.toUpperCase(),
          path: node.arguments[0]?.value,
          line: node.loc?.start?.line || null,
        });
      }

      const attrRoutes = extractAttrRoutes(node);
      routes.push(...attrRoutes);

      if (node.children) walk(node.children);
      if (node.expression) walk([node.expression]);
      if (Array.isArray(node.body)) walk(node.body);
      if (node.body?.children) walk(node.body.children);
    }
  }

  walk(ast.children);

  return { imports, functions, classes, routes, exports };
}

const HTTP_METHODS = new Set([
  "get", "post", "put", "patch", "delete", "options",
  "head", "trace", "connect",
]);

function extractAttrRoutes(node) {
  const routes = [];
  const attrGroups = node.attrGroups || [];
  for (const group of attrGroups) {
    for (const attr of group.attrs || []) {
      const name = attr.name || "";
      const args = attr.args || [];
      const path = args[0]?.value;

      const methodFromName = name.toLowerCase();
      if (HTTP_METHODS.has(methodFromName)) {
        routes.push({
          method: methodFromName.toUpperCase(),
          path,
          line: node.loc?.start?.line || null,
        });
        continue;
      }

      if (name === "Route" || name.endsWith("\\Route")) {
        let method = "ANY";
        for (const arg of args) {
          if (arg.kind === "namedargument" && arg.name === "methods") {
            const items = arg.value?.items || [];
            if (items[0]?.value?.value) {
              method = items[0].value.value;
            }
            break;
          }
        }
        routes.push({
          method,
          path,
          line: node.loc?.start?.line || null,
        });
      }
    }
  }
  return routes;
}
