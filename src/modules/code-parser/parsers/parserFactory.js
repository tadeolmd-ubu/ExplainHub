import { parseJavaScript } from "./jsParser.js";
import { parseTypeScript } from "./tsParser.js";
import { parseHtml } from "./htmlParser.js";
import { parseCss } from "./cssParser.js";
import { parseSql } from "./sqlParser.js";
import { parsePython } from "./pyParser.js";
import { parsePhp } from "./phpParser.js";
import { parseCs } from "./csParser.js";
import { parseSln } from "./slnParser.js";
import { parseCsproj } from "./csprojParser.js";
import { parseConfig } from "./configParser.js";
import { parseXaml } from "./xamlParser.js";
import { parseRs } from "./rsParser.js";
import { parseJava } from "./javaParser.js";
import { parseGo } from "./goParser.js";
import { parseCPP } from "./cParser.js";
import { parseCargoToml } from "./cargoTomlParser.js";
import { parseCargoLock } from "./cargoLockParser.js";
import { parseRustToolchain } from "./rustToolChainParser.js";
import { parseCargoConfig } from "./cargoConfigParser.js";

const parsers = {
  javascript: parseJavaScript,
  typescript: parseTypeScript,
  markup: parseHtml,
  stylesheet: parseCss,
  sql: parseSql,
  python: parsePython,
  php: parsePhp,
  csharp: parseCs,
  sln: parseSln,
  csproj: parseCsproj,
  config: parseConfig,
  xaml: parseXaml,
  rust: parseRs,
  java: parseJava,
  go: parseGo,
  c: parseCPP,
  cpp: parseCPP,
  cargotoml: parseCargoToml,
  cargolock: parseCargoLock,
  rusttoolchain: parseRustToolchain,
  cargoconfig: parseCargoConfig,
};
export async function parseByType(fileType, content) {
  const parser = parsers[fileType];
  return parser ? await parser(content) : {};
}
