import type { Intelligence, ContentBrief, GeneratedArticle } from '@etk/core';

/** A persisted document. Payload ids may be numeric or string depending on adapter. */
export interface Doc { id: string | number; [k: string]: unknown; }

export interface FindResult { docs: Doc[]; totalDocs: number; }

/**
 * Minimal persistence surface shared by the worker (Payload REST) and the
 * validation harness (Payload Local API). Keeps persistGeneration backend-
 * agnostic — the same write logic runs over either transport.
 */
export interface PersistenceClient {
  find(collection: string, where: Record<string, unknown>): Promise<FindResult>;
  findById(collection: string, id: string | number): Promise<Doc | null>;
  create(collection: string, data: Record<string, unknown>): Promise<Doc>;
  update(collection: string, id: string | number, data: Record<string, unknown>): Promise<Doc>;
  findGlobal(slug: string): Promise<Record<string, unknown>>;
}

/** Per-step usage (mirror of CostMeter.report().steps in @etk/providers). */
export interface CostStep {
  label: string;
  model: string;
  usage: { inputTokens: number; outputTokens: number };
  cents: number;
}
export interface CostReport { totalCents: number; totalTokens: number; steps: CostStep[]; }

/** Everything persistGeneration needs from a completed pipeline run. */
export interface GenerationOutcome {
  productId: string | number;
  intelligence?: Intelligence;
  brief?: ContentBrief;
  article?: GeneratedArticle;
  qa?: { passed: boolean; reasons: string[] };
  cost: CostReport;
  articleAttempts: number;
  flagged: boolean;
  promptVersions?: string[];
}

export interface PersistResult {
  runId: string | number;
  intelligenceId: string | number;
  briefId: string | number;
  articleId: string | number;
  articleSlug: string;
  articleStatus: 'published' | 'flagged';
  passed: boolean;
}
