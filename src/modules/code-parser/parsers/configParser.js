import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

function toArray(obj) {
  if (obj == null) return [];
  return Array.isArray(obj) ? obj : [obj];
}

function parseAppConfig(cfg) {
  const connectionStrings = [];
  const appSettings = [];

  for (const cs of toArray(cfg.connectionStrings?.add)) {
    connectionStrings.push({
      name: cs["@_name"] || "",
      connectionString: cs["@_connectionString"] || "",
      providerName: cs["@_providerName"] || "",
    });
  }

  for (const s of toArray(cfg.appSettings?.add)) {
    appSettings.push({
      key: s["@_key"] || "",
      value: s["@_value"] || "",
    });
  }

  return { connectionStrings, appSettings, packages: [] };
}

function parsePackagesConfig(doc) {
  const packages = [];

  for (const pkg of toArray(doc.packages?.package)) {
    packages.push({
      name: pkg["@_id"] || "",
      version: pkg["@_version"] || "",
      targetFramework: pkg["@_targetFramework"] || "",
    });
  }

  return {
    connectionStrings: [],
    appSettings: [],
    packages,
  };
}

export function parseConfig(content) {
  const doc = parser.parse(content);
  const rootKey = Object.keys(doc).find((k) => !k.startsWith("?")) || "";

  const result = doc.packages
    ? parsePackagesConfig(doc)
    : parseAppConfig(doc.configuration || {});

  return {
    imports: result.packages.map((p) => `${p.name}@${p.version}`),
    functions: [],
    classes: [],
    routes: [],
    exports: [],
    connectionStrings: result.connectionStrings,
    appSettings: result.appSettings,
    packages: result.packages,
  };
}
