import * as fs from "node:fs/promises";
import path from "node:path";
import { ignoredNames } from "../structure-extractor/index.js";
import { resolvePath } from "./pathValidator.js";
import { repositoryLimits, limitError } from "./limits.js";

export async function validateRepositorySize(projectPath, limits = repositoryLimits) {
  const state = { totalSize: 0, fileCount: 0, entries: 0 };
  try {
    await walkDirectory(resolvePath(projectPath), state, limits, 0);
    return { safe: true, ...state };
  } catch (error) {
    if (error.status === 413) return { safe: false, reason: error.message, ...state };
    throw error;
  }
}

async function walkDirectory(dirPath, state, limits, depth) {
  if (depth > limits.maxDepth) throw limitError("Repository exceeds maximum directory depth");
  const directory = await fs.opendir(dirPath);
  for await (const entry of directory) {
    if (ignoredNames.has(entry.name)) continue;
    if (++state.entries > limits.maxEntries) throw limitError("Repository contains too many entries");
    const fullPath = path.join(dirPath, entry.name);
    const stats = await fs.lstat(fullPath);
    if (stats.isSymbolicLink()) continue;
    if (stats.isDirectory()) {
      await walkDirectory(fullPath, state, limits, depth + 1);
    } else if (stats.isFile()) {
      state.fileCount++;
      state.totalSize += stats.size;
      if (stats.size > limits.maxFileBytes) throw limitError(`File exceeds maximum size: ${entry.name}`);
      if (state.fileCount > limits.maxFiles || state.totalSize > limits.maxBytes) {
        throw limitError("Repository exceeds file count or size limit");
      }
    }
  }
}
