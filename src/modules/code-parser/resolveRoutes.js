import path from "node:path";

export function resolveRoutes(files) {
  const byPath = new Map(files.map(file => [path.resolve(file.filePath), file]));
  const parents = new Map();
  const budget = { visited: 0, truncated: false };
  const key = (file, receiver) => `${path.resolve(file.filePath)}#${receiver}`;
  for (const file of files) {
    for (const mount of file.routeMounts || []) {
      let targetFile = file;
      let receiver = mount.target;
      const imported = file.routeImports?.[mount.target];
      if (imported) {
        if (!imported.source.startsWith(".")) continue;
        const base = path.resolve(path.dirname(file.filePath), imported.source);
        targetFile = [base, ...[".js", ".ts", ".mjs", ".cjs", "/index.js", "/index.ts"].map(ext => base + ext)].map(p => byPath.get(p)).find(Boolean);
        receiver = targetFile?.routeExports?.[imported.imported];
      }
      if (!targetFile || !receiver) continue;
      const target = key(targetFile, receiver);
      if (!parents.has(target)) parents.set(target, []);
      parents.get(target).push({ parent: key(file, mount.receiver), prefix: mount.prefix });
    }
  }
  function prefixes(target, visited = new Set()) {
    if (visited.has(target) || visited.size > 32) return [];
    if (++budget.visited > 10000) {
      budget.truncated = true;
      return [];
    }
    const mounts = parents.get(target);
    if (!mounts) return [""];
    const next = new Set(visited).add(target);
    const result = [];
    for (const mount of mounts) {
      for (const prefix of prefixes(mount.parent, next)) {
        result.push(join(prefix, mount.prefix));
        if (result.length >= 100) return result;
      }
    }
    return result;
  }
  for (const file of files) {
    file.routes = (file.routes || []).flatMap(route => {
      if (!route.receiver) return [route];
      return prefixes(key(file, route.receiver)).map(prefix => ({ ...route, path: join(prefix, route.path) }));
    });
  }
  if (budget.truncated) {
    for (const file of files) {
      file.routeDiagnostics ||= [];
      file.routeDiagnostics.push("Route mount expansion exceeded its analysis budget");
    }
  }
}

function join(prefix, route) {
  if (!prefix) return route;
  return `${prefix.replace(/\/$/, "")}/${route.replace(/^\//, "")}`;
}
