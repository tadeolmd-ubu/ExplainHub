export function headerFormatter({ technologies, entryPoints }) {
  const lines = [
    "PROJECT OVERVIEW",
    "================",
    fmtTechnologies(technologies),
    fmtEntryPoints(entryPoints),
  ].filter(Boolean);

  return lines.join("\n");
}

function fmtTechnologies(technologies) {
  if (!technologies?.length) return "";
  return `Technologies: ${technologies.join(", ")}`;
}
function fmtEntryPoints(entryPoints) {
  const entries = Object.entries(entryPoints);
  if (!entries.length) return "";
  const lines = ["Entry points:"];
  for (const [tech, files] of entries) {
    for (const file of files) {
      lines.push(`  ${tech} → ${file}`);
    }
  }
  return lines.join("\n");
}
