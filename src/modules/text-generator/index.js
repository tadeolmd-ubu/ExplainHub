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

import { readmeFormatter } from "./formatters/md/readme.js";
import { moduleFormatter } from "./formatters/md/modules.js";
import { buildModuleCatalog } from "./moduleCatalog.js";
import { readProjectMetadata } from "./metadata.js";
import { localizeReport } from "./localize.js";

export class TextGenerator {
  generate({
    technologies,
    entryPoints,
    files,
    tree,
    projectPath,
    format = "txt",
    language = "en",
  }) {
    if (format === "md") {
      const generated = this.#generateMarkdown({
        tree,
        technologies,
        entryPoints,
        files,
        projectPath,
      });
      return {
        readme: localizeReport(generated.readme, language, "md"),
        modules: generated.modules.map(module => ({ ...module, content: localizeReport(module.content, language, "md") })),
      };
    }
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
    return localizeReport(sections.filter(Boolean).join("\n\n"), language);
  }
  #generateMarkdown({ technologies, entryPoints, files, tree, projectPath }) {
    const catalog = buildModuleCatalog(files, projectPath);
    const readme = readmeFormatter({
      technologies,
      entryPoints,
      files,
      tree,
      projectPath,
      catalog,
      metadata: readProjectMetadata(projectPath),
    });
    const modules = catalog.map(({ name, label, files }) => ({
      name, content: moduleFormatter({ name: label, files }),
    }));
    return { readme, modules };
  }
}
