import { Ollama } from "ollama";
import { config } from "../../config/env.js";
import { buildPromptTxt } from "./prompt/promptTxt.js";
import { buildMdEnhancer } from "./prompt/promptMdEnhancer.js";

export function postProcess(text, original = "") {
  // Never infer which paragraphs or repeated headings are expendable.
  const content = text.trim() || original.trim();
  return content ? content + "\n" : "";
}

export class AiEnhancer {
  constructor({ client, model = config.ollama.model, timeoutMs = config.ollama.timeoutMs } = {}) {
    this.ollama = client || new Ollama({ host: config.ollama.url });
    this.model = model;
    this.timeoutMs = timeoutMs;
  }

  async generate(prompt, format) {
    if (!this.model) throw new Error("AI model is not configured");
    if (prompt.length > 120000) throw new Error("AI input exceeds context budget");
    let timer;
    let cancelled = false;
    const request = (async () => {
      const stream = await this.ollama.generate({ model: this.model, prompt, stream: true, think: false, ...(format ? { format } : {}) });
      if (cancelled) { stream.abort?.(); throw new Error("AI generation timed out"); }
      let text = "";
      for await (const part of stream) {
        text += part.response || "";
        if (text.length > 1024 * 1024) {
          stream.abort?.();
          this.ollama.abort?.();
          throw new Error("AI output exceeds size limit");
        }
      }
      if (!text.trim()) throw new Error("AI returned an empty response");
      return text;
    })();
    try {
      return await Promise.race([request, new Promise((_, reject) => {
        timer = setTimeout(() => {
          cancelled = true;
          this.ollama.abort?.();
          reject(new Error("AI generation timed out"));
        }, this.timeoutMs);
      })]);
    } finally {
      clearTimeout(timer);
    }
  }

  async enhance(plainText, format = "txt", language = "en") {
    if (format === "md") return this.enhanceMarkdown(plainText, language);
    return (await this.generate(buildPromptTxt(plainText, language))).trim();
  }

  async enhanceMarkdown(markdown, language = "en") {
    const raw = await this.generate(buildMdEnhancer(markdown, language), {
      type: "object", properties: { description: { type: "string" } }, required: ["description"], additionalProperties: false,
    });
    const parsed = JSON.parse(raw);
    if (typeof parsed.description !== "string" || !parsed.description.trim()) throw new Error("AI description is missing");
    // Keep all extracted facts intact. AI contributes only an explicitly labeled narrative.
    const description = parsed.description.trim().replace(/\s+/g, " ").replace(/[<>#`|]/g, "");
    const label = language === "es" ? "Descripción generada por IA" : "AI-generated description";
    const lines = markdown.split("\n");
    lines.splice(lines[0]?.startsWith("# ") ? 1 : 0, 0, "", `> ${label}: ${description}`, "");
    return postProcess(lines.join("\n"));
  }
}
