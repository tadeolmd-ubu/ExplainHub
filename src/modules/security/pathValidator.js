import { resolve } from "node:path";
import { homedir } from "node:os";
import { linux, windows, macOs } from "./sensitivePath.js";

const allSensitive = new Set([...linux, ...windows, ...macOs]);

export function validatePath(input) {
  const resolved = resolvePath(input);
  return {
    safe: !isSensitivePath(resolved),
    resolved,
    reason: isSensitivePath(resolved)
      ? `"${resolved}" es un directorio sensible`
      : undefined,
  };
}

function isSensitivePath(resolved) {
  const normalized = resolved.replace(/\\/g, "/");
  for (const dir of allSensitive) {
    const normalizedDir = dir.replace(/\\/g, "/");
    if (normalized === normalizedDir || normalized.startsWith(normalizedDir + "/")) return true;
  }
  return false;
}
export function resolvePath(input) {
  if (input.startsWith("~")) {
    return resolve(input.replace("~", homedir()));
  }
  return resolve(input);
}
