import type { PersistenceClient, FindResult, Doc } from './types';

/** The slice of the Payload Local API instance we use (kept structural to avoid a payload dep). */
type PayloadLike = {
  find(args: { collection: string; where?: Record<string, unknown>; limit?: number }): Promise<{ docs: Doc[]; totalDocs: number }>;
  findByID(args: { collection: string; id: string | number }): Promise<Doc>;
  create(args: { collection: string; data: Record<string, unknown> }): Promise<Doc>;
  update(args: { collection: string; id: string | number; data: Record<string, unknown> }): Promise<Doc>;
  findGlobal(args: { slug: string }): Promise<Record<string, unknown>>;
};

/** Wraps a Payload Local API instance as a PersistenceClient (validation harness, in-process). */
export class LocalPersistenceClient implements PersistenceClient {
  constructor(private payload: PayloadLike) {}

  find(collection: string, where: Record<string, unknown>): Promise<FindResult> {
    return this.payload.find({ collection, where, limit: 1 });
  }

  async findById(collection: string, id: string | number): Promise<Doc | null> {
    try {
      return await this.payload.findByID({ collection, id });
    } catch {
      return null;
    }
  }

  create(collection: string, data: Record<string, unknown>): Promise<Doc> {
    return this.payload.create({ collection, data });
  }

  update(collection: string, id: string | number, data: Record<string, unknown>): Promise<Doc> {
    return this.payload.update({ collection, id, data });
  }

  findGlobal(slug: string): Promise<Record<string, unknown>> {
    return this.payload.findGlobal({ slug });
  }
}
