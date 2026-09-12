import { parse } from "smol-toml";
import { toArray } from "./utils.js";

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
