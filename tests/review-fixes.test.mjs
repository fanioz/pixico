// Gerbang regresi untuk perbaikan hasil review kode branch rebuild/design-md
// (tiket #29, #31, #33, #32, #30). Tanpa dependensi: `node --test tests/`
// harus jalan offline, sama seperti app-nya.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'src/index.html'), 'utf8');

function count(re, text = html) {
  return (text.match(new RegExp(re.source || re, 'g')) || []).length;
}

test('#29: ADR 0003 memuat amendment yang menunjuk DESIGN.md §10', () => {
  const adr = readFileSync(join(root, 'docs/adr/0003-rebuild-design-md.md'), 'utf8');
  assert.match(adr, /## Amendment/);
  assert.match(adr, /§10/);
});

test('#29: tidak ada lagi middle-man setLang', () => {
  assert.strictEqual(count(/function setLang\(/), 0, 'setLang dihapus, pemanggil memakai applyLang');
  assert.strictEqual(count(/onclick="setLang\(/), 0);
});

test('#29: ukuran tampilan kanvas dipasang lewat satu fungsi bersama', () => {
  assert.match(html, /function applyCanvasDisplaySize\(/);
  assert.ok(count(/applyCanvasDisplaySize\(\)/) >= 3, 'dipanggil dari setGridSize, applyProjectData, dan tersirat di jalur pemulihan');
  const onload = html.slice(html.indexOf('window.onload'));
  assert.doesNotMatch(onload, /gridCanvas\.width = SCREEN_CANVAS_SIZE/, 'jalur restore tidak menyalin isi sizing lagi');
});

test('#29: stroke crop box membaca token --accent, bukan kode warna literal', () => {
  assert.strictEqual(count(/cropCtx\.strokeStyle = '#0071e3'/), 0);
  assert.match(html, /cropCtx\.strokeStyle = getComputedStyle\(document\.documentElement\)\.getPropertyValue\('--accent'\)/);
});

test('#29: tidak ada atribut HTML berimpit tanpa whitespace', () => {
  assert.strictEqual(count(/[a-z;]"data-i18n/), 0, `ditemukan ${count(/[a-z;]"data-i18n/)} atribut berimpit`);
});
