export function normalizeTagName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function getTagSlug(value: string) {
  return normalizeTagName(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 100);
}

export function parseTagNames(value: string) {
  const seenSlugs = new Set<string>();
  const names: string[] = [];

  for (const part of value.split(",")) {
    const name = normalizeTagName(part);
    const slug = getTagSlug(name);

    if (!name || !slug || seenSlugs.has(slug)) {
      continue;
    }

    seenSlugs.add(slug);
    names.push(name.slice(0, 80));
  }

  return names.slice(0, 20);
}
