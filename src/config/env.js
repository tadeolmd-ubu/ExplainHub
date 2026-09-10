function optional(name, fallback) {
  return process.env[name] || fallback;
}

export const config = {
  ollama: {
    get url() { return optional("OLLAMA_URL", "http://localhost:11434"); },
    get model() { return optional("OLLAMA_MODEL", ""); },
    get timeoutMs() {
      const value = Number(optional("OLLAMA_TIMEOUT_MS", "60000"));
      return Number.isFinite(value) && value > 0 ? value : 60000;
    },
  },
};

export function validateEnv() {
  if (!config.ollama.model) {
    console.warn("OLLAMA_MODEL no configurado — la IA estará deshabilitada");
  }
}
