// Gerbang pembersihan CSS/JS (tiket #37): kode mati dan duplikasi kontrak yang
// ditinggalkan rebuild tidak boleh kembali. Tanpa dependensi: `node --test tests/`
// harus jalan offline, sama seperti app-nya.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'src/index.html'), 'utf8');
const count = (re) => (html.match(re instanceof RegExp ? new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g') : re) || []).length;

test('tidak ada fungsi JS mati: toggleTheme dihapus (tiket #37)', () => {
  assert.strictEqual(count(/function toggleTheme\(/), 0, 'toggleTheme tak pernah dipanggil; applyTheme yang dipakai markup');
});

test('modal punya satu kontrak pembuka: class .open, bukan .flex (tiket #37)', () => {
  // .modal-overlay sudah display:none di rule dasarnya; membuka lewat .flex menang
  // hanya karena urutan penulisan CSS. Kontrak eksplisitnya: .modal-overlay.open.
  assert.match(html, /\.modal-overlay\.open \{ display: flex; \}/);
  assert.strictEqual(count(/getElementById\('(starter|import)-modal'\)\.classList\.add\('flex'\)/), 0,
    'modal dibuka lewat .flex yang bergantung urutan rule CSS');
  assert.strictEqual(count(/getElementById\('(starter|import)-modal'\)\.classList\.add\('hidden'\)/), 0,
    'modal tidak pernah diberi .hidden di markup, jadi kontraknya cukup .open');
  assert.strictEqual(count(/getElementById\('(starter|import)-modal'\)\.classList\.add\('open'\)/), 2,
    'kedua modal (starter + pixelize) dibuka lewat .open');
});

test('rule .flex utilitas terhapus setelah tidak ada pemakai (tiket #37)', () => {
  assert.strictEqual(count(/^    \.flex \{ display: flex; \}$/m), 0, '.flex jadi kode mati begitu modal memakai .open');
});

test('header.topnav tidak dideklarasikan dua kali dengan nilai konflik (tiket #37)', () => {
  // Dua deklarasi sah: rule utama + override responsif di media query.
  assert.strictEqual(count(/header\.topnav \{/), 2,
    'header.topnav harus tinggal rule utama + override media query');
});

test('override dark memakai token, bukan hex literal (tiket #37)', () => {
  // Token-definition block ([data-theme="dark"] { ... }) sah memuat hex; override
  // komponen ([data-theme="dark"] .x { ... }) wajib lewat var().
  assert.strictEqual(count(/\[data-theme="dark"\] \.[^{]*\{[^}]*#(f5f5f7|1d1d1f)/), 0,
    'override komponen dark memakai var(--fg)/var(--bg), bukan hex');
});
