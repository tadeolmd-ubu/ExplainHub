import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

function extractVersionFromHintPath(hintPath) {
  const match = hintPath.match(/[\\/]([^\\/]+?)\.[\d]+\.[\d]+/);
  if (!match) return "";
  const folder = match[1];
  const verMatch = folder.match(/([\d]+\.[\d]+\.[\d]+(?:\.\d+)?)/);
  return verMatch ? verMatch[1] : "";
}

function extractVersionFromInclude(include) {
  const match = include.match(/Version=([\d]+\.[\d]+\.[\d]+(?:\.\d+)?)/);
  return match ? match[1] : "";
}

function getPropValue(propGroups, name) {
  const groups = Array.isArray(propGroups) ? propGroups : [propGroups];
  for (const g of groups) {
    if (g[name]) return g[name];
  }
  return "";
}

function toArray(obj) {
  if (obj == null) return [];
  return Array.isArray(obj) ? obj : [obj];
}

export function parseCsproj(content) {
  const doc = parser.parse(content);
  const project = doc.Project || {};
  const sdk = project["@_Sdk"] || "";
  const toolsVersion = project["@_ToolsVersion"] || "";

  const framework =
    getPropValue(project.PropertyGroup, "TargetFramework") ||
    getPropValue(project.PropertyGroup, "TargetFrameworkVersion") ||
    "";
  const outputType = getPropValue(project.PropertyGroup, "OutputType") || "";

  const groups = toArray(project.ItemGroup);
  const packages = [];
  const projectRefs = [];
  const legacyRefs = [];

  for (const group of groups) {
    for (const ref of toArray(group.PackageReference)) {
      packages.push({
        name: ref["@_Include"] || "",
        version: ref["@_Version"] || "",
      });
    }
    for (const ref of toArray(group.ProjectReference)) {
      projectRefs.push({
        path: (ref["@_Include"] || "").replace(/\\/g, "/"),
      });
    }
    for (const ref of toArray(group.Reference)) {
      const include = ref["@_Include"] || "";
      const name = include.split(",")[0].trim();
      const hintPath = ref.HintPath || "";
      const version =
        extractVersionFromHintPath(hintPath) ||
        extractVersionFromInclude(include) ||
        "";
      legacyRefs.push({ name, version, hintPath });
    }
  }

  const allPackages = [...packages, ...legacyRefs];

  return {
    imports: allPackages.map((p) => `${p.name}@${p.version}`),
    functions: [],
    classes: [],
    routes: [],
    exports: [],
    packages: allPackages,
    projectReferences: projectRefs,
    framework,
    sdk: sdk || (toolsVersion ? `Legacy (v${toolsVersion})` : ""),
    outputType,
  };
}
