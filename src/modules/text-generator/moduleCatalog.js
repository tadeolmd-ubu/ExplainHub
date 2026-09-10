import path from "node:path";
import { createHash } from "node:crypto";

// Full relative path identity, with a bounded filename even for deeply nested projects.
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
    name: relative === "." ? "root" : `module-${createHash("sha256").update(relative).digest("hex")}`,
    label: relative,
    files: members,
  }));
}
