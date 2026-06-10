import type { BrandProfile } from '@etk/core';

/** One generated piece in a shape the evaluator can analyze. */
export interface EvalPiece {
  angleKey: string;
  title: string;
  type: string;
  markdown: string;
  metaTitle: string;
  metaDescription: string;
  primaryKeyword: string;
  qaPassed: boolean;
  costCents: number;
  tokens: number;
}

const words = (t: string) => t.toLowerCase().match(/[a-z0-9']+/g) ?? [];
const sentences = (t: string) => t.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);

function syllables(word: string): number {
  const w = word.replace(/[^a-z]/g, '');
  if (!w) return 0;
  const groups = w.match(/[aeiouy]+/g);
  let n = groups ? groups.length : 1;
  if (w.endsWith('e') && n > 1) n -= 1;
  return Math.max(1, n);
}

export interface Readability { fleschReadingEase: number; fkGrade: number; avgSentenceWords: number; }
export function readability(text: string): Readability {
  const w = words(text); const s = sentences(text);
  const nw = Math.max(1, w.length); const ns = Math.max(1, s.length);
  const syl = w.reduce((a, x) => a + syllables(x), 0);
  const wps = nw / ns; const spw = syl / nw;
  return {
    fleschReadingEase: Math.round((206.835 - 1.015 * wps - 84.6 * spw) * 10) / 10,
    fkGrade: Math.round((0.39 * wps + 11.8 * spw - 15.59) * 10) / 10,
    avgSentenceWords: Math.round(wps * 10) / 10,
  };
}

/** Word-trigram set for repetition analysis. */
function shingles(text: string, n = 3): Set<string> {
  const w = words(text); const out = new Set<string>();
  for (let i = 0; i + n <= w.length; i++) out.add(w.slice(i, i + n).join(' '));
  return out;
}
function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size && !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

export interface RepetitionReport {
  avgPairwiseSimilarity: number;
  maxPairSimilarity: number;
  maxPair: [string, string];
  duplicateTitles: number;
}
export function repetition(pieces: EvalPiece[]): RepetitionReport {
  const sh = pieces.map((p) => shingles(p.markdown));
  let sum = 0, count = 0, max = 0, maxPair: [string, string] = ['', ''];
  for (let i = 0; i < pieces.length; i++)
    for (let j = i + 1; j < pieces.length; j++) {
      const s = jaccard(sh[i]!, sh[j]!); sum += s; count++;
      if (s > max) { max = s; maxPair = [pieces[i]!.angleKey, pieces[j]!.angleKey]; }
    }
  const titles = pieces.map((p) => p.title.toLowerCase().trim());
  const dupTitles = titles.length - new Set(titles).size;
  return {
    avgPairwiseSimilarity: count ? Math.round((sum / count) * 1000) / 1000 : 0,
    maxPairSimilarity: Math.round(max * 1000) / 1000,
    maxPair, duplicateTitles: dupTitles,
  };
}

export interface SeoReport {
  metaTitleOk: boolean; metaDescOk: boolean; h2Count: number; hasH2: boolean;
  keywordInTitle: boolean; keywordInMeta: boolean; wordCount: number;
}
export function seo(p: EvalPiece): SeoReport {
  const h2 = (p.markdown.match(/(^|\n)##\s+/g) ?? []).length;
  const kw = p.primaryKeyword?.toLowerCase() ?? '';
  return {
    metaTitleOk: p.metaTitle.length > 0 && p.metaTitle.length <= 60,
    metaDescOk: p.metaDescription.length >= 50 && p.metaDescription.length <= 160,
    h2Count: h2, hasH2: h2 >= 2,
    keywordInTitle: kw ? p.title.toLowerCase().includes(kw) : false,
    keywordInMeta: kw ? p.metaDescription.toLowerCase().includes(kw) : false,
    wordCount: words(p.markdown).length,
  };
}

export interface CtaReport { count: number; hasCta: boolean; inIntro: boolean; inConclusion: boolean; }
export function cta(p: EvalPiece): CtaReport {
  const re = /\b(check (current )?price|compare|shop|buy|view deal|see price)\b/gi;
  const hits = [...p.markdown.matchAll(re)];
  const len = p.markdown.length || 1;
  const positions = hits.map((h) => (h.index ?? 0) / len);
  return {
    count: hits.length, hasCta: hits.length > 0,
    inIntro: positions.some((x) => x <= 0.34),
    inConclusion: positions.some((x) => x >= 0.66),
  };
}

const HYPE = ['amazing', 'incredible', 'revolutionary', 'best ever', 'unbelievable', 'game-changer', 'perfect', 'ultimate'];
export interface BrandVoiceReport {
  forbiddenHits: string[]; hypeHits: string[]; hasDisclosure: boolean; onReadingLevel: boolean;
}
export function brandVoice(p: EvalPiece, brand: BrandProfile): BrandVoiceReport {
  const lower = `${p.title} ${p.markdown}`.toLowerCase();
  const forbiddenHits = brand.forbiddenTerms.filter((t) => lower.includes(t.toLowerCase()));
  const hypeHits = HYPE.filter((h) => lower.includes(h));
  const r = readability(p.markdown);
  return {
    forbiddenHits, hypeHits,
    hasDisclosure: /affiliate|commission|disclosure/i.test(p.markdown),
    onReadingLevel: r.fkGrade >= 5 && r.fkGrade <= 10, // target ~grade 7-8 ± slack
  };
}
