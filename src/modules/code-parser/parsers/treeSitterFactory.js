import { Parser, Language } from "web-tree-sitter";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TS_WASM_DIR = path.resolve(
  __dirname,
  "../../../../node_modules/@vscode/tree-sitter-wasm/wasm",
);

const parsers = new Map();

export async function getTreeSitterParser(wasmPath) {
  if (parsers.has(wasmPath)) return parsers.get(wasmPath);
  await Parser.init();
  const lang = await Language.load(wasmPath, {
    locateFile: (p) => path.join(TS_WASM_DIR, p),
  });
  const parser = new Parser();
  parser.setLanguage(lang);
  parsers.set(wasmPath, parser);
  return parser;
}
