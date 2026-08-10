// One-off build tool: renders public/og-image.png from an inline SVG that
// reuses the exact favicon mark (public/favicon.svg, scaled 3.75x, untouched)
// plus the site's nav/hero copy, so the social preview card matches the
// site's branding. Not part of the site build — run manually when the copy
// or branding changes:
//
//   npm install --no-save sharp
//   node scripts/generate-og-image.mjs
//
// sharp is intentionally not a saved dependency — it's a one-time image
// generation tool, not something the site needs at runtime or build time.

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '..', 'public', 'og-image.png');

const WIDTH = 1200;
const HEIGHT = 630;
const FONT = "'JetBrains Mono', Consolas, 'Courier New', monospace";

const svg = `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="violetGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#b39cff" stop-opacity="0.16" />
      <stop offset="100%" stop-color="#b39cff" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="amberGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffb86b" stop-opacity="0.08" />
      <stop offset="100%" stop-color="#ffb86b" stop-opacity="0" />
    </radialGradient>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="#0e0e16" />
  <circle cx="120" cy="60" r="360" fill="url(#violetGlow)" />
  <circle cx="1080" cy="560" r="380" fill="url(#amberGlow)" />

  <!-- eyebrow -->
  <circle cx="86" cy="196" r="7" fill="#6fcf97" />
  <text x="104" y="203" font-family="${FONT}" font-size="24" fill="#6fcf97">open to summer 2027 internships</text>

  <!-- wordmark -->
  <text x="80" y="290" font-family="${FONT}" font-size="64" font-weight="700" fill="#e8e6f0">jayden<tspan fill="#b39cff">.dev()</tspan></text>

  <!-- tagline -->
  <text x="82" y="356" font-family="${FONT}" font-size="28" fill="#8b899c">cs + linguistics @ ucla —</text>
  <text x="82" y="394" font-family="${FONT}" font-size="28" fill="#8b899c">building ai automation.</text>

  <!-- favicon mark, reproduced at 3.75x scale, unmodified -->
  <circle cx="1000" cy="315" r="230" fill="url(#violetGlow)" />
  <g transform="translate(880,195) scale(3.75)">
    <rect width="64" height="64" rx="14" fill="#0e0e16" stroke="rgba(255,255,255,0.10)" stroke-width="1" />
    <text x="14" y="46" font-family="${FONT}" font-size="38" font-weight="700" fill="#b39cff">j</text>
    <rect x="36" y="20" width="9" height="28" fill="#ffb86b" />
  </g>
</svg>
`.trim();

const sharpModule = await import('sharp');
const sharp = sharpModule.default;

await sharp(Buffer.from(svg)).png().toFile(outPath);
await writeFile(path.join(__dirname, 'og-image-source.svg'), svg);

console.log(`Wrote ${outPath}`);
