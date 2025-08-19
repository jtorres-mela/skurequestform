export const CULTURE_CODES = {
  EN_US: "en-US",
  ES_US: "es-US",
  EN_CA: "en-CA",
  FR_CA: "fr-CA",
  ES_MX: "es-MX",
  EN_GB: "en-GB",
  EN_IE: "en-IE",
  NL_NL: "nl-NL",
  DE_DE: "de-DE",
  PL_PL: "pl-PL",
  LT_LT: "lt-LT",
} as const;

export type CultureCode = (typeof CULTURE_CODES)[keyof typeof CULTURE_CODES];

export const PRESET_GROUPS: Record<string, CultureCode[]> = {
  US:    [CULTURE_CODES.EN_US, CULTURE_CODES.ES_US],
  CAN:   [CULTURE_CODES.EN_CA, CULTURE_CODES.FR_CA],
  MX:    [CULTURE_CODES.ES_MX],
  EU:    [CULTURE_CODES.EN_GB, CULTURE_CODES.EN_IE, CULTURE_CODES.NL_NL, CULTURE_CODES.DE_DE, CULTURE_CODES.PL_PL, CULTURE_CODES.LT_LT],
  GB:    [CULTURE_CODES.EN_GB], // for GB-only submissions
};

export function expandCultures(input: string[]): CultureCode[] {
  const out = new Set<CultureCode>();
  for (const item of input) {
    const key = item.toUpperCase();
    if (PRESET_GROUPS[key]) {
      PRESET_GROUPS[key].forEach(c => out.add(c));
    } else {
      // assume it’s an explicit culture code like "fr-CA"
      out.add(item as CultureCode);
    }
  }
  return [...out];
}
