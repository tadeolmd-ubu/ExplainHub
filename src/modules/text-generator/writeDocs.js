import fs from "node:fs/promises";
import path from "node:path";

export async function writeDocs({ projectPath, readme, modules, outputDir }) {
  const source = await fs.realpath(projectPath);
  const requested = path.resolve(outputDir || path.join(process.cwd(), "explainhub-output"));
  await fs.mkdir(requested, { recursive: true });
  const destination = await fs.realpath(requested);
  if (destination === source) throw new Error("Output directory must differ from the project root");
  // Every report gets its own directory. Existing files and symlinks are never reused.
  const reportDir = await fs.mkdtemp(path.join(destination, "report-"));
  try {
    const docsDir = path.join(reportDir, "docs");
    await fs.mkdir(docsDir);
    const outputPaths = [];
    for (const [relative, content] of [["README.md", readme], ...modules.map(m => [`docs/${m.name}.md`, m.content])]) {
      const target = path.join(reportDir, relative);
      if (!target.startsWith(reportDir + path.sep)) throw new Error("Invalid document path");
      await fs.writeFile(target, content, { flag: "wx" });
      outputPaths.push(target);
    }
    return { outputDir: reportDir, outputPaths };
  } catch (error) {
    await fs.rm(reportDir, { recursive: true, force: true });
    throw error;
  }
}
