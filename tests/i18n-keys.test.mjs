// Gerbang dwibahasa (tiket #35, lanjutan temuan #30 audit-002): toggle bahasa
// hanya jujur kalau kamusnya sehat. Dua kontrak yang dijaga:
// 1. Tidak ada kunci kamus yang tak pernah dirujuk markup/JS (kunci mati).
// 2. Setiap kunci terdaftar lengkap di kamus en dan id.
// Tanpa dependensi: `node --test tests/` harus jalan offline, sama seperti app-nya.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'src/index.html'), 'utf8');
const dictBlock = html.slice(html.indexOf('const I18N'), html.indexOf('function applyLang'));

const keys = [...new Set([...html.matchAll(/'([a-z0-9]+\.[a-zA-Z0-9]+)':/g)].map((m) => m[1]))];

test('setiap kunci kamus i18n dirujuk minimal satu kali di luar kamus (tiket #35)', () => {
  const dead = keys.filter((k) => {
    const refs = (html.match(new RegExp(`['"]${k.replace(/\./g, '\\.')}['"]`, 'g')) || []).length;
    return refs <= 2; // hanya entri kamus en + id, tanpa pemakaian
  });
  assert.deepStrictEqual(
    dead,
    [],
    `kunci kamus tanpa pemakaian: ${dead.join(', ')} — wire ke markup (data-i18n*/t()) atau hapus`
  );
});

test('setiap kunci kamus i18n terdaftar lengkap di en dan id (tiket #35)', () => {
  const imbalanced = keys.filter((k) => {
    const entries = (dictBlock.match(new RegExp(`'${k.replace(/\./g, '\\.')}'`, 'g')) || []).length;
    return entries !== 2;
  });
  assert.deepStrictEqual(
    imbalanced,
    [],
    `kunci tidak lengkap di salah satu kamus (harus 2x di blok I18N): ${imbalanced.join(', ')}`
  );
});

test('title hardcoded di pasangan Undo/Redo/Language ikut kamus (tiket #35)', () => {
  // Kuncinya sudah ada; atribut title yang menembus kamus berhenti jadi konstanta.
  const count = (re) => (html.match(new RegExp(re.source || re, 'g')) || []).length;
  for (const s of [/title="Language \/ Bahasa"/, /title="Undo \(Ctrl\+Z\)"/, /title="Redo \(Ctrl\+Y\)"/]) {
    assert.strictEqual(count(s), 0, `masih hardcoded: ${s}`);
  }
  assert.match(html, /data-i18n-title="hdr\.lang"/);
  assert.match(html, /data-i18n-title="hdr\.undo"/);
  assert.match(html, /data-i18n-title="hdr\.redo"/);
  // Kontrak review-fixes: aria Undo/Redo tetap lewat kunci yang sama.
  assert.match(html, /aria-label="Undo" data-i18n-aria="hdr\.undo"/);
  assert.match(html, /aria-label="Redo" data-i18n-aria="hdr\.redo"/);
  // Opsi dithering dan label shortcut ikut toggle bahasa.
  assert.match(html, /value="floyd" data-i18n="imp\.floyd"/);
  assert.match(html, /value="bayer" data-i18n="imp\.bayer"/);
  assert.match(html, /data-i18n="tools\.shortcuts"/);
  // Hasil review: kunci hdr.grid pada label Grid yang terlihat, bukan tooltip grup.
  assert.match(html, /<span class="seg-label" data-i18n="hdr\.grid">Grid<\/span>/);
});
