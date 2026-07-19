import fs from "node:fs";
import path from "node:path";

export function readmeFormatter({
  technologies,
  entryPoints,
  files,
  tree,
  projectPath,
}) {
  const projectName = getProjectName(projectPath);
  const sections = [
    `# ${projectName}\n`,
    overviewSection(technologies, entryPoints),
    projectInfoSection(files, projectPath),
    dependenciesSection(files, projectPath),
    featuresSection(files),
    structureSection(tree),
    modulesSection(files, projectPath),
    apiSection(files),
    schemaSection(files),
  ].filter(Boolean);

  return sections.join("\n\n");
}

function getProjectName(projectPath) {
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(projectPath, "package.json"), "utf-8"),
    );
    return pkg.name || path.basename(projectPath);
  } catch {
    const parentName = path.basename(path.dirname(projectPath));
    const stripped = parentName.replace(
      /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-/,
      "",
    );
    return stripped || path.basename(projectPath);
  }
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
          .flatMap(([tech, files]) => files.map((f) => `| ${tech} | ${f} |`))
          .join("\n")
      : "";
  if (!techs && !entries) return null;
  return `## Overview\n\n${techs}\n\n${entries}`.trim();
}

function projectInfoSection(files, projectPath) {
  const cargoFile = files.find((f) => f.package);
  if (cargoFile) {
    const pkg = cargoFile.package;
    const rows = [];
    if (pkg.version) rows.push(`| Version | ${pkg.version} |`);
    if (pkg.edition) rows.push(`| Edition | ${pkg.edition} |`);
    if (pkg.description) rows.push(`| Description | ${pkg.description} |`);
    if (pkg.license) rows.push(`| License | ${pkg.license} |`);
    if (pkg.authors?.length) rows.push(`| Authors | ${pkg.authors.join(", ")} |`);
    if (pkg.repository) rows.push(`| Repository | ${pkg.repository} |`);
    if (pkg.rustVersion) rows.push(`| Rust Version | ${pkg.rustVersion} |`);
    if (rows.length === 0) return null;
    return `## Project Info\n\n| Field | Value |\n|-------|-------|\n${rows.join("\n")}`;
  }

  if (projectPath) {
    try {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(projectPath, "package.json"), "utf-8"),
      );
      const rows = [];
      if (pkg.version) rows.push(`| Version | ${pkg.version} |`);
      if (pkg.description) rows.push(`| Description | ${pkg.description} |`);
      if (pkg.license) rows.push(`| License | ${pkg.license} |`);
      if (pkg.author) rows.push(`| Author | ${pkg.author} |`);
      if (pkg.homepage) rows.push(`| Homepage | ${pkg.homepage} |`);
      if (pkg.repository?.url) rows.push(`| Repository | ${pkg.repository.url} |`);
      if (rows.length === 0) return null;
      return `## Project Info\n\n| Field | Value |\n|-------|-------|\n${rows.join("\n")}`;
    } catch {}
  }

  return null;
}

function dependenciesSection(files, projectPath) {
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

  if (projectPath) {
    try {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(projectPath, "package.json"), "utf-8"),
      );
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
  const cargoFile = files.find((f) => f.features && Object.keys(f.features).length > 0);
  if (!cargoFile) return null;
  const rows = [];
  for (const [name, implies] of Object.entries(cargoFile.features)) {
    rows.push(`| ${name} | ${implies.length > 0 ? implies.join(", ") : "-"} |`);
  }
  if (rows.length === 0) return null;
  return `## Features\n\n| Name | Implies |\n|------|--------|\n${rows.join("\n")}`;
}

function structureSection(tree) {
  if (!tree) return null;
  const lines = [];
  renderTree(tree, lines, "");
  return `## Project Structure\n\n\`\`\`\n${tree.name}/\n${lines.join("\n")}\`\`\``;
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

function modulesSection(files, projectPath) {
  const dirs = {};
  for (const file of files) {
    const dir = path.dirname(file.filePath);
    if (projectPath && dir === projectPath) continue;
    if (!dirs[dir]) dirs[dir] = { files: 0 };
    dirs[dir].files++;
  }

  const nameCount = {};
  for (const dir of Object.keys(dirs)) {
    const name = path.basename(dir);
    nameCount[name] = (nameCount[name] || 0) + 1;
  }

  const rows = Object.entries(dirs)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([dir, info]) => {
      const name = path.basename(dir);
      const relPath = projectPath
        ? path.relative(projectPath, dir)
        : dir;
      let linkName = name;
      if (nameCount[name] > 1) {
        const parent = path.basename(path.dirname(dir));
        linkName = `${parent}-${name}`;
      }
      const link = `docs/${linkName}.md`;
      return `| [${name}](${link}) | \`${relPath}\` | ${info.files} |`;
    });
  if (rows.length === 0) return null;
  return `## Modules\n\n| Module | Path | Files |\n|--------|------|-------|\n${rows.join("\n")}`;
}

function apiSection(files) {
  const routes = files.flatMap((f) =>
    (f.routes || []).map((r) => ({ ...r, file: f.filePath })),
  );
  if (routes.length === 0) return null;
  const rows = routes.map((r) => `| ${r.method} | ${r.path} | ${r.file} |`);
  return `## API Endpoints\n\n| Method | Path | File |\n|--------|------|------|\n${rows.join("\n")}`;
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
