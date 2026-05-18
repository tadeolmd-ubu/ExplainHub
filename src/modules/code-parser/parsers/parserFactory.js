import { parseJavaScript } from "./jsParser.js";

const parsers = {
  javascript: parseJavaScript,
  typescript: parseJavaScript,
};
export function parseByType(fileType, content) {
  const parser = parsers[fileType];
  return parser ? parser(content) : {};
}