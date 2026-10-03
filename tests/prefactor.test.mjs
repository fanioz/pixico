// Gerbang prefactor (tiket #38): "make the change easy, then make the easy change".
// Dua konsolidasi tanpa perubahan perilaku:
// 1. Pola lookup elemen segmen ukuran grid [16..64] yang ditulis ulang di tiga jalur
//    (setGridSize, restore autosave/applyProjectData, setPixelizeGrid) → satu helper.
// 2. Pola flex inline yang identik dan berulang → kelas layout bersama.
// Tanpa dependensi: `node --test tests/` harus jalan offline, sama seperti app-nya.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'src/index.html'), 'utf8');
const count = (re) => (html.match(re instanceof RegExp ? new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g') : re) || []).length;

test('#38: satu helper activateSegGroup melayani ketiga jalur ukuran grid', () => {
  assert.match(html, /function activateSegGroup\(/);
  // Pola map [16..64] hanya boleh ada di dalam helper, tidak lagi disalin per jalur.
  assert.strictEqual(count(/\[16, 24, 32, 48, 64\]\.map\(/), 1,
    'pola lookup segmen grid harus terkonsolidasi di activateSegGroup');
  assert.match(html, /activateSegGroup\('grid-btn', size\)/, 'jalur setGridSize');
  assert.match(html, /activateSegGroup\('grid-btn', gridSize\)/, 'jalur restore autosave (applyProjectData)');
  assert.match(html, /activateSegGroup\('pixelize-grid', size\)/, 'jalur setPixelizeGrid');
});

test('#38: pola flex inline identik tergantikan kelas bersama', () => {
  // Hanya pola yang identik dan berulang yang diekstrak; varian sekali pakai boleh inline.
  for (const s of [
    'display:flex; align-items:center; gap:8px;',
    'display:flex; align-items:center; gap:6px;',
    'display:flex; gap:4px;',
    'display:flex; justify-content:space-between; margin-bottom:2px;',
  ]) {
    const re = new RegExp(`style="[^"]*${s.replace(/[.]/g, '\\.')}`, 'g');
    assert.strictEqual(count(re), 0, `pola flex inline berulang masih inline: ${s}`);
  }
  assert.match(html, /\.row \{ display: flex; align-items: center; gap: 8px; \}/);
  assert.match(html, /\.row-sm \{ display: flex; align-items: center; gap: 6px; \}/);
  assert.match(html, /\.row-xs \{ display: flex; gap: 4px; \}/);
  assert.match(html, /\.split-sm \{ display: flex; justify-content: space-between; margin-bottom: 2px; \}/);
});
