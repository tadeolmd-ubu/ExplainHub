import { Parser, Language } from "web-tree-sitter";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JAVA_WASM = path.resolve(
  __dirname,
  "../../../../node_modules/@vscode/tree-sitter-wasm/wasm/tree-sitter-java.wasm",
);
const TS_WASM_DIR = path.resolve(
  __dirname,
  "../../../../node_modules/@vscode/tree-sitter-wasm/wasm",
);

let parser = null;

async function getParser() {
  if (parser) return parser;
  await Parser.init();
  const lang = await Language.load(JAVA_WASM, {
    locateFile: (p) => path.join(TS_WASM_DIR, p),
  });
  parser = new Parser();
  parser.setLanguage(lang);
  return parser;
}

const TYPE_DECLARATIONS = new Set([
  "class_declaration",
  "interface_declaration",
  "enum_declaration",
  "record_declaration",
]);

const HTTP_METHOD_ATTRS = new Set([
  "GetMapping",
  "PostMapping",
  "PutMapping",
  "DeleteMapping",
  "PatchMapping",
  "RequestMapping",
]);

function getImportSource(node) {
  const scoped = node.namedChildren.find((c) => c.type === "scoped_identifier");
  return scoped
    ? scoped.text
    : node.text
        .replace(/^import\s+/, "")
        .replace(/;\s*$/, "")
        .trim();
}

function isPublic(node) {
  const mods = node.namedChildren.find((c) => c.type === "modifiers");
  if (!mods) return false;
  return mods.children.some((c) => c.type === "public");
}


function getAttrArgText(attrNode) {
  const argList = attrNode.namedChildren.find(
    (c) => c.type === "annotation_argument_list",
  );
  if (!argList) return "";
  const firstArg = argList.namedChildren[0];
  if (!firstArg) return "";
  const raw = firstArg.text || "";
  return raw.replace(/^["']|["']$/g, "");
}

function extractRoute(annotationNode, routes) {
  const nameNode = annotationNode.namedChildren.find(
    (c) => c.type === "identifier",
  );
  if (!nameNode) return;
  const attrName = nameNode.text;
  const cleanPath = getAttrArgText(annotationNode) || "";

  if (HTTP_METHOD_ATTRS.has(attrName)) {
    const method =
      attrName === "RequestMapping"
        ? "ANY"
        : attrName.replace("Mapping", "").toUpperCase();
    routes.push({
      method,
      path: cleanPath || "/",
      line: annotationNode.startPosition.row + 1,
    });
  }
}

function getMethodParams(paramList) {
  if (!paramList) return [];
  return paramList.namedChildren
    .filter((p) => p.type === "formal_parameter")
    .map((p) => {
      const nameChild = p.childForFieldName("name");
      return nameChild?.text || "param";
    });
}

export async function parseJava(content) {
  const p = await getParser();
  const tree = p.parse(content);
  const root = tree.rootNode;

  const imports = [];
  const functions = [];
  const classes = [];
  const routes = [];
  const exportsList = [];

  function walk(node, parentClass = null) {
    if (node.type === "import_declaration") {
      imports.push({
        source: getImportSource(node),
        alias: null,
        line: node.startPosition.row + 1,
      });
    }

    if (TYPE_DECLARATIONS.has(node.type)) {
      const nameNode = node.childForFieldName("name");
      const name = nameNode?.text || "unknown";
      const kind = node.type.replace("_declaration", "");

      classes.push({
        name,
        kind,
        extends: null,
        methods: [],
        line: node.startPosition.row + 1,
      });

      if (isPublic(node) && !parentClass) {
        exportsList.push({ name, kind, line: node.startPosition.row + 1 });
      }

      for (const child of node.namedChildren) {
        if (child.type === "modifiers") {
          for (const mod of child.namedChildren) {
            if (mod.type === "annotation" || mod.type === "marker_annotation") {
              extractRoute(mod, routes);
            }
          }
        } else {
          walk(child, name);
        }
      }
      return;
    }

    if (node.type === "method_declaration") {
      const nameNode = node.childForFieldName("name");
      const name = nameNode?.text || "unknown";
      const paramList = node.childForFieldName("parameters");
      const params = getMethodParams(paramList);

      for (const child of node.namedChildren) {
        if (child.type === "modifiers") {
          for (const mod of child.namedChildren) {
            if (mod.type === "annotation" || mod.type === "marker_annotation") {
              extractRoute(mod, routes);
            }
          }
        } else {
          walk(child, parentClass || name);
        }
      }

      if (parentClass) {
        const cls = classes.find((c) => c.name === parentClass);
        if (cls) {
          cls.methods.push({ name, params, line: node.startPosition.row + 1 });
        }
      }
      return;
    }

    for (const child of node.namedChildren) {
      walk(child, parentClass);
    }
  }

  walk(root, null);

  return {
    imports,
    functions,
    classes,
    routes,
    exports: exportsList,
  };
}
