import { Parser, Language } from "web-tree-sitter";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RS_WASM = path.resolve(
  __dirname,
  "../../../../node_modules/@vscode/tree-sitter-wasm/wasm/tree-sitter-rust.wasm",
);
const TS_WASM_DIR = path.resolve(
  __dirname,
  "../../../../node_modules/@vscode/tree-sitter-wasm/wasm",
);

let parser = null;

async function getParser() {
  if (parser) return parser;
  await Parser.init();
  const lang = await Language.load(RS_WASM, {
    locateFile: (p) => path.join(TS_WASM_DIR, p),
  });
  parser = new Parser();
  parser.setLanguage(lang);
  return parser;
}
const TYPE_DECLARATIONS = new Set(["struct_item", "enum_item", "trait_item"]);

const HTTP_METHOD_ATTRS = new Set([
  "get",
  "post",
  "put",
  "delete",
  "patch",
  "head",
  "options",
]);

function getUseSource(node) {
  const qn = node.namedChildren.find(
    (c) => c.type === "scoped_identifier" || c.type === "scoped_use_list",
  );
  return qn
    ? qn.text
    : node.text
        .replace(/^use\s+/, "")
        .replace(/;\s*$/, "")
        .trim();
}

function isPublic(node) {
  return node.children.some(
    (c) => c.type === "visibility_modifier" && c.text === "pub",
  );
}

function getAttrArgText(attrNode) {
  const argList = attrNode.namedChildren.find((c) => c.type === "token_tree");
  if (!argList) return "";
  const firstArg = argList.namedChildren[0];
  if (!firstArg) return "";
  const raw = firstArg.text || "";
  return raw.replace(/^["']|["']$/g, "");
}

function extractRoutes(attrListNode, routes) {
  for (const attr of attrListNode.namedChildren) {
    if (attr.type !== "attribute") continue;
    const nameNode = attr.namedChildren.find((c) => c.type === "identifier");
    if (!nameNode) continue;
    const attrName = nameNode.text;
    const cleanPath = getAttrArgText(attr) || "";

    if (HTTP_METHOD_ATTRS.has(attrName)) {
      routes.push({
        method: attrName.toUpperCase(),
        path: cleanPath || "/",
        line: attrListNode.startPosition.row + 1,
      });
    } else if (
      attrName === "Route" ||
      attrName === "route" ||
      attrName === "AcceptVerbs"
    ) {
      routes.push({
        method: "ANY",
        path: cleanPath || "/",
        line: attrListNode.startPosition.row + 1,
      });
    }
  }
}

function getMethodParams(paramList) {
  if (!paramList) return [];
  return paramList.namedChildren
    .filter((p) => p.type === "parameter")
    .map((p) => {
      const nameChild = p.namedChildren.find((c) => c.type === "identifier");
      return nameChild?.text || "param";
    });
}

export async function parseRs(content) {
  const p = await getParser();
  const tree = p.parse(content);
  const root = tree.rootNode;

  const imports = [];
  const functions = [];
  const classes = [];
  const routes = [];
  const exportsList = [];

  function walk(node, parentClass = null) {
    if (node.type === "use_declaration") {
      imports.push({
        source: getUseSource(node),
        alias: null,
        line: node.startPosition.row + 1,
      });
    }

    if (TYPE_DECLARATIONS.has(node.type)) {
      const nameNode = node.childForFieldName("name");
      const name = nameNode?.text || "unknown";
      const kind = node.type.replace("_item", "");

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
        if (child.type === "attribute_list") {
          extractRoutes(child, routes);
        } else {
          walk(child, name);
        }
      }
      return;
    }

    if (node.type === "function_item") {
      const nameNode = node.childForFieldName("name");
      const name = nameNode?.text || "unknown";
      const paramList = node.childForFieldName("parameters");
      const params = getMethodParams(paramList);

      for (const child of node.namedChildren) {
        if (child.type === "attribute_list") {
          extractRoutes(child, routes);
        }
      }

      if (parentClass) {
        const cls = classes.find((c) => c.name === parentClass);
        if (cls) {
          cls.methods.push({ name, params, line: node.startPosition.row + 1 });
        }
      } else {
        functions.push({ name, params, line: node.startPosition.row + 1 });
        if (isPublic(node)) {
          exportsList.push({
            name,
            kind: "function",
            line: node.startPosition.row + 1,
          });
        }
      }
      return;
    }

    if (node.type === "attribute_item") {
      extractRoutes(node, routes);
      return;
    }

    if (node.type === "impl_item") {
      const typeNode = node.namedChildren.find(
        (c) => c.type === "type_identifier",
      );
      const typeName = typeNode?.text || "unknown";
      for (const child of node.namedChildren) walk(child, typeName);
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
