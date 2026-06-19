'use client';
import { useState } from 'react';
import { SECTION_TYPES, SECTION_TYPE_LABELS, type Section } from '@/lib/landing-constants';

const linesToArr = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);
const arrToLines = (a?: string[]) => (a || []).join('\n');

/**
 * Manual structured-section editor (Phase 24). Holds the sections array in state
 * and mirrors it into a hidden <input name="sectionsJson"> so the parent form's
 * FormData carries it. No AI, no auto-content — the author writes everything.
 */
export function SectionsEditor({ initial }: { initial: Section[] }) {
  const [sections, setSections] = useState<Section[]>(initial || []);
  const update = (i: number, patch: Partial<Section>) => setSections((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const add = () => setSections((s) => [...s, { type: 'text' }]);
  const remove = (i: number) => setSections((s) => s.filter((_, j) => j !== i));
  const move = (i: number, d: number) => setSections((s) => {
    const j = i + d; if (j < 0 || j >= s.length) return s;
    const c = [...s]; [c[i], c[j]] = [c[j], c[i]]; return c;
  });

  return (
    <div>
      <input type="hidden" name="sectionsJson" value={JSON.stringify(sections)} readOnly />
      {sections.map((sec, i) => (
        <div key={i} className="adm-card" style={{ marginBottom: 10 }}>
          <div className="adm-row" style={{ marginBottom: 8 }}>
            <select className="adm-select" value={sec.type} onChange={(e) => update(i, { type: e.target.value })} aria-label="Section type">
              {SECTION_TYPES.map((t) => <option key={t} value={t}>{SECTION_TYPE_LABELS[t]}</option>)}
            </select>
            <span style={{ display: 'flex', gap: 6 }}>
              <button type="button" className="adm-btn ghost" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
              <button type="button" className="adm-btn ghost" onClick={() => move(i, 1)} disabled={i === sections.length - 1}>↓</button>
              <button type="button" className="adm-btn ghost" onClick={() => remove(i)}>Remove</button>
            </span>
          </div>
          {sec.type !== 'disclosure' && sec.type !== 'cta_block' ? (
            <div className="field"><label>Heading</label><input value={sec.heading || ''} onChange={(e) => update(i, { heading: e.target.value })} maxLength={200} /></div>
          ) : null}
          {(sec.type === 'text' || sec.type === 'product_highlight' || sec.type === 'disclosure') ? (
            <div className="field"><label>Text</label><textarea rows={3} value={sec.text || ''} onChange={(e) => update(i, { text: e.target.value })} maxLength={5000} /></div>
          ) : null}
          {(sec.type === 'feature_list' || sec.type === 'faq_placeholder') ? (
            <div className="field"><label>{sec.type === 'faq_placeholder' ? 'Questions (one per line — placeholder)' : 'Items (one per line)'}</label><textarea rows={4} value={arrToLines(sec.items)} onChange={(e) => update(i, { items: linesToArr(e.target.value) })} /></div>
          ) : null}
          {sec.type === 'pros_cons' ? (
            <div className="adm-cols-2">
              <div className="field"><label>Pros (one per line)</label><textarea rows={4} value={arrToLines(sec.pros)} onChange={(e) => update(i, { pros: linesToArr(e.target.value) })} /></div>
              <div className="field"><label>Cons (one per line)</label><textarea rows={4} value={arrToLines(sec.cons)} onChange={(e) => update(i, { cons: linesToArr(e.target.value) })} /></div>
            </div>
          ) : null}
          {sec.type === 'cta_block' ? (
            <div className="adm-cols-2">
              <div className="field"><label>CTA label</label><input value={sec.ctaLabel || ''} onChange={(e) => update(i, { ctaLabel: e.target.value })} maxLength={120} /></div>
              <div className="field"><label>CTA URL (http/https)</label><input value={sec.ctaUrl || ''} onChange={(e) => update(i, { ctaUrl: e.target.value })} maxLength={500} placeholder="https://…" /></div>
            </div>
          ) : null}
        </div>
      ))}
      <button type="button" className="adm-btn ghost" onClick={add}>+ Add section</button>
    </div>
  );
}
