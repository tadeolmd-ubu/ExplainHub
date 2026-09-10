const methods = new Set(["get", "post", "put", "delete", "patch", "head", "options", "all"]);

export function analyzeExpress(ast) {
  const nodes = [];
  const walk = node => {
    if (!node || typeof node !== "object") return;
    if (node.type) nodes.push(node);
    for (const [key, value] of Object.entries(node)) {
      if (["loc", "comments", "tokens"].includes(key)) continue;
      if (Array.isArray(value)) value.forEach(walk);
      else if (value && typeof value === "object") walk(value);
    }
  };
  walk(ast);
  const factories = new Set();
  const routerFactories = new Set();
  const receivers = new Set();
  const routeExports = {};
  const routeImports = {};
  const scopes = [];
  for (const node of nodes) {
    if (node.type === "ImportDeclaration") {
      for (const spec of node.specifiers) {
        const local = spec.local.name;
        if (node.source.value === "express") {
          if (spec.imported?.name === "Router") routerFactories.add(local);
          else if (spec.type !== "ImportSpecifier") factories.add(local);
        } else {
          routeImports[local] = { source: node.source.value, imported: spec.imported?.name || "default" };
        }
      }
    }
    if (node.type === "VariableDeclarator" && node.init?.callee?.name === "require") {
      const source = node.init.arguments[0]?.value;
      if (source === "express") {
        if (node.id.type === "Identifier") factories.add(node.id.name);
        for (const property of node.id.properties || []) {
          if (property.key?.name === "Router") routerFactories.add(property.value.name);
        }
      } else if (typeof source === "string" && node.id.type === "Identifier") {
        routeImports[node.id.name] = { source, imported: "default" };
      }
    }
  }
  for (const node of nodes) {
    if (!node.type?.startsWith("Function") && node.type !== "ArrowFunctionExpression") continue;
    const bindings = new Set((node.params || []).flatMap(paramNames));
    walkBindings(node.body, bindings);
    scopes.push({ start: node.start, end: node.end, bindings });
  }
  for (const node of nodes) {
    if (node.type !== "VariableDeclarator" || node.id.type !== "Identifier" || node.init?.type !== "CallExpression") continue;
    const callee = node.init.callee;
    if (factories.has(callee.name) || routerFactories.has(callee.name) ||
        (factories.has(callee.object?.name) && callee.property?.name === "Router")) receivers.add(node.id.name);
  }
  const routes = [];
  const routeMounts = [];
  for (const node of nodes) {
    if (node.type === "ExportDefaultDeclaration" && receivers.has(node.declaration?.name)) routeExports.default = node.declaration.name;
    if (node.type === "ExportNamedDeclaration") {
      for (const spec of node.specifiers || []) if (receivers.has(spec.local?.name)) routeExports[spec.exported.name] = spec.local.name;
      for (const declaration of node.declaration?.declarations || []) if (receivers.has(declaration.id.name)) routeExports[declaration.id.name] = declaration.id.name;
    }
    if (node.type === "AssignmentExpression" && node.left?.object?.name === "module" && node.left?.property?.name === "exports" && receivers.has(node.right?.name)) routeExports.default = node.right.name;
    if (node.type !== "CallExpression" || node.callee?.type !== "MemberExpression") continue;
    const receiver = node.callee.object?.name;
    if (!receivers.has(receiver)) continue;
    if (scopes.some(scope => node.start >= scope.start && node.end <= scope.end && scope.bindings.has(receiver))) continue;
    const method = node.callee.property?.name;
    const first = node.arguments[0];
    if (method === "use") {
      const prefix = first?.type === "StringLiteral" ? first.value : "";
      for (const arg of node.arguments.slice(prefix ? 1 : 0)) {
        if (arg.type === "Identifier") routeMounts.push({ receiver, target: arg.name, prefix });
      }
    } else if (methods.has(method) && first?.type === "StringLiteral" && node.arguments.length > 1) {
      routes.push({ method: method.toUpperCase(), path: first.value, receiver, line: node.loc?.start.line || 0 });
    }
  }
  return { routes, routeMounts, routeImports, routeExports };
}

function paramNames(node) {
  if (!node) return [];
  if (node.type === "Identifier") return [node.name];
  if (node.type === "AssignmentPattern") return paramNames(node.left);
  if (node.type === "RestElement") return paramNames(node.argument);
  if (node.type === "ObjectPattern") return node.properties?.flatMap(property => paramNames(property.value)) || [];
  if (node.type === "ArrayPattern") return node.elements?.flatMap(paramNames) || [];
  return [];
}

function walkBindings(node, bindings) {
  if (!node || typeof node !== "object") return;
  if (node !== undefined && (node.type?.startsWith("Function") || node.type === "ArrowFunctionExpression")) return;
  if (node.type === "VariableDeclarator") {
    for (const name of paramNames(node.id)) bindings.add(name);
  }
  for (const [key, value] of Object.entries(node)) {
    if (["loc", "comments", "tokens"].includes(key)) continue;
    if (Array.isArray(value)) value.forEach(child => walkBindings(child, bindings));
    else if (value && typeof value === "object") walkBindings(value, bindings);
  }
}

export function extractRoutes(ast) {
  return analyzeExpress(ast).routes;
}
