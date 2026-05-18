import { AnalyzerService } from "../core/analyzer/analyzer.service.js";

export async function analyzeProject(req, res) {
  try {
    const { projectPath } = req.body
    if (!projectPath) return res.status(400).json({ error: "projectPath is required" })
    const service = new AnalyzerService()
    const { summary } = await service.analyze(projectPath)
    res.json({ summary })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}