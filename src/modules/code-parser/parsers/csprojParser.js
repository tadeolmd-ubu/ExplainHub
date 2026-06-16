import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

export function parseCsproj(content) {
  const doc = parser.parse(content);
  const project = doc.Project || {};
  const sdk = project["@_Sdk"] || "";
  const propGroup = project.PropertyGroup || {};
  const framework = propGroup.TargetFramework || "";
  const itemGroups = project.ItemGroup || [];
  const groups = Array.isArray(itemGroups) ? itemGroups : [itemGroups];

  const packages = [];
  const projectRefs = [];

  for (const group of groups) {
    const refs = group.PackageReference;
    if (refs) {
      const items = Array.isArray(refs) ? refs : [refs];
      for (const pkg of items) {
        packages.push({
          name: pkg["@_Include"] || "",
          version: pkg["@_Version"] || "",
        });
      }
    }
    const projs = group.ProjectReference;
    if (projs) {
      const items = Array.isArray(projs) ? projs : [projs];
      for (const ref of items) {
        projectRefs.push({
          path: (ref["@_Include"] || "").replace(/\\/g, "/"),
        });
      }
    }
  }

  return {
    imports: packages.map((p) => `${p.name}@${p.version}`),
    functions: [],
    classes: [],
    routes: [],
    exports: [],
    packages,
    projectReferences: projectRefs,
    framework,
    sdk,
  };
}
