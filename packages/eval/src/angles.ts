import type { ArticleType } from '@etk/core';

/** Exactly the 10 blueprint angles a single product spawns. */
export interface ContentAngle { key: string; label: string; type: ArticleType; focus: string; }

export const GOLDEN_ANGLES: ContentAngle[] = [
  { key: 'buying_guide',          label: 'Buying Guide',           type: 'buying_guide',     focus: 'how to choose the right option' },
  { key: 'product_review',        label: 'Product Review',         type: 'review',           focus: 'a hands-on review of the top pick' },
  { key: 'faq',                   label: 'FAQ',                    type: 'faq',              focus: 'the most frequently asked questions answered' },
  { key: 'comparison',            label: 'Comparison',             type: 'comparison',       focus: 'compare against the main competing option' },
  { key: 'problem_solution',      label: 'Problem/Solution',       type: 'problem_solution', focus: 'solve the most common problem buyers face' },
  { key: 'best_use_cases',        label: 'Best Use Cases',         type: 'best_list',        focus: 'the best real-world use cases' },
  { key: 'beginner_guide',        label: 'Beginner Guide',         type: 'how_to',           focus: 'a beginner-friendly getting-started guide' },
  { key: 'common_mistakes',       label: 'Common Mistakes',        type: 'problem_solution', focus: 'common mistakes to avoid' },
  { key: 'benefits_breakdown',    label: 'Benefits Breakdown',     type: 'educational',      focus: 'a breakdown of the key benefits' },
  { key: 'alternative_comparison',label: 'Alternative Comparison', type: 'comparison',       focus: 'compare the top alternatives side by side' },
];
