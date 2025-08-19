// src/types/product.ts  (or wherever your shared type lives)
export type ProductForm = {
  sku: string;
  productName: string;
  shortDescription?: string;
  longDescription?: string;
  stamp?: string | null;
  offSaleMessage?: string | null;

  onSaleDate?: string | null;
  offSaleDate?: string | null;

  uomTitleUS?: string;
  uomValueUS?: string;
  uomTitleCA?: string;
  uomValueCA?: string;

  savingsUS?: string;
  savingsCA?: string;

  // NEW:
  imageUrl?: string;          // e.g. "/10885h-01-enus.png"
  memberPrice?: string;       // e.g. "$14.00"
  nonMemberPrice?: string;    // e.g. "$16.00"
  points?: number;            // e.g. 10

  recommendations?: { sku: string }[];
  accessories: { accessorySku?: string; accessoryLabel?: string }[];
  cultures: { cultureCode?: string; translatedName?: string; translatedShort?: string; translatedLong?: string }[];
};
