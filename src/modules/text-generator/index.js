import { headerFormatter } from "./formatters/txt/headerFormatter.js";
import { statsFormatter } from "./formatters/txt/statsFormatter.js";
import { fileFormatter } from "./formatters/txt/fileFormatter.js";
import { apiFormatter } from "./formatters/txt/apiFormatter.js";
import { dependencyFormatter } from "./formatters/txt/dependencyFormatter.js";
import { alterFormatter } from "./formatters/txt/alterFormatter.js";
import { tablesFormatter } from "./formatters/txt/tablesFormatter.js";
import { viewsFormatter } from "./formatters/txt/viewsFormatter.js";
import { indexesFormatter } from "./formatters/txt/indexesFormatter.js";
import { routinesFormatter } from "./formatters/txt/routinesFormatter.js";
import { triggersFormatter } from "./formatters/txt/triggersFormatter.js";
import { dmlFormatter } from "./formatters/txt/dmlFormatter.js";
import { dropsFormatter } from "./formatters/txt/dropsFormatter.js";
import { commentsFormatter } from "./formatters/txt/commentsFormatter.js";

export class TextGenerator {
  generate({ technologies, entryPoints, files }) {
    const sections = [
      headerFormatter({ technologies, entryPoints }),
      statsFormatter(files),
      ...files.map((file) => fileFormatter(file)),
      apiFormatter(files),
      dependencyFormatter(files),
      alterFormatter(files),
      tablesFormatter(files),
      viewsFormatter(files),
      indexesFormatter(files),
      routinesFormatter(files),
      triggersFormatter(files),
      dmlFormatter(files),
      dropsFormatter(files),
      commentsFormatter(files),
    ];
    return sections.filter(Boolean).join("\n\n");
  }
}
