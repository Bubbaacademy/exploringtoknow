/**
 * Container-side rasterizer (runs inside etk-app where sharp works on Linux).
 * Reads /tmp/raster-jobs.json, renders each job with sharp, and prints a JSON map of
 * { destPath: base64png } to stdout. The caller decodes and writes the files locally.
 */
const sharp = require('/app/node_modules/.pnpm/sharp@0.34.5/node_modules/sharp');
const fs = require('fs');

const { svgs, jobs } = JSON.parse(fs.readFileSync('/tmp/raster-jobs.json', 'utf8'));

(async () => {
  const out = {};
  for (const j of jobs) {
    const buf = Buffer.from(svgs[j.src]);
    let img = sharp(buf, { density: 600 });
    const bg = { r: 0, g: 0, b: 0, alpha: 0 };
    img = j.width
      ? img.resize(j.width, j.height, { fit: 'contain', background: bg })
      : img.resize(j.size, j.size, { fit: 'contain', background: bg });
    const png = await img.png({ compressionLevel: 9 }).toBuffer();
    out[j.dest] = png.toString('base64');
  }
  process.stdout.write(JSON.stringify(out));
})().catch((e) => { console.error('RASTER_FAIL', e.message); process.exit(1); });
