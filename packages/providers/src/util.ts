import type { Usage } from '@etk/core';

/** Rough token estimate (~4 chars/token) for mock-mode cost accounting. */
export function approxTokens(input: string, output: string): Usage {
  return { inputTokens: Math.ceil(input.length / 4), outputTokens: Math.ceil(output.length / 4) };
}

/**
 * Extract a JSON object from a model response. Handles, in order: plain JSON,
 * JSON inside ```json / ``` fences, and JSON with short prose before/after. The
 * object is located by scanning for the first BALANCED `{...}` (string/escape
 * aware) rather than a fragile nested-regex. Throws if no valid object exists;
 * never fabricates or repairs fields.
 */
export function extractJson<T>(text: string): T {
  const raw = text.trim();

  // 1) plain JSON
  try {
    return JSON.parse(raw) as T;
  } catch {
    /* fall through */
  }

  // 2) strip a markdown code fence (```json ... ``` or ``` ... ```) and parse
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fence?.[1]) {
    const inner = fence[1].trim();
    try {
      return JSON.parse(inner) as T;
    } catch {
      const obj = firstBalancedObject(inner);
      if (obj) return JSON.parse(obj) as T;
    }
  }

  // 3) first complete balanced { ... } anywhere in the raw text
  const obj = firstBalancedObject(raw);
  if (obj) return JSON.parse(obj) as T;

  throw new Error('no JSON object found in model output');
}

/**
 * Return the first balanced top-level `{...}` substring, honoring quoted strings
 * and escaped quotes so braces inside string values are ignored. null if none.
 */
function firstBalancedObject(s: string): string | null {
  const start = s.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < s.length; i += 1) {
    const c = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
    } else if (c === '"') {
      inStr = true;
    } else if (c === '{') {
      depth += 1;
    } else if (c === '}') {
      depth -= 1;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null;
}
