import { Parser, Language } from "web-tree-sitter";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GO_WASM = path.resolve(
  __dirname,
  "../../../../node_modules/@vscode/tree-sitter-wasm/wasm/tree-sitter-go.wasm",
);
const TS_WASM_DIR = path.resolve(
  __dirname,
  "../../../../node_modules/@vscode/tree-sitter-wasm/wasm",
);

let parser = null;
const HTTP_METHOD_ATTRS = new Set([
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
  "HEAD",
  "OPTIONS",
]);

async function getParser() {
  if (parser) return parser;
  await Parser.init();
  const lang = await Language.load(GO_WASM, {
    locateFile: (p) => path.join(TS_WASM_DIR, p),
  });
  parser = new Parser();
  parser.setLanguage(lang);
  return parser;
}

function getImportSource(node) {
  const imports = [];
  const specs = node.namedChildren.flatMap((c) =>
    c.type === "import_spec_list" ? c.namedChildren : [c],
  );
  for (const spec of specs) {
    if (spec.type !== "import_spec") continue;
    const sourceNode = spec.namedChildren.find(
      (c) => c.type === "interpreted_string_literal",
    );
    const aliasNode = spec.namedChildren.find(
      (c) => c.type === "package_identifier",
    );
    imports.push({
      source: sourceNode ? sourceNode.text.replace(/^"|"$/g, "") : spec.text,
      alias: aliasNode?.text || null,
      line: spec.startPosition.row + 1,
    });
  }
  return imports;
}

function isExported(name) {
  return name && name[0] === name[0].toUpperCase();
}

function getMethodParams(paramList) {
  if (!paramList) return [];
  return paramList.namedChildren
    .filter((p) => p.type === "parameter_declaration")
    .map((p) => {
      const nameChild = p.childForFieldName("name");
      return nameChild?.text || "param";
    });
}

export async function parseGo(content) {
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
      for (const imp of getImportSource(node)) {
        imports.push(imp);
      }
    }

    if (node.type === "type_declaration") {
      for (const typeSpec of node.namedChildren) {
        if (typeSpec.type !== "type_spec") continue;

        const nameNode = typeSpec.childForFieldName("name");
        const name = nameNode?.text || "unknown";

        let kind = "type";
        const structBody = typeSpec.namedChildren.find(
          (c) => c.type === "struct_type",
        );
        const interfaceBody = typeSpec.namedChildren.find(
          (c) => c.type === "interface_type",
        );
        if (structBody) kind = "struct";
        else if (interfaceBody) kind = "interface";

        classes.push({
          name,
          kind,
          extends: null,
          methods: [],
          line: typeSpec.startPosition.row + 1,
        });

        if (isExported(name)) {
          exportsList.push({
            name,
            kind,
            line: typeSpec.startPosition.row + 1,
          });
        }

        // Walk struct/interface body para encontrar métodos declarados aparte
        for (const child of typeSpec.namedChildren) {
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

      // Resolver el tipo padre desde el receiver
      const receiverParamList = node.namedChildren.find(
        (c) => c.type === "parameter_list",
      );
      let receiverType = null;
      if (receiverParamList) {
        const paramDecl = receiverParamList.namedChildren.find(
          (c) => c.type === "parameter_declaration",
        );
        if (paramDecl) {
          const typeNode = paramDecl.namedChildren.find(
            (c) => c.type === "type_identifier",
          );
          if (typeNode) {
            receiverType = typeNode.text;
          } else {
            // Podría ser *T → pointer_type → type_identifier
            const ptr = paramDecl.namedChildren.find(
              (c) => c.type === "pointer_type",
            );
            if (ptr) {
              const inner = ptr.namedChildren.find(
                (c) => c.type === "type_identifier",
              );
              receiverType = inner?.text || null;
            }
          }
        }
      }
      if (receiverType) {
        const cls = classes.find((c) => c.name === receiverType);
        if (cls) {
          cls.methods.push({ name, params, line: node.startPosition.row + 1 });
        }
      }
      return;
    }
    if (node.type === "function_declaration") {
      const nameNode = node.childForFieldName("name");
      const name = nameNode?.text || "unknown";
      const paramList = node.childForFieldName("parameters");
      const params = getMethodParams(paramList);
      if (parentClass) {
        const cls = classes.find((c) => c.name === parentClass);
        if (cls) {
          cls.methods.push({ name, params, line: node.startPosition.row + 1 });
        }
      } else {
        functions.push({ name, params, line: node.startPosition.row + 1 });
        if (isExported(name)) {
          exportsList.push({
            name,
            kind: "function",
            line: node.startPosition.row + 1,
          });
        }
      }

      for (const child of node.namedChildren) {
        walk(child, name);
      }
      return;
    }

    if (node.type === "const_declaration" || node.type === "var_declaration") {
      const kind = node.type === "const_declaration" ? "const" : "var";
      for (const spec of node.namedChildren) {
        const specKind = spec.type === "const_spec" ? "const" : "var";
        const nameNode = spec.namedChildren.find(
          (c) => c.type === "identifier",
        );
        const name = nameNode?.text;
        if (name && isExported(name)) {
          exportsList.push({
            name,
            kind: specKind,
            line: spec.startPosition.row + 1,
          });
        }
      }
      return;
    }

    if (node.type === "call_expression") {
      const selector = node.namedChildren.find(
        (c) => c.type === "selector_expression",
      );
      if (!selector) return;
      const methodNode = selector.namedChildren.find(
        (c) => c.type === "field_identifier",
      );
      if (!methodNode) return;
      const method = methodNode.text;
      let httpMethod;
      if (HTTP_METHOD_ATTRS.has(method)) {
        httpMethod = method;
      } else if (method === "Handle" || method === "HandleFunc") {
        httpMethod = "ANY";
      } else {
        return;
      }
      const argList = node.namedChildren.find(
        (c) => c.type === "argument_list",
      );
      const pathNode = argList?.namedChildren.find(
        (c) => c.type === "interpreted_string_literal",
      );
      const path = pathNode ? pathNode.text.replace(/^"|"$/g, "") : "/";
      routes.push({
        method: httpMethod,
        path,
        line: node.startPosition.row + 1,
      });
      return;
    }

    for (const child of node.namedChildren) {
      // ← fallthrough
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
