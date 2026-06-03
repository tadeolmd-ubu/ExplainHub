export function extractDrop(node) {
  try {
    if (!node || typeof node !== "object") {
      return;
    }
    if (node.type === "drop") {
      return {
        name: Array.isArray(node.name)
          ? node.name.map((n) => n.table || n)
          : node.name?.table || node.name,
        keyword: node.keyword,
      };
    }
    return null;
  } catch (err) {
    console.error("Error extracting DROP:", err);
    return null;
  }
}