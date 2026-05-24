// Merchant normalization + fuzzy matching for the Merchant table.
// Pure functions only — no Prisma access. Callers (worker, seed) pass in the
// candidate set to match against.

const STORE_NUM_RE = /\s*#?\d{2,}\b/g;
const NOISE_RE = /[*_,#.]+/g;
const MULTISPACE_RE = /\s+/g;
const SUFFIX_RE = /\b(LLC|INC|CO|CORP|LTD|GMBH|SA|BV)\b/gi;

export function normalizeMerchant(raw: string): string {
  if (!raw) return '';
  const cleaned = raw
    .replace(STORE_NUM_RE, ' ')
    .replace(SUFFIX_RE, ' ')
    .replace(NOISE_RE, ' ')
    .replace(MULTISPACE_RE, ' ')
    .trim()
    .toLowerCase();
  return cleaned;
}

/**
 * Jaro-Winkler similarity in the range [0, 1].
 * 1 = identical, 0 = nothing in common.
 */
export function jaroWinkler(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;

  const aLen = a.length;
  const bLen = b.length;
  const matchDistance = Math.max(Math.floor(Math.max(aLen, bLen) / 2) - 1, 0);

  const aMatches = new Array<boolean>(aLen).fill(false);
  const bMatches = new Array<boolean>(bLen).fill(false);
  let matches = 0;
  for (let i = 0; i < aLen; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, bLen);
    for (let j = start; j < end; j++) {
      if (bMatches[j]) continue;
      if (a[i] !== b[j]) continue;
      aMatches[i] = true;
      bMatches[j] = true;
      matches += 1;
      break;
    }
  }
  if (matches === 0) return 0;

  let k = 0;
  let transpositions = 0;
  for (let i = 0; i < aLen; i++) {
    if (!aMatches[i]) continue;
    while (!bMatches[k]) k++;
    if (a[i] !== b[k]) transpositions += 1;
    k += 1;
  }
  transpositions = transpositions / 2;

  const m = matches;
  const jaro = (m / aLen + m / bLen + (m - transpositions) / m) / 3;

  // Winkler boost: up to 4 leading characters that match (prefix length cap).
  let prefix = 0;
  for (let i = 0; i < Math.min(4, aLen, bLen); i++) {
    if (a[i] === b[i]) prefix += 1;
    else break;
  }
  return jaro + prefix * 0.1 * (1 - jaro);
}

export interface MerchantCandidate {
  id: string;
  canonicalName: string;
}

export interface MerchantMatchResult {
  matched: MerchantCandidate | null;
  similarity: number;
  normalized: string;
}

export const MERCHANT_MATCH_THRESHOLD = 0.92;

export function matchMerchant(
  raw: string,
  candidates: MerchantCandidate[],
  threshold: number = MERCHANT_MATCH_THRESHOLD,
): MerchantMatchResult {
  const normalized = normalizeMerchant(raw);
  if (!normalized) return { matched: null, similarity: 0, normalized };

  let best: { cand: MerchantCandidate; sim: number } | null = null;
  for (const c of candidates) {
    const sim = jaroWinkler(normalized, normalizeMerchant(c.canonicalName));
    if (!best || sim > best.sim) best = { cand: c, sim };
  }

  if (best && best.sim >= threshold) {
    return { matched: best.cand, similarity: best.sim, normalized };
  }
  return { matched: null, similarity: best?.sim ?? 0, normalized };
}
