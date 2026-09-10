import { timingSafeEqual } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { AnalyzerService } from "../core/analyzer/analyzer.service.js";

let activeJobs = 0;

export async function analyzeProject(req, res, next) {
  let acquired = false;
  try {
    if (process.env.API_TOKEN) {
      const actual = Buffer.from(req.get("authorization") || "");
      const expected = Buffer.from(`Bearer ${process.env.API_TOKEN}`);
      if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return res.status(401).json({ error: "Unauthorized" });
    }
    const { projectPath, language = "en", ai = true } = req.body || {};
    if (typeof projectPath !== "string" || !projectPath.trim() || !["en", "es"].includes(language) || typeof ai !== "boolean") {
      return res.status(400).json({ error: "projectPath must be a non-empty string, language en/es and ai a boolean" });
    }
    if (/^[a-z]+:\/\//i.test(projectPath.trim()) || /^[\w.-]+@/.test(projectPath.trim())) {
      return res.status(400).json({ error: "The API accepts local projects only; use the CLI for remote repositories" });
    }
    const root = await fs.realpath(process.env.ANALYSIS_ROOT || process.cwd());
    const project = await fs.realpath(path.resolve(root, projectPath.trim()));
    const relative = path.relative(root, project);
    if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) return res.status(403).json({ error: "Project is outside ANALYSIS_ROOT" });
    if (activeJobs >= 2) return res.status(429).json({ error: "Analysis capacity reached" });
    activeJobs++;
    acquired = true;
    const result = await new AnalyzerService().analyze(project, "txt", language, { ai });
    res.json(result);
  } catch (error) {
    if (["ENOENT", "ENOTDIR", "EINVAL"].includes(error.code)) error.status = 400;
    next(error);
  } finally {
    if (acquired) activeJobs--;
  }
}
