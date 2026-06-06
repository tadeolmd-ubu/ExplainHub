import { headerFormatter } from "./formatters/headerFormatter.js";
import { statsFormatter } from "./formatters/statsFormatter.js";
import { fileFormatter } from "./formatters/fileFormatter.js";
import { apiFormatter } from "./formatters/apiFormatter.js";
import { dependencyFormatter } from "./formatters/dependencyFormatter.js";
import { alterFormatter } from "./formatters/alterFormatter.js";
import { tablesFormatter } from "./formatters/tablesFormatter.js";
import { viewsFormatter } from "./formatters/viewsFormatter.js";
import { indexesFormatter } from "./formatters/indexesFormatter.js";
import { routinesFormatter } from "./formatters/routinesFormatter.js";
import { triggersFormatter } from "./formatters/triggersFormatter.js";
import { dmlFormatter } from "./formatters/dmlFormatter.js";
import { dropsFormatter } from "./formatters/dropsFormatter.js";
import { commentsFormatter } from "./formatters/commentsFormatter.js";

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
