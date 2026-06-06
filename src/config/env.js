function required(name) {
  if (!process.env[name]) throw new Error(`Falta ${name}`);
  return process.env[name];
}
function optional(name, fallback) {
  return process.env[name] || fallback;
}

export const config = {
  get port() { return parseInt(optional("PORT", "3000"), 10); },
  ollama: {
    get url() { return optional("OLLAMA_URL", "http://localhost:11434"); },
    get model() { return optional("OLLAMA_MODEL", ""); },
  },
  redis: {
    get host() { return optional("REDIS_HOST", "127.0.0.1"); },
    get port() { return parseInt(optional("REDIS_PORT", "6379"), 10); },
  },
};

export function validateEnv() {
  if (!config.ollama.model) {
    console.warn("OLLAMA_MODEL no configurado — la IA estará deshabilitada");
  }
}
