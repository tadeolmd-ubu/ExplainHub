/**
 * Metrics for comparing a model's enhanced Markdown with the human correction.
 *
 * These are deliberately structural first (did the model keep the document
 * contract?) and textual second (how close is the prose to the correction?).
 * A model that writes beautiful prose while inventing files is worse than one
 * that stays faithful, which is exactly what the production prompt demands.
 */

import {
  hasDescription,
  headingSequence,
  fileNamesFromTable,
  tableForSection,
} from "./markdown-contract.mjs";

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "are",
  "was",
  "were",
  "has",
  "have",
  "had",
  "not",
  "but",
  "you",
  "can",
  "will",
  "into",
  "its",
  "their",
  "they",
  "them",
  "then",
  "than",
  "when",
  "where",
  "which",
  "while",
  "also",
  "each",
  "every",
  "all",
  "any",
  "one",
  "two",
  "use",
  "used",
  "using",
  "via",
  "per",
  "such",
  "these",
  "those",
  "there",
  "here",
  "been",
  "being",
  "does",
  "did",
  "doing",
  "about",
  "over",
  "under",
  "after",
  "before",
  "between",
  "through",
  "only",
  "more",
  "most",
  "some",
  "other",
  "same",
  "new",
  "may",
  "should",
  "must",
  "would",
  "could",
]);

function words(text) {
  return String(text)
    .toLowerCase()
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`/g, " ")
    .replace(/[^a-z0-9_./-]+/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

function wordSet(text) {
  return new Set(words(text));
}

function jaccard(left, right) {
  if (left.size === 0 && right.size === 0) return 1;
  let intersection = 0;
  for (const value of left) if (right.has(value)) intersection += 1;
  const union = left.size + right.size - intersection;
  return union === 0 ? 1 : intersection / union;
}

function headingSet(markdown) {
  return new Set(headingSequence(markdown));
}

function sectionRecall(reference, candidate) {
  const expected = headingSet(reference);
  const actual = headingSet(candidate);
  if (expected.size === 0) return 1;
  let found = 0;
  for (const heading of expected) if (actual.has(heading)) found += 1;
  return found / expected.size;
}

function tableRows(markdown, key) {
  const table = tableForSection(markdown, key);
  return table;
}

function rowsMatch(referenceTable, candidateTable) {
  if (!referenceTable && !candidateTable) return 1;
  if (!referenceTable || !candidateTable) return 0;
  return referenceTable.rows.length === candidateTable.rows.length ? 1 : 0;
}

/**
 * scoreRow compares the post-processed candidate with the human correction.
 * `raw` is used for the "did not invent files" checks and for the Modules
 * table shape. `reference` is the human correction. `candidate` is what the
 * model produced after the production postProcess.
 */
export function scoreRow({ raw, reference, candidate }) {
  const referenceHeadings = headingSequence(reference);
  const candidateHeadings = headingSequence(candidate);
  const headingsMatch =
    referenceHeadings.length === candidateHeadings.length &&
    referenceHeadings.every(
      (heading, index) => heading === candidateHeadings[index],
    )
      ? 1
      : 0;

  const rawFiles = fileNamesFromTable(tableForSection(raw, "file structure"));
  const referenceFiles = fileNamesFromTable(
    tableForSection(reference, "file structure"),
  );
  const candidateFiles = fileNamesFromTable(
    tableForSection(candidate, "file structure"),
  );

  const rawFileStructure = tableRows(raw, "file structure");
  const referenceFileStructure = tableRows(reference, "file structure");
  const candidateFileStructure = tableRows(candidate, "file structure");

  const referenceModules = tableRows(reference, "modules");
  const candidateModules = tableRows(candidate, "modules");

  const rawExports = tableRows(raw, "exports");
  const candidateExports = tableRows(candidate, "exports");

  let exportsNotIncreased = 1;
  if (Boolean(rawExports) !== Boolean(candidateExports)) {
    exportsNotIncreased = 0;
  } else if (rawExports && candidateExports) {
    exportsNotIncreased =
      candidateExports.rows.length <= rawExports.rows.length ? 1 : 0;
  }

  const inventedFiles = [...candidateFiles].filter(
    (name) => !rawFiles.has(name) && !referenceFiles.has(name),
  ).length;

  const metrics = {
    headingsMatch,
    sectionRecall: sectionRecall(reference, candidate),
    fileTableRowsMatch: rowsMatch(referenceFileStructure, candidateFileStructure),
    fileNameJaccard: jaccard(referenceFiles, candidateFiles),
    modulesTableRowsMatch: rowsMatch(referenceModules, candidateModules),
    exportsNotIncreased,
    descriptionPresent: hasDescription(candidate) ? 1 : 0,
    contentFidelity: jaccard(wordSet(reference), wordSet(candidate)),
    inventedFiles,
  };

  metrics.composite =
    0.2 * metrics.headingsMatch +
    0.1 * metrics.sectionRecall +
    0.1 * metrics.fileTableRowsMatch +
    0.15 * metrics.fileNameJaccard +
    0.1 * metrics.modulesTableRowsMatch +
    0.05 * metrics.exportsNotIncreased +
    0.1 * metrics.descriptionPresent +
    0.2 * metrics.contentFidelity;

  return metrics;
}

export function averageMetrics(rows) {
  if (rows.length === 0) return {};
  const keys = [
    "headingsMatch",
    "sectionRecall",
    "fileTableRowsMatch",
    "fileNameJaccard",
    "modulesTableRowsMatch",
    "exportsNotIncreased",
    "descriptionPresent",
    "contentFidelity",
    "inventedFiles",
    "composite",
    "latencyMs",
    "candidateChars",
  ];
  const result = {};
  for (const key of keys) {
    const values = rows
      .map((row) => row.metrics[key])
      .filter((value) => typeof value === "number" && Number.isFinite(value));
    result[key] =
      values.length === 0
        ? null
        : values.reduce((sum, value) => sum + value, 0) / values.length;
  }
  result.rows = rows.length;
  return result;
}

export function formatPercent(value) {
  if (value === null || value === undefined) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

export function formatNumber(value, digits = 1) {
  if (value === null || value === undefined) return "—";
  return Number(value).toFixed(digits);
}
