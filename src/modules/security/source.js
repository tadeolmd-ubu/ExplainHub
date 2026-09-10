import { resolvePath } from "./pathValidator.js";

export function normalizeSource(input) {
  if (typeof input !== "string" || !input.trim()) {
    throw Object.assign(new Error("projectPath must be a non-empty string"), { status: 400 });
  }
  const value = input.trim();
  if (/^(https?:\/\/|git:\/\/|ssh:\/\/)/i.test(value) || /^[\w.-]+@[\w.-]+:[\w./-]+$/.test(value)) {
    return { type: "remote", value };
  }
  if (/^[a-z]+:\/\//i.test(value)) {
    throw Object.assign(new Error("Unsupported repository protocol"), { status: 400 });
  }
  return { type: /\.zip$/i.test(value) ? "zip" : "local", value: resolvePath(value) };
}

export function validateAnalysisOptions(format, language) {
  if (!["md", "txt"].includes(format) || !["en", "es"].includes(language)) {
    throw Object.assign(new Error("format must be txt/md and language must be en/es"), { status: 400 });
  }
}
