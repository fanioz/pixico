// Gerbang regresi laporan pengguna (2026-10-04): grid samar ~40px terlihat di
// seluruh halaman saat dark mode, tidak terlihat di light mode. Akar masalah:
// #gridCanvas bersifat position:absolute (overlay garis pixel di atas canvas)
// tetapi tidak punya ancestor positioned, sehingga membentang menutupi viewport
// dan melayang di atas seluruh UI; garisnya rgba(255,255,255,0.08) sehingga tak
// kasatmata di atas putih (light) tapi tampak di atas #1d1d1f (dark).
// Kontrak yang dikunci: overlay terkandung di #canvas-wrapper, dan warna chrome
// canvas membaca token tema, bukan hex lama.
// Tanpa dependensi: `node --test tests/` harus jalan offline, sama seperti app-nya.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'src/index.html'), 'utf8');
const count = (re) => (html.match(re instanceof RegExp ? new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g') : re) || []).length;

function block(startMarker, endMarker) {
  const start = html.indexOf(startMarker);
  assert.notStrictEqual(start, -1, `penanda hilang di src/index.html: ${startMarker}`);
  const end = html.indexOf(endMarker, start + startMarker.length);
  assert.notStrictEqual(end, -1, `penanda hilang di src/index.html: ${endMarker}`);
  return html.slice(start, end);
}

test('#gridCanvas punya ancestor positioned: #canvas-wrapper relative', () => {
  const rule = block('#canvas-wrapper {', '}');
  assert.match(
    rule,
    /position:\s*(relative|absolute|sticky|fixed)/,
    '#canvas-wrapper wajib positioned; tanpa itu #gridCanvas (absolute) mengacu ke viewport, membentang seluruh halaman, dan menggambar grid hantu di atas semua UI'
  );
});

test('garis sumbu simetri membaca token --accent, bukan ungu identitas lama', () => {
  assert.strictEqual(
    count(/rgba\(168, 85, 247/), 0,
    'rgba(168, 85, 247, ...) adalah sisa identitas indigo/violet yang dicabut ADR-0003 (audit-002 #32)'
  );
  assert.match(
    html,
    /gridCtx\.strokeStyle = getComputedStyle\(document\.documentElement\)\.getPropertyValue\('--accent'\)/,
    'sumbu simetri mengikuti token aksen, pola yang sama dengan crop box (tiket #29)'
  );
});
