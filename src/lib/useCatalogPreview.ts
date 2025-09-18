"use client";
import * as React from "react";

export type CatalogRow = {
  sku: string;
  productTitle?: string | null;
  imagePath?: string | null;   // image URL/path
};

type MapBySku = Record<string, CatalogRow>;

export function useCatalogPreview(skus: string[]) {
  const norm = React.useMemo(
    () => Array.from(new Set(skus.map(s => (s || "").toUpperCase()).filter(Boolean))),
    [skus]
  );

  const [bySku, setBySku] = React.useState<MapBySku>({});

  React.useEffect(() => {
    if (!norm.length) { setBySku({}); return; }
    let cancelled = false;
    fetch("/api/catalog/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skus: norm }),
    })
      .then(r => r.json())
      .then((data: MapBySku) => { if (!cancelled) setBySku(data || {}); })
      .catch(() => { if (!cancelled) setBySku({}); });

    return () => { cancelled = true; };
  }, [norm.join("|")]);

  return { bySku };
}
