export const repositoryLimits = Object.freeze({
  maxFiles: 5000,
  maxBytes: 100 * 1024 * 1024,
  maxFileBytes: 10 * 1024 * 1024,
  maxDepth: 64,
  maxEntries: 10000,
});

export function limitError(message) {
  return Object.assign(new Error(message), { status: 413 });
}
