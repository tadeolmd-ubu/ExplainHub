import path from "node:path";

export function readmeFormatter({
  technologies,
  entryPoints,
  files,
  tree,
  projectPath,
  catalog = [],
  metadata = {},
}) {
  const projectName = getProjectName(projectPath);
  const sections = [
    `# ${projectName}\n`,
    overviewSection(technologies, entryPoints),
    getStartedSection(metadata),
    projectInfoSection(files, metadata),
    dependenciesSection(files, metadata),
    featuresSection(files),
    structureSection(tree, projectName),
    modulesSection(catalog),
    schemaSection(files),
  ].filter(Boolean);

  return sections.join("\n\n");
}

function getProjectName(projectPath) {
  const dirName = path.basename(projectPath);
  if (dirName && dirName !== "repository") return dirName;
  const parentName = path.basename(path.dirname(projectPath));
  return parentName || "project";
}

function overviewSection(technologies, entryPoints) {
  const techs =
    technologies?.length > 0
      ? "| Technology |\n|------------|\n" +
        technologies.map((t) => `| ${t} |`).join("\n")
      : "";
  const entries =
    entryPoints && Object.keys(entryPoints).length > 0
      ? "| Technology | File |\n|------------|------|\n" +
        Object.entries(entryPoints)
          .flatMap(([tech, files]) =>
            files.map((f) => `| ${tech} | ${path.basename(f)} |`),
          )
          .join("\n")
      : "";
  if (!techs && !entries) return null;
  return `## Overview\n\n${techs}\n\n${entries}`.trim();
}

function projectInfoSection(files, metadata) {
  const cargoFile = files.find((f) => f.package);
  if (cargoFile) {
    const pkg = cargoFile.package;
    const rows = [];
    if (pkg.version) rows.push(`| Version | ${pkg.version} |`);
    if (pkg.edition) rows.push(`| Edition | ${pkg.edition} |`);
    if (pkg.description) rows.push(`| Description | ${pkg.description} |`);
    if (pkg.license) rows.push(`| License | ${pkg.license} |`);
    if (pkg.authors?.length)
      rows.push(`| Authors | ${pkg.authors.join(", ")} |`);
    if (pkg.repository) rows.push(`| Repository | ${pkg.repository} |`);
    if (pkg.rustVersion) rows.push(`| Rust Version | ${pkg.rustVersion} |`);
    if (rows.length === 0) return null;
    return `## Project Info\n\n| Field | Value |\n|-------|-------|\n${rows.join("\n")}`;
  }

  if (metadata) {
    try {
      const pkg = metadata;
      const rows = [];
      if (pkg.version) rows.push(`| Version | ${pkg.version} |`);
      if (pkg.description) rows.push(`| Description | ${pkg.description} |`);
      if (pkg.license) rows.push(`| License | ${pkg.license} |`);
      if (pkg.author) rows.push(`| Author | ${pkg.author} |`);
      if (pkg.homepage) rows.push(`| Homepage | ${pkg.homepage} |`);
      if (pkg.repository?.url)
        rows.push(`| Repository | ${pkg.repository.url} |`);
      if (rows.length === 0) return null;
      return `## Project Info\n\n| Field | Value |\n|-------|-------|\n${rows.join("\n")}`;
    } catch {}
  }

  return null;
}

function dependenciesSection(files, metadata) {
  const cargoFile = files.find((f) => f.dependencies);
  if (cargoFile) {
    const deps = cargoFile.dependencies;
    const rows = [];
    for (const d of deps.normal || []) {
      rows.push(`| ${d.name} | ${d.version || "-"} | dependencies |`);
    }
    for (const d of deps.dev || []) {
      rows.push(`| ${d.name} | ${d.version || "-"} | dev-dependencies |`);
    }
    for (const d of deps.build || []) {
      rows.push(`| ${d.name} | ${d.version || "-"} | build-dependencies |`);
    }
    if (rows.length === 0) return null;
    return `## Dependencies\n\n| Name | Version | Type |\n|------|---------|------|\n${rows.join("\n")}`;
  }

  if (metadata) {
    try {
      const pkg = metadata;
      const rows = [];
      for (const [name, version] of Object.entries(pkg.dependencies || {})) {
        rows.push(`| ${name} | ${version} | dependencies |`);
      }
      for (const [name, version] of Object.entries(pkg.devDependencies || {})) {
        rows.push(`| ${name} | ${version} | dev-dependencies |`);
      }
      if (rows.length === 0) return null;
      return `## Dependencies\n\n| Name | Version | Type |\n|------|---------|------|\n${rows.join("\n")}`;
    } catch {}
  }

  return null;
}

