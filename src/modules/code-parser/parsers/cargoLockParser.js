import { parse } from "smol-toml";
import { toArray } from "./utils.js";

function extractPackages(doc) {
  const packages = doc.package;
  if (!packages) return [];
  return toArray(packages).map((pkg) => ({
    name: pkg.name || "",
    version: pkg.version || "",
    source: pkg.source || "",
    checksum: pkg.checksum || "",
    dependencies: toArray(pkg.dependencies).map((dep) => {
      const parts = dep.split(" ");
      return { name: parts[0] || "", version: parts[1] || "" };
    }),
  }));
}

function extractRootPackage(doc) {
  const packages = doc.package;
  if (!packages) return null;
  const list = toArray(packages);
  const root = list.find((p) => p.name === doc.package?.[0]?.name && !p.source);
  if (!root) return null;
  return { name: root.name || "", version: root.version || "" };
}

export async function parseCargoLock(content) {
  try {
    const doc = parse(content);
    const packages = extractPackages(doc);
    const rootPackage = extractRootPackage(doc);

    return {
      imports: packages.map((p) => `${p.name}@${p.version}`),
      functions: [],
      classes: [],
      routes: [],
      exports: [],
      lockfileVersion: doc.version || null,
      packages,
      rootPackage,
    };
  } catch {
    return {
      imports: [],
      functions: [],
      classes: [],
      routes: [],
      exports: [],
      lockfileVersion: null,
      packages: [],
      rootPackage: null,
    };
  }
}
