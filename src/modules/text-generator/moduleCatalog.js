import path from "node:path";

// Encode each full relative directory: unlike flattened slugs this is injective.
export function buildModuleCatalog(files, projectPath = ".") {
  const root = path.resolve(projectPath);
  const groups = new Map();
  for (const file of files) {
    const directory = path.dirname(path.resolve(file.filePath));
    const relative = path.relative(root, directory).split(path.sep).join("/") || ".";
    if (!groups.has(relative)) groups.set(relative, []);
    groups.get(relative).push(file);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([relative, members]) => ({
    name: relative === "." ? "root" : `module-${Buffer.from(relative).toString("base64url")}`,
    label: relative,
    files: members,
  }));
}
