export function toArray(obj) {
  if (obj == null) return [];
  return Array.isArray(obj) ? obj : [obj];
}
