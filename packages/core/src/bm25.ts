// Okapi BM25: a classic, explainable ranking function used by search engines.

const DEFAULT_K1 = 1.2;
const DEFAULT_B = 0.75;

export interface Bm25Document {
  id: string;
  tokens: readonly string[];
}

export interface Bm25Index {
  documents: ReadonlyArray<{ id: string; termCounts: ReadonlyMap<string, number>; length: number }>;
  documentFrequency: ReadonlyMap<string, number>;
  averageLength: number;
  k1: number;
  b: number;
}

export interface Bm25Result {
  id: string;
  score: number;
  matchedTerms: string[];
}

export function buildBm25Index(documents: readonly Bm25Document[], k1 = DEFAULT_K1, b = DEFAULT_B): Bm25Index {
  const documentFrequency = new Map<string, number>();
  const indexedDocuments = documents.map(document => {
    const termCounts = new Map<string, number>();
    document.tokens.forEach(token => termCounts.set(token, (termCounts.get(token) ?? 0) + 1));
    termCounts.forEach((_count, term) => documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1));
    return { id: document.id, termCounts, length: document.tokens.length };
  });

  const totalLength = indexedDocuments.reduce((sum, document) => sum + document.length, 0);
  const averageLength = indexedDocuments.length > 0 ? totalLength / indexedDocuments.length : 0;

  return { documents: indexedDocuments, documentFrequency, averageLength, k1, b };
}

function inverseDocumentFrequency(term: string, index: Bm25Index): number {
  const documentCount = index.documents.length;
  const frequency = index.documentFrequency.get(term) ?? 0;
  return Math.log(1 + (documentCount - frequency + 0.5) / (frequency + 0.5));
}

/**
 * Scores every document against a weighted query.
 * @param queryWeights term -> weight, e.g. higher weight for terms in the "expectations" section.
 */
export function scoreBm25(index: Bm25Index, queryWeights: ReadonlyMap<string, number>): Bm25Result[] {
  return index.documents.map(document => {
    let score = 0;
    const matchedTerms: string[] = [];
    queryWeights.forEach((weight, term) => {
      const termCount = document.termCounts.get(term) ?? 0;
      if (termCount === 0) {
        return;
      }
      const lengthRatio = index.averageLength > 0 ? document.length / index.averageLength : 1;
      const saturation = (termCount * (index.k1 + 1)) / (termCount + index.k1 * (1 - index.b + index.b * lengthRatio));
      score += weight * inverseDocumentFrequency(term, index) * saturation;
      matchedTerms.push(term);
    });
    return { id: document.id, score, matchedTerms };
  });
}
