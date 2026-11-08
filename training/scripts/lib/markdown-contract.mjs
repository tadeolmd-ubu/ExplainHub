/**
 * Markdown contract checks for the ExplainHub documentation enhancer dataset.
 *
 * The enhancer prompt (src/modules/ai-enhancer/prompt/promptMdEnhancer.js)
 * tells the model to improve prose and add descriptions, but never to invent
 * files, drop sections, or grow tables. A human correction that breaks those
 * rules is not a valid training target, because the model would learn the
 * wrong contract. These helpers compare a raw generated document with its
 * corrected version and report concrete, actionable diffs.
 */

const TABLE_SECTION_KEYS = new Set([
  "file structure",
  "modules",
  "functions",
  "routes",
  "exports",
]);

const ALLOWED_APPENDED_COLUMNS = {
  functions: ["description"],
  routes: ["params"],
};

export function normalizeHeading(title) {
  return String(title)
    .replace(/\s*[—–].*$/, "")
    .replace(/`/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Split Markdown into level 1-3 headings while ignoring headings inside
 * fenced code blocks. The production parser does not skip fences, but the
 * project tree and code samples are fenced and may contain `#` comments, so
 * skipping fences makes the checks safer without changing real documents.
 */
export function splitSections(markdown) {
  const lines = String(markdown).replace(/\r\n/g, "\n").split("\n");
  const sections = [];
  let current = null;
  let inFence = false;

  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      if (current) current.body.push(line);
      continue;
    }

    if (!inFence) {
      const match = line.match(/^(#{1,3})\s+(.*?)\s*$/);
      if (match) {
        current = {
          level: match[1].length,
          title: match[2].trim(),
          body: [],
        };
        sections.push(current);
        continue;
      }
    }

    if (current) current.body.push(line);
  }

  return sections;
}

export function headingSequence(markdown) {
  return splitSections(markdown).map(
    (section) => `${section.level}:${normalizeHeading(section.title)}`,
  );
}

export function findSection(markdown, normalizedTitle) {
  return splitSections(markdown).find(
    (section) => normalizeHeading(section.title) === normalizedTitle,
  );
}

/**
 * Return the first Markdown table in a section body, without the separator
 * row. Table cells are trimmed; escaped pipes inside cells are not supported
 * (the generated docs never emit them).
 */
export function firstTable(bodyLines) {
  const lines = (Array.isArray(bodyLines) ? bodyLines.join("\n") : String(bodyLines))
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const isTableLine = (line) => /^\|.*\|$/.test(line);
  const start = lines.findIndex(isTableLine);
  if (start === -1) return null;

  const tableLines = [];
  for (let index = start; index < lines.length; index += 1) {
    if (!isTableLine(lines[index])) break;
    tableLines.push(lines[index]);
  }

  const parsed = tableLines.map((line) =>
    line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim()),
  );
  const isSeparator = (cells) => cells.every((cell) => /^:?-{2,}:?$/.test(cell));
  const headerIndex = parsed.findIndex((cells) => !isSeparator(cells));
  if (headerIndex === -1) return null;

  const header = parsed[headerIndex];
  const rows = parsed
    .slice(headerIndex + 1)
    .filter((cells) => !isSeparator(cells) && cells.some((cell) => cell !== ""));

  return { header, rows };
}

export function tableForSection(markdown, normalizedTitle) {
  const section = findSection(markdown, normalizedTitle);
  return section ? firstTable(section.body) : null;
}

export function tableColumn(table, name) {
  if (!table) return -1;
  const wanted = name.toLowerCase();
  return table.header.findIndex((cell) => cell.toLowerCase() === wanted);
}

export function fileNamesFromTable(table) {
  if (!table) return new Set();
  const fileColumn = tableColumn(table, "file");
  const index = fileColumn === -1 ? 0 : fileColumn;
  const names = new Set();

  for (const row of table.rows) {
    const raw = row[index] || "";
    const code = raw.match(/`([^`]+)`/g);
    const values = code ? code.map((item) => item.slice(1, -1)) : [raw];
    for (const value of values) {
      const name = value.trim().split("/").pop();
      if (name) names.add(name);
    }
  }

  return names;
}

/**
 * The description is the text between the document title and the first
 * level-2 heading. Tables, code fences, and list markers are ignored so a
 * document that only has a table under the title is not mistaken for prose.
 */
export function documentDescription(markdown) {
  const sections = splitSections(markdown);
  if (sections.length === 0) return "";

  return sections[0].body
    .filter((line) => !/^\s*\|/.test(line))
    .filter((line) => !/^\s*```/.test(line))
    .map((line) => line.replace(/^[-*+]\s+/, "").trim())
    .filter(Boolean)
    .join(" ")
    .trim();
}

