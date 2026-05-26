import * as fs from "node:fs/promises";
import path from "node:path";
import { ignoredNames } from "../structure-extractor/index.js";
import { resolvePath } from "./pathValidator.js";

const maxFiles = 5000;
const maxFileSize = 5 * 1024 * 1024;
const maxProjectSize = 100 * 1024 * 1024;
export async function validateRepositorySize(projectPath) {
  const absolutePath = resolvePath(projectPath);
  await fs.access(absolutePath);
  const state = { totalSize: 0, fileCount: 0, oversizedFiles: [] };
  await walkDirectory(absolutePath, state);
  if (state.totalSize > maxProjectSize) {
    return {
      safe: false,
      reason: `El proyecto excede los 100 MB (${(state.totalSize / 1024 / 1024).toFixed(2)} MB)`,
    };
  }
  if (state.fileCount > maxFiles) {
    return {
      safe: false,
      reason: `El proyecto excede los ${maxFiles} archivos (${state.fileCount})`,
    };
  }
  return {
    safe: true,
    totalSize: state.totalSize,
    fileCount: state.fileCount,
    oversizedFiles: state.oversizedFiles,
  };
}
async function walkDirectory(dirPath, state) {
  const entries = await fs.readdir(dirPath);
  for (const entry of entries) {
    if (shouldIgnore(entry)) continue;
    const fullPath = path.join(dirPath, entry);
    const stats = await fs.stat(fullPath);
    if (stats.isDirectory()) {
      await walkDirectory(fullPath, state);
    } else {
      state.fileCount++;
      state.totalSize += stats.size;
      if (stats.size > maxFileSize) {
        state.oversizedFiles.push({ path: fullPath, size: stats.size });
      }
    }
  }
}
function shouldIgnore(name) {
  return ignoredNames.has(name);
}
