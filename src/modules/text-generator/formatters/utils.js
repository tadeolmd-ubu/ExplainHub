export const METADATA_KEYS = new Set([
  "filePath", "type", "package", "dependencies", "features",
  "routeImports", "routeExports", "routeMounts", "warnings",
]);

export function isEmptyFile(file) {
  return Object.keys(file)
    .filter((key) => !METADATA_KEYS.has(key))
    .every((key) => {
      const val = file[key];
      return !val || (Array.isArray(val) && val.length === 0);
    });
}
