import type { PersistenceClient, FindResult, Doc } from './types';

export interface RestClientOptions {
  baseUrl: string; // e.g. http://app:3000
  apiKey: string; // Payload collection API key
  authCollection?: string; // default 'users'
  fetchImpl?: typeof fetch;
}

/**
 * Payload REST API client (worker → app over the compose network). Authenticates
 * with a Payload collection API key: `Authorization: <collection> API-Key <key>`.
 * Implements just the surface persistGeneration needs.
 */
export class RestPersistenceClient implements PersistenceClient {
  private base: string;
  private headers: Record<string, string>;
  private f: typeof fetch;

  constructor(opts: RestClientOptions) {
    this.base = opts.baseUrl.replace(/\/$/, '');
    const coll = opts.authCollection ?? 'users';
    this.headers = {
      'Content-Type': 'application/json',
      Authorization: `${coll} API-Key ${opts.apiKey}`,
    };
    this.f = opts.fetchImpl ?? fetch;
  }

  private async req(method: string, path: string, body?: unknown): Promise<Record<string, unknown>> {
    const res = await this.f(`${this.base}${path}`, {
      method,
      headers: this.headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`payload REST ${method} ${path} -> ${res.status}: ${text.slice(0, 300)}`);
    }
    return text ? (JSON.parse(text) as Record<string, unknown>) : {};
  }

  private whereQs(where: Record<string, unknown>): string {
    const parts: string[] = [];
    for (const [field, cond] of Object.entries(where)) {
      if (cond && typeof cond === 'object') {
        for (const [op, val] of Object.entries(cond as Record<string, unknown>)) {
          parts.push(
            `where[${encodeURIComponent(field)}][${encodeURIComponent(op)}]=${encodeURIComponent(String(val))}`,
          );
        }
      }
    }
    return parts.length ? `?${parts.join('&')}&limit=1` : '?limit=1';
  }

  async find(collection: string, where: Record<string, unknown>): Promise<FindResult> {
    const json = await this.req('GET', `/api/${collection}${this.whereQs(where)}`);
    const docs = (json.docs as Doc[]) ?? [];
    return { docs, totalDocs: (json.totalDocs as number) ?? docs.length };
  }

  async findById(collection: string, id: string | number): Promise<Doc | null> {
    try {
      const json = await this.req('GET', `/api/${collection}/${id}?depth=0`);
      return json && json.id != null ? (json as Doc) : null;
    } catch (e) {
      if (String(e).includes('-> 404')) return null;
      throw e;
    }
  }

  async create(collection: string, data: Record<string, unknown>): Promise<Doc> {
    const json = await this.req('POST', `/api/${collection}`, data);
    return ((json.doc as Doc) ?? (json as Doc));
  }

  async update(collection: string, id: string | number, data: Record<string, unknown>): Promise<Doc> {
    const json = await this.req('PATCH', `/api/${collection}/${id}`, data);
    return ((json.doc as Doc) ?? (json as Doc));
  }

  async findGlobal(slug: string): Promise<Record<string, unknown>> {
    return this.req('GET', `/api/globals/${slug}?depth=0`);
  }
}
