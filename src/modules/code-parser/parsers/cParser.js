import { Parser, Language } from "web-tree-sitter";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CPP_WASM = path.resolve(
  __dirname,
  "../../../../node_modules/@vscode/tree-sitter-wasm/wasm/tree-sitter-cpp.wasm",
);
const TS_WASM_DIR = path.resolve(
  __dirname,
  "../../../../node_modules/@vscode/tree-sitter-wasm/wasm",
);

let parser = null;

async function getParser() {
  if (parser) return parser;
  await Parser.init();
  const lang = await Language.load(CPP_WASM, {
    locateFile: (p) => path.join(TS_WASM_DIR, p),
  });
  parser = new Parser();
  parser.setLanguage(lang);
  return parser;
}

const TYPE_SPECIFIERS = new Set([
  "class_specifier",
  "struct_specifier",
  "union_specifier",
]);

function getMethodParams(paramList) {
  if (!paramList) return [];
  return paramList.namedChildren
    .filter((p) => p.type === "parameter_declaration")
    .map((p) => {
      const nameChild = p.childForFieldName("name");
      return nameChild?.text || "param";
    });
}

export async function parseCPP(content) {
  const p = await getParser();
  const tree = p.parse(content);
  const root = tree.rootNode;

  const imports = [];
  const functions = [];
  const routes = [];
  const classes = [];
  const exportsList = [];

  function walk(node, parentClass = null) {
    if (node.type === "preproc_include") {
      const pathNode = node.namedChildren.find(
        (c) => c.type === "system_lib_string" || c.type === "string_literal",
      );
      const source = pathNode
        ? pathNode.text.replace(/^[<"]|[">]$/g, "")
        : node.text;
      imports.push({ source, alias: null, line: node.startPosition.row + 1 });
    }

    if (node.type === "namespace_definition") {
      const nameNode = node.childForFieldName("name");
      const ns = nameNode?.text || "unknown";
      for (const child of node.namedChildren) {
        walk(child, parentClass ? parentClass : ns);
      }
      return;
    }

    if (node.type === "template_declaration") {
      for (const child of node.namedChildren) {
        walk(child, parentClass);
      }
      return;
    }

    if (TYPE_SPECIFIERS.has(node.type)) {
      const nameNode = node.childForFieldName("name");
      const name = nameNode?.text || "unknown";
      const kind =
        node.type === "class_specifier"
          ? "class"
          : node.type === "struct_specifier"
            ? "struct"
            : "union";

      let inherits = null;
      if (node.type === "class_specifier") {
        const baseClause = node.namedChildren.find(
          (c) => c.type === "base_class_clause",
        );
        if (baseClause) {
          inherits =
            baseClause.namedChildren
              .filter((c) => c.type === "type_identifier")
              .map((c) => c.text)
              .join(", ") || null;
        }
      }

      classes.push({
        name,
        kind,
        inherits,
        methods: [],
        line: node.startPosition.row + 1,
      });

      if (!parentClass && !parentClass?.includes("::")) {
        exportsList.push({ name, kind, line: node.startPosition.row + 1 });
      }

      for (const child of node.namedChildren) {
        walk(child, name);
      }
      return;
    }

    if (node.type === "enum_specifier") {
      const nameNode = node.childForFieldName("name");
      const name = nameNode?.text || "unknown";

      classes.push({
        name,
        kind: "enum",
        inherits: null,
        methods: [],
        line: node.startPosition.row + 1,
      });

      if (!parentClass) {
        exportsList.push({
          name,
          kind: "enum",
          line: node.startPosition.row + 1,
        });
      }
      return;
    }

    if (node.type === "function_definition") {
      const declarator = node.namedChildren.find(
        (c) => c.type === "function_declarator",
      );
      if (!declarator) return;

      const nameNode = declarator.childForFieldName("declarator");
      const name = nameNode?.text || "unknown";

      const paramList = declarator.namedChildren.find(
        (c) => c.type === "parameter_list",
      );
      const params = getMethodParams(paramList);

      if (parentClass) {
        const cls = classes.find((c) => c.name === parentClass);
        if (cls) {
          cls.methods.push({ name, params, line: node.startPosition.row + 1 });
        }
      } else {
        functions.push({ name, params, line: node.startPosition.row + 1 });
        exportsList.push({
          name,
          kind: "function",
          line: node.startPosition.row + 1,
        });
      }
      return;
    }

    if (node.type === "field_declaration") {
      const declarator = node.namedChildren.find(
        (c) => c.type === "function_declarator",
      );
      if (declarator) {
        const nameNode = declarator.childForFieldName("declarator");
        const name = nameNode?.text || "unknown";
        const paramList = declarator.namedChildren.find(
          (c) => c.type === "parameter_list",
        );
        const params = getMethodParams(paramList);
        if (parentClass) {
          const cls = classes.find((c) => c.name === parentClass);
          if (cls) {
            cls.methods.push({
              name,
              params,
              line: node.startPosition.row + 1,
            });
          }
        }
        return;
      }

      // Data fields
      const fieldName = node.namedChildren.find(
        (c) => c.type === "field_identifier",
      );
      if (fieldName && parentClass) {
        const cls = classes.find((c) => c.name === parentClass);
        if (cls) {
          if (!cls.fields) cls.fields = [];
          cls.fields.push(fieldName.text);
        }
      }
      return;
    }

    if (node.type === "preproc_def") {
      const nameNode = node.childForFieldName("name");
      const name = nameNode?.text;
      if (name) {
        exportsList.push({
          name,
          kind: "define",
          line: node.startPosition.row + 1,
        });
      }
      return;
    }

    if (node.type === "type_definition") {
      const typeNode = node.namedChildren.find(
        (c) => c.type === "type_identifier",
      );
      const name = typeNode?.text;
      if (name) {
        exportsList.push({
          name,
          kind: "type",
          line: typeNode.startPosition.row + 1,
        });
      }
      return;
    }

    if (node.type === "declaration" && !parentClass) {
      const declarator = node.namedChildren.find(
        (c) => c.type === "function_declarator",
      );
      if (declarator) {
        const nameNode = declarator.childForFieldName("declarator");
        const name = nameNode?.text || "unknown";
        if (!functions.some((f) => f.name === name)) {
          const paramList = declarator.namedChildren.find(
            (c) => c.type === "parameter_list",
          );
          const params = getMethodParams(paramList);
          functions.push({ name, params, line: node.startPosition.row + 1 });
          exportsList.push({
            name,
            kind: "function",
            line: node.startPosition.row + 1,
          });
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
