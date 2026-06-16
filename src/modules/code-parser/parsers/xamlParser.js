import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

const EVENT_ATTRS = new Set([
  "Click", "Loaded", "Initialized", "TextChanged", "SelectionChanged",
  "Checked", "Unchecked", "MouseDown", "MouseUp", "KeyDown", "KeyUp",
]);

function getAttrs(obj) {
  const attrs = {};
  if (!obj || typeof obj !== "object") return attrs;
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith("@_")) attrs[k.slice(2)] = v;
  }
  return attrs;
}

function getChildren(obj) {
  const children = {};
  if (!obj || typeof obj !== "object") return children;
  for (const [k, v] of Object.entries(obj)) {
    if (!k.startsWith("@_")) children[k] = v;
  }
  return children;
}

export function parseXaml(content) {
  const doc = parser.parse(content);
  const rootKey = Object.keys(doc)[0];
  const root = doc[rootKey] || {};
  const classes = [];
  const uiComponents = [];
  const functions = [];

  const rootAttrs = getAttrs(root);
  const xClass = rootAttrs["x:Class"] || rootAttrs["Class"] || "";
  if (xClass) {
    classes.push({ name: xClass, kind: "xaml", methods: [], line: null });
  }

  function walk(node, parentType = "") {
    if (!node || typeof node !== "object") return;
    for (const [key, val] of Object.entries(node)) {
      if (key.startsWith("@_")) continue;
      const attrs = getAttrs(val);
      const name = attrs["x:Name"] || attrs["Name"] || "";
      if (name) uiComponents.push({ type: key, name, parentType, line: null });
      for (const evt of EVENT_ATTRS) {
        if (attrs[evt]) {
          functions.push({
            name: attrs[evt], kind: "event",
            params: ["sender", "e"], line: null,
          });
        }
      }
      walk(getChildren(val), key);
    }
  }

  walk(getChildren(root));
  return { imports: [], functions, classes, routes: [], exports: [], uiComponents };
}