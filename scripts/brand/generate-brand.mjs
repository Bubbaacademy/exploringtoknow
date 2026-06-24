/**
 * Exploring To Know — brand asset generator (SVG + raster manifest).
 *
 * Produces a 12-petal lotus mark inspired by the ancient Persian / Persepolis lotus
 * motif (inspiration only, not a copy), in a deep-green + warm-gold palette, plus a
 * wordmark lockup. Writes the SVGs to apps/web/public/brand/ and a `raster-jobs.json`
 * manifest (SVG strings + PNG render jobs). PNG rasterization runs separately via sharp
 * (see scripts/brand/raster-in-container.sh — sharp is unreliable to load under pnpm on
 * Windows, so we render inside the Linux app container where sharp already works).
 *
 * Run from repo root:  node scripts/brand/generate-brand.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
const BRAND_DIR = resolve(ROOT, 'apps/web/public/brand');
mkdirSync(BRAND_DIR, { recursive: true });

// ---- palette -------------------------------------------------------------
const GREEN_DARK = '#0A3A2C';
const GREEN = '#0C4B39';
const GREEN_LIGHT = '#11644A';
const GOLD = '#C9962E';
const GOLD_LIGHT = '#F0D080';
const CREAM = '#F6E6BB';

// ---- lotus geometry ------------------------------------------------------
// One symmetric lancet petal pointing up, base at (0,0), tip at (0,-len).
function petal(len, halfW) {
  const w = halfW;
  return `M0 0 C ${-w} ${(-len * 0.36).toFixed(1)}, ${(-w * 0.6).toFixed(1)} ${(-len * 0.85).toFixed(1)}, 0 ${-len} `
       + `C ${(w * 0.6).toFixed(1)} ${(-len * 0.85).toFixed(1)}, ${w} ${(-len * 0.36).toFixed(1)}, 0 0 Z`;
}

// 12-petal lotus centered at (cx,cy). Two layered rings (outer gold, inner cream
// offset 15°) read as a blooming lotus while staying clean at small sizes.
function lotus(cx, cy, scale = 1) {
  const outer = petal(96, 23);
  const inner = petal(58, 16);
  let g = `<g transform="translate(${cx} ${cy}) scale(${scale})">`;
  for (let i = 0; i < 12; i++) g += `<path d="${inner}" transform="rotate(${i * 30 + 15})" fill="url(#cream)" opacity="0.92"/>`;
  for (let i = 0; i < 12; i++) g += `<path d="${outer}" transform="rotate(${i * 30})" fill="url(#gold)"/>`;
  g += `<circle r="17" fill="url(#gold)"/><circle r="7.5" fill="${GREEN}"/></g>`;
  return g;
}

const defs = `
  <defs>
    <linearGradient id="grn" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${GREEN_LIGHT}"/><stop offset="1" stop-color="${GREEN_DARK}"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="${GOLD_LIGHT}"/><stop offset="1" stop-color="${GOLD}"/>
    </linearGradient>
    <linearGradient id="cream" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${CREAM}"/><stop offset="1" stop-color="${GOLD}"/>
    </linearGradient>
  </defs>`;

const markSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" role="img" aria-label="Exploring To Know">
  ${defs}
  <rect x="0" y="0" width="240" height="240" rx="54" fill="url(#grn)"/>
  ${lotus(120, 120, 1)}
</svg>`;

const iconSquareSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" role="img" aria-label="Exploring To Know">
  ${defs}
  <rect x="0" y="0" width="240" height="240" fill="url(#grn)"/>
  ${lotus(120, 120, 1)}
</svg>`;

const FONT = "'Segoe UI', 'Helvetica Neue', Arial, system-ui, sans-serif";
const wordmarkSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 200" role="img" aria-label="Exploring To Know">
  ${defs}
  <g transform="translate(16 20)">
    <rect x="0" y="0" width="160" height="160" rx="36" fill="url(#grn)"/>
    ${lotus(80, 80, 0.66)}
  </g>
  <text x="208" y="104" font-family="${FONT}" font-size="62" font-weight="600" letter-spacing="0.5" fill="${GREEN}">Exploring</text>
  <text x="208" y="166" font-family="${FONT}" font-size="62" font-weight="600" letter-spacing="0.5" fill="${GREEN}">To <tspan fill="${GOLD}">Know</tspan></text>
</svg>`;

// ---- write SVGs ----------------------------------------------------------
const svgFiles = { 'mark.svg': markSvg, 'icon-square.svg': iconSquareSvg, 'logo-wordmark.svg': wordmarkSvg };
for (const [name, svg] of Object.entries(svgFiles)) {
  writeFileSync(resolve(BRAND_DIR, name), svg.trim() + '\n', 'utf8');
  console.log('wrote brand/' + name);
}

// ---- raster manifest (rendered by sharp in the Linux container) ----------
// dest is relative to repo root. opaque=true keeps the green background (no alpha).
const jobs = [
  { src: 'icon-square', size: 1024, dest: 'apps/web/public/brand/icon-1024.png' },
  { src: 'icon-square', size: 512, dest: 'apps/web/public/brand/icon-512.png' },
  { src: 'mark', size: 192, dest: 'apps/web/public/brand/icon-192.png' },
  { src: 'mark', size: 180, dest: 'apps/web/public/brand/apple-touch-icon.png' },
  { src: 'mark', size: 32, dest: 'apps/web/public/brand/favicon-32.png' },
  { src: 'mark', size: 256, dest: 'apps/web/src/app/icon.png' },
  { src: 'mark', size: 180, dest: 'apps/web/src/app/apple-icon.png' },
  { src: 'wordmark', width: 1520, height: 400, dest: 'apps/web/public/brand/logo-wordmark.png' },
];
writeFileSync(resolve(BRAND_DIR, 'raster-jobs.json'),
  JSON.stringify({ svgs: { mark: markSvg, 'icon-square': iconSquareSvg, wordmark: wordmarkSvg }, jobs }, null, 2), 'utf8');
console.log('wrote brand/raster-jobs.json (' + jobs.length + ' png jobs)');
