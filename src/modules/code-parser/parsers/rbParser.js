import { Parser, Language } from "web-tree-sitter";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RB_WASM = path.resolve(
  __dirname,
  "../../../../node_modules/@vscode/tree-sitter-wasm/wasm/tree-sitter-ruby.wasm",
);
const TS_WASM_DIR = path.resolve(
  __dirname,
  "../../../../node_modules/@vscode/tree-sitter-wasm/wasm",
);

let parser = null;

const IMPORT_CALLS = new Set(["require", "require_relative", "load"]);
const HTTP_METHODS = new Set([
  "get",
  "post",
  "put",
  "delete",
  "patch",
  "head",
  "options",
]);

async function getParser() {
  if (parser) return parser;
  await Parser.init();
  const lang = await Language.load(RB_WASM, {
    locateFile: (p) => path.join(TS_WASM_DIR, p),
  });
  parser = new Parser();
  parser.setLanguage(lang);
  return parser;
}

function getMethodName(node) {
  const nameNode = node.childForFieldName("name");
  return nameNode?.text || "unknown";
}

function getMethodParams(node) {
  const params = [];
  const paramList = node.childForFieldName("parameters");
  if (!paramList) return params;
  for (const child of paramList.namedChildren) {
    if (child.type === "identifier" || child.type === "optional_parameter") {
      params.push(child.text.split("=")[0].trim());
    }
  }
  return params;
}

function extractCallName(node) {
  const receiver = node.childForFieldName("receiver");
  if (receiver) return null;
  const methodNode = node.childForFieldName("method");
  return methodNode?.text || null;
}

function extractStringArg(node) {
  const args = node.childForFieldName("arguments");
  if (!args) return null;
  const first = args.namedChildren[0];
  if (first?.type === "string" || first?.type === "simple_string") {
    return first.text.replace(/^["']|["']$/g, "");
  }
  if (first?.type === "string_array") {
    return first.text.replace(/^\[|\]$/g, "").replace(/^["']|["']$/g, "");
  }
  return null;
}

function extractRoutePath(node) {
  const args = node.childForFieldName("arguments");
  if (!args) return "/";
  const first = args.namedChildren[0];
  if (first?.type === "string" || first?.type === "simple_string") {
    return first.text.replace(/^["']|["']$/g, "");
  }
  if (first?.type === "identifier") {
    return `:${first.text}`;
  }
  return "/";
}

function isTopLevel(node) {
  let current = node.parent;
  while (current) {
    if (
      current.type === "class" ||
      current.type === "module" ||
      current.type === "method" ||
      current.type === "singleton_method"
    ) {
      return false;
    }
    current = current.parent;
  }
  return true;
}

function extractMethods(node) {
  const methods = [];
  for (const child of node.namedChildren) {
    if (child.type === "method") {
      methods.push({
        name: getMethodName(child),
        params: getMethodParams(child),
        line: child.startPosition.row + 1,
      });
    } else if (child.type === "singleton_method") {
      const nameNode = child.childForFieldName("name");
      methods.push({
        name: nameNode?.text || "unknown",
        params: getMethodParams(child),
        line: child.startPosition.row + 1,
      });
    }
  }
  return methods;
}

export async function parseRb(content) {
  const p = await getParser();
  const tree = p.parse(content);
  const root = tree.rootNode;

  const imports = [];
  const functions = [];
  const classes = [];
  const routes = [];
  const exportsList = [];

  function walk(node) {
    if (node.type === "call") {
      const callName = extractCallName(node);
      if (callName && IMPORT_CALLS.has(callName)) {
        const source = extractStringArg(node);
        if (source) {
          imports.push({
            source,
            alias: null,
            line: node.startPosition.row + 1,
          });
        }
        return;
      }
      if (callName && HTTP_METHODS.has(callName)) {
        routes.push({
          method: callName.toUpperCase(),
          path: extractRoutePath(node),
          line: node.startPosition.row + 1,
        });
        return;
      }
    }

    if (node.type === "class") {
      const nameNode = node.childForFieldName("name");
      const name = nameNode?.text || "unknown";
      const superclass = node.namedChildren.find(
        (c) => c.type === "superclass",
      );
      let extends_ = null;
      if (superclass) {
        const superName = superclass.namedChildren.find(
          (c) => c.type === "constant",
        );
        extends_ = superName?.text || null;
      }
      const methods = extractMethods(node);
      classes.push({
        name,
        kind: "class",
        extends: extends_,
        methods,
        line: node.startPosition.row + 1,
      });
      for (const child of node.namedChildren) {
        walk(child);
      }
      return;
    }

    if (node.type === "module") {
      const nameNode = node.childForFieldName("name");
      const name = nameNode?.text || "unknown";
      const methods = extractMethods(node);
      if (methods.length > 0) {
        classes.push({
          name,
          kind: "module",
          extends: null,
          methods,
          line: node.startPosition.row + 1,
        });
      }
      for (const child of node.namedChildren) {
        walk(child);
      }
      return;
    }

    if (node.type === "method") {
      if (isTopLevel(node)) {
        functions.push({
          name: getMethodName(node),
          params: getMethodParams(node),
          line: node.startPosition.row + 1,
        });
      }
    }

    for (const child of node.namedChildren) {
      walk(child);
    }
  }

  walk(root);

  return {
    imports,
    functions,
    classes,
    routes,
    exports: exportsList,
  };
}
