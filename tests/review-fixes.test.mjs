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
  assert.ok(count(/applyCanvasDisplaySize\(\)/) >= 3, 'harus ada definisi + panggilan di setGridSize dan applyProjectData');
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

test('#31: toggle seg-on/seg-off lewat satu helper setSegActive', () => {
  assert.match(html, /function setSegActive\(/);
  assert.strictEqual(count(/className\s*=\s*[^;\n]*seg-(on|off)/), 0, 'tidak ada lagi assignment className manual');
  assert.strictEqual(count(/classList\.remove\('seg-(on|off)'\)/), 0, 'tidak ada lagi pola remove/add manual');
  // Refactor tiket #38: segmen ukuran grid (canvas & pixelize) melalui
  // activateSegGroup di atas setSegActive, jadi pemanggil langsung menipis.
  // Yang tersisa: definisi + applyLang, setTool, switchPreviewTab, applyTheme,
  // dan activateSegGroup (yang kini melayani tiga jalur ukuran grid).
  assert.match(html, /function activateSegGroup\(/);
  assert.ok(count(/setSegActive\(/) >= 6, 'helper terpakai di semua lokasi toggle segmen');
});

test('#33: identifier memakai istilah Starter, bukan template', () => {
  const sisa = count(/TEMPLATES\b|loadTemplate|TemplateModal|template-modal|template-grid|tpl-label|tpl-item|tpl-prev|tpl\.title|tpl\.sub|tpl\.close|hdr\.templates/);
  assert.strictEqual(sisa, 0, `src/index.html masih memuat ${sisa} simbol template`);
  assert.match(html, /const STARTERS = \[/);
  assert.match(html, /function loadStarter\(starter\)/);
  const og = readFileSync(join(root, 'tools/generate-og-image.html'), 'utf8');
  assert.match(og, /win\.eval\('loadStarter\(STARTERS\[0\]\)'\)/);
  assert.strictEqual(count(/loadTemplate|TEMPLATES/, og), 0);
});

test('#32: font monospace lewat satu kelas .mono, grid palet di CSS tanpa !important', () => {
  assert.strictEqual(count(/style="[^"]*font-family:'SF Mono'/), 0, 'tidak ada lagi font-family inline');
  assert.match(html, /\.mono \{ font-family: "SF Mono", ui-monospace, monospace; \}/);
  assert.match(html, /#palette-swatches \{ display: grid; grid-template-columns: repeat\(8, 1fr\);/);
  assert.strictEqual(count(/#palette-swatches[^}]*!important/), 0, 'override !important untuk grid palet dihapus');
});

test('#30: 12 string hardcoded Indonesia ikut toggle bahasa (temuan #30 audit-002)', () => {
  // Tak ada lagi atribut/literal Indonesia yang menembus kamus:
  for (const s of [
    /aria-label="Ukuran grid"/, /aria-label="Berkas proyek"/, /aria-label="Bahasa"/,
    /title="Aplikasi Anda \(Aktif\)"/, /title="Setelan Windows"/, /aria-label="Tutup"/,
    /Resolusi Asli: \$\{/, / warna`;/, /berhasil dimuat!`/,
  ]) {
    assert.strictEqual(count(s), 0, `masih hardcoded: ${s}`);
  }
  // Semua kunci baru terdaftar di kamus en dan id (masing-masing 2x):
  for (const k of ['aria.gridSize', 'aria.projectFiles', 'aria.lang', 'common.close',
    'title.appActive', 'title.windowsSettings', 'imp.cropHint', 'imp.gridLabel',
    'imp.originalSize', 'imp.statLabel', 'toast.starterLoaded', 'ms.taskbar',
    'ms.startTip', 'ms.explorerTip']) {
    assert.strictEqual(count(new RegExp(`'${k}':`)), 2, `kunci ${k} harus ada di kamus en dan id`);
  }
  // Aria Undo/Redo ikut toggle (kunci hdr.undo/hdr.redo sudah ada sebelumnya):
  assert.match(html, /aria-label="Undo" data-i18n-aria="hdr\.undo"/);
  assert.match(html, /aria-label="Redo" data-i18n-aria="hdr\.redo"/);
  assert.match(html, /data-i18n="imp\.cropHint"/);
  assert.match(html, /data-i18n="imp\.gridLabel"/);
  assert.match(html, /data-i18n="imp\.dither"/);
});

test('#30: klaim dwibahasa kembali ke README dan kini sah', () => {
  const readme = readFileSync(join(root, 'README.md'), 'utf8');
  assert.match(readme, /Dwibahasa EN\|ID/);
  assert.match(readme, /toggle bahasa/);
});
