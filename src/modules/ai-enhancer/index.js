import { Ollama } from "ollama";
import { buildPromptTxt } from "./prompt/promptTxt.js";
import { buildPromptMd } from "./prompt/promptMd.js";
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

export class AiEnhancer {
  constructor() {
    this.ollama = new Ollama({
      host: process.env.OLLAMA_URL,
    });
    this.model = process.env.OLLAMA_MODEL;
  }
  async enhance(plainText, format = "txt") {
    const buildPrompt = format === "md" ? buildPromptMd : buildPromptTxt;
    const rawPrompt = buildPrompt(plainText);
    const stream = await this.ollama.generate({
      model: this.model,
      prompt: rawPrompt,
      stream: true,
    });
    const chunks = [];
    for await (const part of stream) {
      chunks.push(part.response);
    }
    const result = chunks.join("");
    return format === "md" ? result : cleanMarkdown(result);
  }
}

