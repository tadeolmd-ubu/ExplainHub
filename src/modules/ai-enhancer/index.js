import { Ollama } from "ollama";
import { buildPromptTxt } from "./prompt/promptTxt.js";
import { buildPromptMd } from "./prompt/promptMd.js";
import { buildMdEnhancer } from "./prompt/promptMdEnhancer.js";
function cleanMarkdown(text) {
  const lines = text
    .replace(/\*\*/g, "")
    .replace(/###?\s?/g, "")
    .replace(/---/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .split("\n");

  const clean = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("|") || trimmed.startsWith("+")) continue;
    if (trimmed.startsWith("```")) continue;
    clean.push(line);
  }

  return clean.join("\n").trim();
}
function stripCodeBlock(text) {
  const trimmed = text.trim();
  const match = trimmed.match(/^```(?:markdown|md)?\s*\n?([\s\S]*?)\n?\s*```$/);
  return match ? match[1].trim() : trimmed;
}
function postProcess(text, original = "") {
  let out = text
    .replace(/Membersia/g, "Membresia")
    .replace(/limpiar_membresias_duplicadas\.sql/g, "limpiar_membresias_duplicadas.sql");

  out = normalizeTables(out);
  out = alignSections(out, original);
  out = removeTrailingProse(out);

  out = out
    .replace(/([^`\s])```\s*$/gm, "$1\n```")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const fenceLines = [];
  out.split("\n").forEach((l, i) => {
    if (l.trim().startsWith("```")) fenceLines.push(i);
  });
  if (fenceLines.length % 2 === 1) {
    const lines = out.split("\n");
    lines.splice(fenceLines[fenceLines.length - 1], 1);
    out = lines.join("\n");
  }

  return out.trim() + "\n";
}
function normalizeTables(text) {
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i];
    if (/^\|.*?-{3,}\s*$/.test(t) && !/\|\s*$/.test(t.trim())) {
      lines[i] = t.replace(/-{3,}\s*$/, " |");
      const next = lines[i + 1] || "";
      if (!/^\|/.test(next.trim())) {
        const cols = Math.max((lines[i].match(/\|/g) || []).length - 1, 1);
        lines[i + 1] = `|${Array(cols).fill("------").join("|")}|`;
      }
    }
  }
  let headerCols = 0;
  let rowInTable = false;
  let currentHeader = [];
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!(/^\|/.test(raw) && /\|\s*$/.test(raw))) {
      headerCols = 0;
      rowInTable = false;
      currentHeader = [];
      continue;
    }
    const cells = raw.split("|").slice(1, -1);
    if (cells.length > 0 && cells.every((c) => /^:?-{2,}:?$/.test(c.trim()))) {
      lines[i] = `|${cells.map(() => "------").join("|")}|`;
      rowInTable = true;
      continue;
    }
    const cellCount = cells.length;
    if (!rowInTable || headerCols === 0) {
      headerCols = cellCount;
      rowInTable = true;
      currentHeader = cells.map((c) => c.trim().toLowerCase());
      lines[i] = `|${cells
        .map((c) => {
          let cell = c.trim().replace(/[ \t]{2,}/g, " ");
          if (/^Purpose\s*—/i.test(cell)) cell = "Purpose";
          return ` ${cell} `;
        })
        .join("|")}|`;
      continue;
    }
    let parts = lines[i].split("|");
    const innerCells = parts.slice(1, -1);
    if (innerCells.length === 1 && headerCols >= 2 && innerCells[0].includes(" — ")) {
      const inner = innerCells[0];
      const idx = inner.indexOf(" — ");
      const pieces = [inner.slice(0, idx).trim(), inner.slice(idx + 3).trim()];
      while (pieces.length < headerCols) pieces.push("");
      parts = ["", ...pieces.map((p) => ` ${p} `), ""];
    }
    const asyncCol = currentHeader.findIndex((h) => h === "async");
    for (let j = 1; j < parts.length - 1; j++) {
      let cell = parts[j].replace(/[ \t]{2,}/g, " ").trim();
      if (asyncCol >= 0 && j === asyncCol + 1) {
        const v = cell.toLowerCase();
        if (v === "yes" || v === "true") cell = "yes";
        else if (v === "no" || v === "false") cell = "";
      }
      if (
        !cell.includes("`") &&
        /^[\w.\-]+\.(?:php|js|sql|css|ts|tsx|jsx|py|rb|java|go|c|cpp|h|cs|json|md)$/i.test(cell)
      ) {
        cell = `\`${cell}\``;
      }
      cell = cell.replace(/\s*—\s+/g, ": ").replace(/-{2,}\s*$/, "");
      parts[j] = ` ${cell} `;
    }
    lines[i] = parts.join("|");
  }
  return lines.join("\n");
}
function parseSections(markdown) {
  const sections = [];
  const lines = (markdown || "").split("\n");
  let current = null;
  for (const line of lines) {
    const m = line.match(/^(#{1,3})\s+(.*?)\s*$/);
    if (m) {
      current = { level: m[1].length, title: m[2].trim(), body: [] };
      sections.push(current);
    } else if (current) {
      current.body.push(line);
    }
  }
  return sections;
}
function sectionKey(title) {
  return title
    .toLowerCase()
    .replace(/\s*—.*$/, "")
    .replace(/`/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
function dataRowCount(body) {
  let count = 0;
  for (const line of (body || "").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("```")) continue;
    if (/^\|/.test(t)) {
      const cells = t.split("|").slice(1, -1);
      if (cells.every((c) => /^:?-{2,}:?$/.test(c.trim()))) continue;
      count++;
    } else {
      count++;
    }
  }
  return count;
}
function dedupeRows(body) {
  const seen = new Set();
  const out = [];
  for (const line of body) {
    const t = line.trim();
    if (/^\|/.test(t)) {
      const cells = t.split("|").slice(1, -1);
      if (cells.every((c) => /^:?-{2,}:?$/.test(c.trim()))) {
        out.push(line);
        continue;
      }
      if (seen.has(t)) continue;
      seen.add(t);
    }
    out.push(line);
  }
  return out;
}
function alignSections(text, original) {
  const orig = new Map();
  for (const s of parseSections(original)) {
    const key = sectionKey(s.title);
    if (!orig.has(key)) orig.set(key, s);
  }
  const resultSections = parseSections(text);
  const out = [];
  for (const s of resultSections) {
    const key = sectionKey(s.title);
    const origSection = orig.get(key);
    if (!origSection) continue;
    const cleanTitle = s.title.replace(/\s*—.*$/, "").trim();
    out.push(`${"#".repeat(origSection.level)} ${cleanTitle}`);
    const origBody = origSection.body.join("\n").replace(/^\s+$/g, "");
    let body = s.body;
    if (key === "exports" || key === "css variables") {
      body = dedupeRows(body);
    }
    if (
      key === "project structure" ||
      (dataRowCount(body.join("\n")) <= 1 && origBody.trim())
    ) {
      out.push(origBody);
    } else {
      out.push(...body);
    }
  }
  return out.join("\n");
}
function removeTrailingProse(text) {
  const lines = text.split("\n");
  let lastKeep = -1;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (/^\|/.test(t) || /^#{1,3}\s/.test(t) || t.startsWith("```")) {
      lastKeep = i;
    }
  }
  if (lastKeep === -1) return text;
  return lines.slice(0, lastKeep + 1).join("\n");
}
export { postProcess };
export class AiEnhancer {
  constructor() {
    this.ollama = new Ollama({
      host: process.env.OLLAMA_URL,
    });
    this.model = process.env.OLLAMA_MODEL;
  }
  async enhance(plainText, format = "txt", language = "en") {
    const buildPrompt = format === "md" ? buildPromptMd : buildPromptTxt;
    const rawPrompt = buildPrompt(plainText, language);
    const stream = await this.ollama.generate({
      model: this.model,
      prompt: rawPrompt,
      stream: true,
      think: false,
    });
    const chunks = [];
    for await (const part of stream) {
      chunks.push(part.response);
    }
    const result = chunks.join("");
    return format === "md" ? stripCodeBlock(result) : cleanMarkdown(result);
  }

  async enhanceMarkdown(markdown, language = "en") {
    const prompt = buildMdEnhancer(markdown, language);
    const stream = await this.ollama.generate({
      model: this.model,
      prompt,
      stream: true,
      think: false,
    });
    const chunks = [];
    for await (const part of stream) {
      chunks.push(part.response);
    }
    const result = stripCodeBlock(chunks.join(""));
    return postProcess(result, markdown);
  }
}
