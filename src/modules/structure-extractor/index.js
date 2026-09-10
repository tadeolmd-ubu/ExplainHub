import fs from "node:fs/promises";
import path from "node:path";
import { techRules } from "./techRules.js";
import { entryRules } from "./entryRules.js";
import { repositoryLimits, limitError } from "../security/limits.js";

export const ignoredNames = new Set([
  "node_modules", ".git", "dist", "build", "coverage", ".env", "generated", "explainhub-output",
]);

export class StructureExtractor {
  async extract(projectPath) {
    const tree = await this.buildTree(projectPath);
    if (!tree || tree.type !== "directory") throw new Error("The path is not a directory.");
    const technologies = await this.detectTechnologies(tree);
    const entryPoints = await this.findEntryPoints(tree, technologies);
    return { tree, technologies, entryPoints };
  }

  async buildTree(rootPath) {
    return this.processNode(rootPath, { files: 0, bytes: 0, entries: 0 }, 0);
  }

  async processNode(currentPath, budget = { files: 0, bytes: 0, entries: 0 }, depth = 0) {
    if (depth > repositoryLimits.maxDepth || ++budget.entries > repositoryLimits.maxEntries) {
      throw limitError("Repository exceeds traversal limit");
    }
    const stat = await fs.lstat(currentPath);
    if (stat.isSymbolicLink()) return null;
    const name = path.basename(currentPath);
    if (stat.isDirectory()) {
      const children = [];
      const directory = await fs.opendir(currentPath);
      for await (const entry of directory) {
        if (this.shouldIgnore(entry.name)) continue;
        const child = await this.processNode(path.join(currentPath, entry.name), budget, depth + 1);
        if (child) children.push(child);
      }
      children.sort((a, b) => a.name.localeCompare(b.name));
      return { name, type: "directory", children };
    }
    if (!stat.isFile()) return null;
    budget.files++;
    budget.bytes += stat.size;
    if (stat.size > repositoryLimits.maxFileBytes || budget.files > repositoryLimits.maxFiles || budget.bytes > repositoryLimits.maxBytes) {
      throw limitError("Repository exceeds file count or size limit");
    }
    return { name, type: "file" };
  }

  shouldIgnore(name) {
    return ignoredNames.has(name);
  }

  async detectTechnologies(tree) {
    const technologies = new Set();
    visitFiles(tree, (node) => {
      if (techRules.exact[node.name]) technologies.add(techRules.exact[node.name]);
      for (const [extension, tech] of Object.entries(techRules.extensions)) {
        if (node.name.endsWith(extension)) technologies.add(tech);
      }
    });
    return [...technologies];
  }

  async findEntryPoints(tree, technologies) {
    const entries = Object.fromEntries(technologies.map(tech => [tech, []]));
    visitFiles(tree, (node, relative) => {
      for (const tech of technologies) {
        if (entryRules[tech]?.includes(node.name)) entries[tech].push(relative);
      }
    });
    return entries;
  }
}

function visitFiles(node, callback, parent = "") {
  for (const child of node.children || []) {
    const relative = parent ? `${parent}/${child.name}` : child.name;
    if (child.type === "file") callback(child, relative);
    else visitFiles(child, callback, relative);
  }
}
