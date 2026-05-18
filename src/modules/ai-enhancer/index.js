import { Ollama } from "ollama";
import { buildPrompt } from "../ai-enhancer/promt/promt.js";

export class AiEnhancer {
  constructor() {
    this.ollama = new Ollama({
      host: process.env.OLLAMA_URL,
    });
    this.model = process.env.OLLAMA_MODEL;
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
