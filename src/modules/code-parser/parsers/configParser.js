import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

export function parseConfig(content) {
  const doc = parser.parse(content);
  const cfg = doc.configuration || {};

  const connectionStrings = [];
  const appSettings = [];

  const csNodes = cfg.connectionStrings?.add;
  if (csNodes) {
    const items = Array.isArray(csNodes) ? csNodes : [csNodes];
    for (const cs of items) {
      connectionStrings.push({
        name: cs["@_name"] || "",
        connectionString: cs["@_connectionString"] || "",
        providerName: cs["@_providerName"] || "",
      });
    }
  }

  const asNodes = cfg.appSettings?.add;
  if (asNodes) {
    const items = Array.isArray(asNodes) ? asNodes : [asNodes];
    for (const s of items) {
      appSettings.push({
        key: s["@_key"] || "",
        value: s["@_value"] || "",
      });
    }
  }

  return {
    imports: [],
    functions: [],
    classes: [],
    routes: [],
    exports: [],
    connectionStrings,
    appSettings,
  };
}