import type { PromptCategory, PromptDef } from './types';

/**
 * Centralized prompt retrieval layer. Prompts self-register here at module load.
 * Versioned: multiple versions per category; latest wins unless a version is
 * requested. This is the ONLY place nodes obtain prompts — no inline prompt text.
 */
class PromptRegistry {
  private byCategory = new Map<PromptCategory, PromptDef<any>[]>();
  private byId = new Map<string, PromptDef<any>>();

  register(def: PromptDef<any>): void {
    if (this.byId.has(def.id)) throw new Error(`duplicate prompt id: ${def.id}`);
    this.byId.set(def.id, def);
    const list = this.byCategory.get(def.category) ?? [];
    list.push(def);
    list.sort((a, b) => b.version - a.version); // newest first
    this.byCategory.set(def.category, list);
  }

  /** Latest version for a category, or a specific version if given. */
  get<V = Record<string, unknown>>(category: PromptCategory, version?: number): PromptDef<V> {
    const list = this.byCategory.get(category);
    if (!list || list.length === 0) throw new Error(`no prompt for category: ${category}`);
    const def = version == null ? list[0] : list.find((d) => d.version === version);
    if (!def) throw new Error(`no prompt ${category}@${version}`);
    return def as PromptDef<V>;
  }

  getById<V = Record<string, unknown>>(id: string): PromptDef<V> {
    const def = this.byId.get(id);
    if (!def) throw new Error(`no prompt id: ${id}`);
    return def as PromptDef<V>;
  }

  listByCategory(category: PromptCategory): PromptDef<any>[] {
    return [...(this.byCategory.get(category) ?? [])];
  }

  list(): PromptDef<any>[] {
    return [...this.byId.values()];
  }
}

export const registry = new PromptRegistry();