export function hasDescription(markdown, minWords = 10) {
  const description = documentDescription(markdown);
  if (!description) return false;
  const words = description.split(/\s+/).filter(Boolean);
  return words.length >= minWords;
}

function isSubset(small, large) {
  for (const value of small) {
    if (!large.has(value)) return false;
  }
  return true;
}

function sameList(left, right) {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function describeList(list) {
  return list.length === 0 ? "(none)" : list.join(", ");
}

/**
 * Compare a raw generated document with its corrected target.
 *
 * Errors block the row from entering the dataset (unless the caller ignores
 * them). Warnings are quality hints that do not change the contract.
 */
export function checkCorrection(raw, corrected, { kind = "readme" } = {}) {
  const errors = [];
  const warnings = [];
  const rawHeadings = headingSequence(raw);
  const correctedHeadings = headingSequence(corrected);

  if (!sameList(rawHeadings, correctedHeadings)) {
    errors.push(
      [
        "Heading sequence changed.",
        `  raw:       ${describeList(rawHeadings)}`,
        `  corrected: ${describeList(correctedHeadings)}`,
        "The enhancer may improve prose but must keep every heading, in order, without adding or removing sections.",
      ].join("\n"),
    );
  }

  for (const key of TABLE_SECTION_KEYS) {
    const rawTable = tableForSection(raw, key);
    const correctedTable = tableForSection(corrected, key);
    if (!rawTable) continue;

    if (!correctedTable) {
      errors.push(`The "${key}" table disappeared from the corrected document.`);
      continue;
    }

    const rawRows = rawTable.rows.length;
    const correctedRows = correctedTable.rows.length;

    if (key === "exports") {
      if (correctedRows > rawRows) {
        errors.push(
          `The "exports" table grew from ${rawRows} to ${correctedRows} rows. Remove invented or duplicate rows.`,
        );
      }
    } else if (correctedRows !== rawRows) {
      errors.push(
        `The "${key}" table changed from ${rawRows} to ${correctedRows} rows. Only the prompt's allowed edits are permitted.`,
      );
    }

    const allowed = ALLOWED_APPENDED_COLUMNS[key];
    if (allowed) {
      const expected = [
        ...rawTable.header.map((cell) => cell.toLowerCase()),
        ...allowed,
      ];
      const actual = correctedTable.header.map((cell) => cell.toLowerCase());
      const validPrefix =
        actual.length === expected.length &&
        expected.every((cell, index) => actual[index] === cell);
      if (!validPrefix) {
        errors.push(
          `The "${key}" table header must be [${rawTable.header.join(", ")}${allowed
            .map((column) => `, ${column}`)
            .join("")}] (got [${correctedTable.header.join(", ")}]).`,
        );
      }
    } else if (
      rawTable.header.length !== correctedTable.header.length ||
      rawTable.header.some(
        (cell, index) =>
          cell.toLowerCase() !== correctedTable.header[index].toLowerCase(),
      )
    ) {
      errors.push(
        `The "${key}" table header must stay [${rawTable.header.join(", ")}] (got [${correctedTable.header.join(", ")}]).`,
      );
    }
  }

  const rawFiles = fileNamesFromTable(tableForSection(raw, "file structure"));
  const correctedFiles = fileNamesFromTable(
    tableForSection(corrected, "file structure"),
  );
  if (rawFiles.size > 0 && !isSubset(correctedFiles, rawFiles)) {
    const invented = [...correctedFiles].filter((name) => !rawFiles.has(name));
    errors.push(
      `The corrected File Structure table adds unknown files: ${invented.join(", ")}.`,
    );
  }

  for (const section of splitSections(corrected)) {
    if (/[—–]/.test(section.title)) {
      warnings.push(
        `Heading "${section.title}" kept a suffix after a dash. Production postProcess strips it, so the model may learn a heading shape that is rewritten at inference time.`,
      );
    }
  }

  if (!hasDescription(corrected)) {
    const label = kind === "module" ? "module" : "README";
    errors.push(
      `The corrected ${label} has no 1-2 sentence prose description between its title and the first ## section.`,
    );
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    stats: {
      headings: rawHeadings.length,
      chars: corrected.length,
      files: rawFiles.size,
    },
  };
}

export { TABLE_SECTION_KEYS };
