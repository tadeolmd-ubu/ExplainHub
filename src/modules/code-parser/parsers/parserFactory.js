import { parseJavaScript } from "./jsParser.js";
import { parseTypeScript } from "./tsParser.js";
import { parseHtml } from "./htmlParser.js";
import { parseCss } from "./cssParser.js";

const parsers = {
  javascript: parseJavaScript,
  typescript: parseTypeScript,
  markup: parseHtml,
  stylesheet: parseCss,
};
export function parseByType(fileType, content) {
  const parser = parsers[fileType];
  return parser ? parser(content) : {};
}
