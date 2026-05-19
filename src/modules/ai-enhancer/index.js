import { Ollama } from "ollama";
import { buildPrompt } from "../ai-enhancer/promt/promt.js";

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
  async enhance(plainText) {
    const prompt = buildPrompt(plainText);
    const stream = await this.ollama.generate({
      model: this.model,
      prompt,
      stream: true,
    });

    const chunks = [];
    for await (const part of stream) {
      chunks.push(part.response);
    }

    return cleanMarkdown(chunks.join(""));
  }
}
