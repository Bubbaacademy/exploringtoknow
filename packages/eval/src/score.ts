import type { BrandProfile } from '@etk/core';
import { readability, seo, cta, brandVoice, type EvalPiece } from './analyze';

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));

export interface ArticleScores {
  readingGrade: number;
  readabilityScore: number;        // 0-100
  seoScore: number;                // 0-100
  affiliateUsefulnessScore: number;// 0-100
  brandComplianceScore: number;    // 0-100
  overallQualityScore: number;     // 0-100
  wordCount: number;
}

/** Composite 0-100 scores for a single article (for QUALITY_EVALUATION_REPORT). */
export function scoreArticle(piece: EvalPiece, brand: BrandProfile): ArticleScores {
  const read = readability(piece.markdown);
  const s = seo(piece);
  const c = cta(piece);
  const bv = brandVoice(piece, brand);
  const md = piece.markdown.toLowerCase();

  // Readability: best around Flesch ease 60–75 (plain English)
  const readabilityScore = clamp(100 - Math.abs(read.fleschReadingEase - 67) * 1.6);

  // SEO: weighted structural signals
  const seoScore = clamp(
    (s.metaTitleOk ? 20 : 0) + (s.metaDescOk ? 20 : 0) + (s.hasH2 ? 20 : 0) +
    (s.keywordInTitle ? 20 : 0) + (s.keywordInMeta ? 10 : 0) +
    (s.wordCount >= 800 && s.wordCount <= 2500 ? 10 : 0));

  // Affiliate usefulness: CTA + disclosure + comparison + practical depth
  const hasComparison = /\b(tape|vs\.?|compared|comparison|alternative|diy)\b/.test(md);
  const hasFaq = /faq|frequently asked|\?/.test(md);
  const affiliateUsefulnessScore = clamp(
    (c.hasCta ? 25 : 0) + ((c.inIntro || c.inConclusion) ? 15 : 0) +
    (bv.hasDisclosure ? 20 : 0) + (hasComparison ? 20 : 0) +
    (s.wordCount >= 800 ? 10 : 0) + (hasFaq ? 10 : 0));

  // Brand compliance: disclosure + no forbidden/hype + on reading level
  const brandComplianceScore = clamp(
    (bv.hasDisclosure ? 35 : 0) + (bv.forbiddenHits.length === 0 ? 25 : 0) +
    (bv.hypeHits.length === 0 ? 25 : 0) + (bv.onReadingLevel ? 15 : 0));

  const overallQualityScore = clamp(
    (piece.qaPassed ? 20 : 0) +
    readabilityScore * 0.2 + seoScore * 0.25 +
    affiliateUsefulnessScore * 0.2 + brandComplianceScore * 0.15);

  return {
    readingGrade: read.fkGrade,
    readabilityScore, seoScore, affiliateUsefulnessScore, brandComplianceScore,
    overallQualityScore,
    wordCount: s.wordCount,
  };
}
