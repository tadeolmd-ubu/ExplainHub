export function extractComments(sqlContent) {
  try {
    if (!sqlContent) return [];

    const singleLine = [...sqlContent.matchAll(/--\s*(.*)/g)].map(m => ({
      type: "single-line",
      content: m[1].trim(),
      line: sqlContent.substring(0, m.index).split("\n").length,
    }));

    const multiLine = [...sqlContent.matchAll(/\/\*([\s\S]*?)\*\//g)].map(m => ({
      type: "multi-line",
      content: m[1].trim(),
      line: sqlContent.substring(0, m.index).split("\n").length,
    }));

    return [...singleLine, ...multiLine];
  } catch (err) {
    console.error("Error extracting comments:", err);
    return [];
  }
}