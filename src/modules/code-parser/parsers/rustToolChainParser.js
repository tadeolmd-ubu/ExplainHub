import { parse } from "smol-toml";

function toArray(obj) {
  if (obj == null) return [];
  return Array.isArray(obj) ? obj : [obj];
}

function extractToolchain(doc) {
  const toolchain = doc.toolchain;
  if (!toolchain) return null;
  return {
    channel: toolchain.channel || "",
    components: toArray(toolchain.components),
    targets: toArray(toolchain.targets),
    profile: toolchain.profile || "",
  };
}

export async function parseRustToolchain(content) {
  try {
    const doc = parse(content);

    return {
      imports: [],
      functions: [],
      classes: [],
      routes: [],
      exports: [],
      toolchain: extractToolchain(doc),
    };
  } catch {
    return {
      imports: [],
      functions: [],
      classes: [],
      routes: [],
      exports: [],
      toolchain: null,
    };
  }
}
