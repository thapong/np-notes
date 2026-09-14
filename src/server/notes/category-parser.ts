export function parseCategory(text: string): { categoryName: string | null; searchableText: string } {
  const normalized = text.trim();
  const match = normalized.match(/^#([^\s#]+)(?:\s+|$)/u);
  if (!match) return { categoryName: null, searchableText: normalized };
  return { categoryName: match[1], searchableText: normalized.slice(match[0].length).trim() };
}
