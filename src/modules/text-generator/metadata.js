import fs from "node:fs";
import path from "node:path";

export function readProjectMetadata(projectPath) {
  if (!projectPath) return {};
  try {
    return JSON.parse(fs.readFileSync(path.join(projectPath, "package.json"), "utf8"));
  } catch {
    return {};
  }
}
