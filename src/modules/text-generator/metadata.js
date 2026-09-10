import fs from "node:fs";
import path from "node:path";

export function readProjectMetadata(projectPath) {
  if (!projectPath) return {};
  let handle;
  try {
    const target = path.join(projectPath, "package.json");
    if (!fs.lstatSync(target).isFile()) return {};
    handle = fs.openSync(target, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0));
    if (fs.fstatSync(handle).size > 1024 * 1024) return {};
    return JSON.parse(fs.readFileSync(handle, "utf8"));
  } catch {
    return {};
  } finally {
    if (handle !== undefined) fs.closeSync(handle);
  }
}
