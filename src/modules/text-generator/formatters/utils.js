import path from "node:path";

export const METADATA_KEYS = new Set([
  "filePath", "type", "package", "dependencies", "features",
]);

export function isEmptyFile(file) {
  return Object.keys(file)
    .filter((key) => !METADATA_KEYS.has(key))
    .every((key) => {
      const val = file[key];
      return !val || (Array.isArray(val) && val.length === 0);
    });
}

export function buildNameCount(dirs) {
  const nameCount = {};
  for (const dir of Object.keys(dirs)) {
    const name = path.basename(dir);
    nameCount[name] = (nameCount[name] || 0) + 1;
  }
  return nameCount;
}
