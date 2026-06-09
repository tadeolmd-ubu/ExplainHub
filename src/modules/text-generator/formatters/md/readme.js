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
    structureSection(tree),
    modulesSection(files),
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
    return path.basename(projectPath);
  }
}

function overviewSection(technologies, entryPoints) {
  const techs =
    technologies?.length > 0
      ? `**Technologies:** ${technologies.join(", ")}`
      : "";
  const entries =
    entryPoints && Object.keys(entryPoints).length > 0
      ? "**Entry points:**\n" +
        Object.entries(entryPoints)
          .flatMap(([tech, files]) => files.map((f) => `- ${tech} → ${f}`))
          .join("\n")
      : "";
  if (!techs && !entries) return null;
  return `## Overview\n\n${techs}\n\n${entries}`.trim();
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

const IGNORED_EXTENSIONS = ["node_modules", ".git", "dist", "build", "coverage", ".env"]
function isIgnored(name) {
  return IGNORED_EXTENSIONS.includes(
    name,
  );
}

function modulesSection(files) {
  const dirs = {};
  for (const file of files) {
    const dir = path.dirname(file.filePath);
    if (!dirs[dir]) dirs[dir] = { files: 0 };
    dirs[dir].files++;
  }
  const rows = Object.entries(dirs)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([dir, info]) => {
      const name = path.basename(dir);
      const relPath = dir.startsWith("/") ? path.relative("/", dir) : dir;
      const link = `docs/${name}.md`;
      return `| [${name}](${link}) | ${dir} | ${info.files} |`;
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
