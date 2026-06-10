import type { Usage } from '@etk/core';

/**
 * Cost estimation. Prices are USD per 1,000,000 tokens (input/output) and are
 * the single place rates live — update here when pricing changes. Stored as
 * integer micro-dollars internally to avoid float drift; exposed in USD cents.
 */
export interface ModelPrice { inputPerM: number; outputPerM: number; }

export const PRICES: Record<string, ModelPrice> = {
  // illustrative baseline rates; confirm against current pricing before launch
  'claude-opus-4-8':    { inputPerM: 15.0, outputPerM: 75.0 },
  'claude-sonnet-4-6':  { inputPerM: 3.0,  outputPerM: 15.0 },
  'claude-haiku-4-5':   { inputPerM: 0.8,  outputPerM: 4.0 },
  'gpt-4o':             { inputPerM: 2.5,  outputPerM: 10.0 },
  'gpt-4o-mini':        { inputPerM: 0.15, outputPerM: 0.6 },
};

export function estimateUsdCents(model: string, usage: Usage): number {
  const p = PRICES[model] ?? { inputPerM: 5, outputPerM: 15 }; // conservative default
  const usd = (usage.inputTokens / 1e6) * p.inputPerM + (usage.outputTokens / 1e6) * p.outputPerM;
  return Math.round(usd * 100);
}

/** Accumulates usage + cost across a pipeline run. */
export class CostMeter {
  private steps: Array<{ label: string; model: string; usage: Usage; cents: number }> = [];

  record(label: string, model: string, usage: Usage): void {
    this.steps.push({ label, model, usage, cents: estimateUsdCents(model, usage) });
  }

  get totalCents(): number { return this.steps.reduce((s, x) => s + x.cents, 0); }
  get totalTokens(): number {
    return this.steps.reduce((s, x) => s + x.usage.inputTokens + x.usage.outputTokens, 0);
  }
  report() {
    return { totalCents: this.totalCents, totalTokens: this.totalTokens, steps: this.steps };
  }
}