function featuresSection(files) {
  const cargoFile = files.find(
    (f) => f.features && Object.keys(f.features).length > 0,
  );
  if (!cargoFile) return null;
  const rows = [];
  for (const [name, implies] of Object.entries(cargoFile.features)) {
    rows.push(`| ${name} | ${implies.length > 0 ? implies.join(", ") : "-"} |`);
  }
  if (rows.length === 0) return null;
  return `## Features\n\n| Name | Implies |\n|------|--------|\n${rows.join("\n")}`;
}

function structureSection(tree, projectName) {
  if (!tree) return null;
  const lines = [];
  renderTree(tree, lines, "");
  return `## Project Structure\n\n\`\`\`\n${projectName}/\n${lines.join("\n")}\n\`\`\``;
}

function renderTree(node, lines, prefix) {
  if (!node.children) return;
  const filtered = node.children.filter((c) => !isIgnored(c.name));
  for (let i = 0; i < filtered.length; i++) {
    const child = filtered[i];
    const isLast = i === filtered.length - 1;
    const connector = isLast ? "└── " : "├── ";
    lines.push(`${prefix}${connector}${child.name}`);
    if (child.children) {
      const childPrefix = prefix + (isLast ? "    " : "│   ");
      renderTree(child, lines, childPrefix);
    }
  }
}

const IGNORED_EXTENSIONS = [
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".env",
];
function isIgnored(name) {
  return IGNORED_EXTENSIONS.includes(name);
}

function modulesSection(catalog) {
  const rows = catalog.map(({ name, label, files }) =>
    `| [${label}](docs/${name}.md) | ${files.length} | ${moduleDescription(new Set(files.map(f => f.type)))} |`,
  );
  if (rows.length === 0) return null;
  return `## Modules\n\n| Module | Files | Description |\n|--------|-------|-------------|\n${rows.join("\n")}`;
}

function moduleDescription(types) {
  const parts = [];
  if (types.has("sql")) parts.push("SQL scripts");
  if (types.has("javascript") || types.has("typescript"))
    parts.push("JavaScript");
  if (types.has("php")) parts.push("PHP");
  if (types.has("python")) parts.push("Python");
  if (types.has("ruby")) parts.push("Ruby");
  if (types.has("stylesheet")) parts.push("CSS");
  if (types.has("markup")) parts.push("HTML");
  if (types.has("rust")) parts.push("Rust");
  if (types.has("java")) parts.push("Java");
  if (types.has("go")) parts.push("Go");
  if (types.has("csharp")) parts.push("C#");
  if (types.has("config")) parts.push("Configuration");
  return parts.length > 0 ? parts.join(", ") : "-";
}

function schemaSection(files) {
  const items = [];
  for (const file of files) {
    for (const t of file.tables || [])
      items.push({
        type: "Table",
        name: t.name,
        detail: `${t.columns?.length || 0} columns`,
      });
    for (const v of file.views || [])
      items.push({ type: "View", name: v.name, detail: "" });
    for (const i of file.indexes || [])
      items.push({ type: "Index", name: i.name, detail: `ON ${i.table}` });
  }
  if (items.length === 0) return null;
  const rows = items.map((i) => `| ${i.type} | ${i.name} | ${i.detail} |`);
  return `## Database Schema\n\n| Type | Name | Details |\n|------|------|---------|\n${rows.join("\n")}`;
}
function getStartedSection(metadata) {
  const cmds = [];
  if (typeof metadata.scripts?.start === "string") cmds.push("npm start");
  else if (typeof metadata.scripts?.dev === "string") cmds.push("npm run dev");
  if (!cmds.length) return "## Get Started\n\nNo verified startup command detected.";
  return `## Get Started\n\nRun from the project root:\n\n\`\`\`bash\n${cmds.join("\n")}\n\`\`\``;
}
