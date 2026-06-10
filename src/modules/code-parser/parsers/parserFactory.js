import { parseJavaScript } from "./jsParser.js";
import { parseTypeScript } from "./tsParser.js";
import { parseHtml } from "./htmlParser.js";
import { parseCss } from "./cssParser.js";
import { parseSql } from "./sqlParser.js";
import { parsePython } from "./pyParser.js";
const parsers = {
  javascript: parseJavaScript,
  typescript: parseTypeScript,
  markup: parseHtml,
  stylesheet: parseCss,
  sql: parseSql,
  python: parsePython,
};
export async function parseByType(fileType, content) {
  const parser = parsers[fileType];
  return parser ? await parser(content) : {};
}
