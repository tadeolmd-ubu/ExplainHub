import { headerFormatter } from "./formatters/headerFormatter.js";
import { statsFormatter } from "./formatters/statsFormatter.js";
import { fileFormatter } from "./formatters/fileFormatter.js";
import { apiFormatter } from "./formatters/apiFormatter.js";
import { dependencyFormatter } from "./formatters/dependencyFormatter.js";

export class TextGenerator {
  generate({ technologies, entryPoints, files }) {
    const sections = [
      headerFormatter({ technologies, entryPoints }),
      statsFormatter(files),
      ...files.map((file) => fileFormatter(file)),
      apiFormatter(files),
      dependencyFormatter(files),
    ];
    return sections.filter(Boolean).join("\n\n");
  }
}
