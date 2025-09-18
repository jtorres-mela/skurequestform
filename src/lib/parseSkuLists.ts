// src/lib/parseSkuLists.ts
export function parseAccessoriesInput(raw: string): { accessorySku?: string; accessoryLabel?: string }[] {
  const rows: { accessorySku?: string; accessoryLabel?: string }[] = [];
  const parts = raw.split(/[\n,;]+/);
  const seen = new Set<string>();
  for (const p of parts) {
    const s = p.trim();
    if (!s) continue;

    // split "SKU | Label" / "SKU:Label" / "SKU — Label"
    const m = s.split(/\s*[|:\u2014-]\s*/); // \u2014 = em dash
    const sku = (m[0] || "").trim().toUpperCase();
    if (!sku) continue;
    if (seen.has(sku)) continue;
    seen.add(sku);

    const label = (m[1] || "").trim();
    rows.push({ accessorySku: sku, accessoryLabel: label || undefined });
  }
  return rows;
}

export function parseRecommendationsInput(raw: string): { sku: string }[] {
  const parts = raw.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
  const seen = new Set<string>();
  return parts.map(s => s.toUpperCase()).filter(sku => {
    if (seen.has(sku)) return false;
    seen.add(sku);
    return true;
  }).map(sku => ({ sku }));
}
