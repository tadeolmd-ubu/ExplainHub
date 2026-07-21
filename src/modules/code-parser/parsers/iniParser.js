import { Parser, Language } from "web-tree-sitter";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INI_WASM = path.resolve(
  __dirname,
  "../../../../node_modules/@vscode/tree-sitter-wasm/wasm/tree-sitter-ini.wasm",
);
const TS_WASM_DIR = path.resolve(
  __dirname,
  "../../../../node_modules/@vscode/tree-sitter-wasm/wasm",
);

let parser = null;

async function getParser() {
  if (parser) return parser;
  await Parser.init();
  const lang = await Language.load(INI_WASM, {
    locateFile: (p) => path.join(TS_WASM_DIR, p),
  });
  parser = new Parser();
  parser.setLanguage(lang);
  return parser;
}

function extractSections(root) {
  const sections = [];
  for (const child of root.namedChildren) {
    if (child.type === "section") {
      const nameNode = child.namedChildren.find(
        (c) => c.type === "section_name" || c.type === "key",
      );
      const name = nameNode?.text || "default";
      const keys = [];
      for (const pair of child.namedChildren) {
        if (pair.type === "pair" || pair.type === "assignment") {
          const keyNode = pair.namedChildren.find(
            (c) => c.type === "key" || c.type === "identifier",
          );
          const valueNode = pair.namedChildren.find(
            (c) => c.type === "value" || c.type === "string" || c.type === "integer" || c.type === "float" || c.type === "bool",
          );
          if (keyNode) {
            keys.push({
              key: keyNode.text,
              value: valueNode?.text || "",
            });
          }
        }
      }
      sections.push({ name, keys });
    }
  }
  return sections;
}

export async function parseIni(content) {
  const p = await getParser();
  const tree = p.parse(content);
  const root = tree.rootNode;

  const sections = extractSections(root);

  return {
    imports: [],
    functions: [],
    classes: [],
    routes: [],
    exports: [],
    sections,
  };
}
