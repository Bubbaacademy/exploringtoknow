import type { Usage } from '@etk/core';

/** Rough token estimate (~4 chars/token) for mock-mode cost accounting. */
export function approxTokens(input: string, output: string): Usage {
  return { inputTokens: Math.ceil(input.length / 4), outputTokens: Math.ceil(output.length / 4) };
}

/** Extract a JSON object from a model response (tolerates code fences/prose). */
export function extractJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] ?? text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('no JSON object found in model output');
  return JSON.parse(candidate.slice(start, end + 1)) as T;
}
