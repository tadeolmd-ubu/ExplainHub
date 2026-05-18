import { Ollama } from "ollama";
import { buildPrompt } from "../ai-enhancer/promt/promt.js";

export class AiEnhancer {
  constructor() {
    this.ollama = new Ollama({
      host: process.env.OLLAMA_URL || "http://127.0.0.1:11434",
    });
    this.model = process.env.OLLAMA_MODEL || "qwen3.5";
  }
  async enhance(plainText) {
    const prompt = buildPrompt(plainText);
    return this.ollama.generate({
      model: this.model,
      prompt,
      stream: true,
    });
  }
}
