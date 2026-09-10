import { resolve } from "node:path";
import { homedir } from "node:os";
import fs from "node:fs/promises";
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
  const normalized = resolved.replace(/\\/g, "/").toLowerCase();
  if (normalized === "/" || /^[a-z]:\/$/.test(normalized)) return true;
  for (const dir of allSensitive) {
    const normalizedDir = dir.replace(/\\/g, "/").toLowerCase();
    if (normalized === normalizedDir || normalized.startsWith(normalizedDir + "/")) return true;
  }
  return false;
}
export function resolvePath(input) {
  if (typeof input !== "string" || !input.trim()) {
    throw Object.assign(new Error("Path must be a non-empty string"), { status: 400 });
  }
  const value = input.trim();
  if (value === "~" || value.startsWith("~/") || value.startsWith("~\\")) {
    return resolve(homedir(), value.slice(2));
  }
  return resolve(value);
}

export async function validateRealPath(input) {
  const real = await fs.realpath(resolvePath(input));
  const result = validatePath(real);
  if (!result.safe) throw Object.assign(new Error(result.reason), { status: 403 });
  return real;
}
