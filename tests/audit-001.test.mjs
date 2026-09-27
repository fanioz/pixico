// Gerbang regresi untuk anti-slop/audit-001-2026-09-27.md.
// Tanpa dependensi: `node --test tests/` harus jalan offline, sama seperti app-nya.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'src/index.html'), 'utf8');
const lines = html.split('\n');

// Skala slate Tailwind v3.4 (nilai diambil dari src/vendor/tailwind.js).
const SLATE = {
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
  950: '#020617',
};

function luminance(hex) {
  const channels = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(fg, bg) {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}

function block(startMarker, endMarker) {
  const start = html.indexOf(startMarker);
  assert.notStrictEqual(start, -1, `penanda hilang di src/index.html: ${startMarker}`);
  const end = html.indexOf(endMarker, start + startMarker.length);
  assert.notStrictEqual(end, -1, `penanda hilang di src/index.html: ${endMarker}`);
  return html.slice(start, end);
}

function linesContaining(needle) {
  return lines
    .map((line, i) => ({ number: i + 1, text: line }))
    .filter(({ text }) => text.includes(needle));
}

const storeMockups = block('<!-- Live Store Mockups Card -->', '<!-- Export Center Card -->');

// Tab 1-3 mensimulasikan UI store & home screen pihak ketiga: bintang rating, ikon
// tetangga, wallpaper gradient adalah *konten* simulasi, bukan gaya Pixico sendiri.
// Region ini dikecualikan dari aturan chrome; Tab 4 (taskbar) tidak, karena di sana
// emoji dipakai sebagai ikon UI.
const simulatedListings = block(
  '<!-- Tab 1: Google Play Store Card Preview -->',
  '<!-- Tab 4:'
);
const uiChrome = html.replace(simulatedListings, '');

test('teks empty state riwayat warna lolos kontras WCAG AA (R-25)', () => {
  const line = linesContaining('Belum ada riwayat');
  assert.strictEqual(line.length, 1);

  const shade = line[0].text.match(/text-slate-(\d{3})/)?.[1];
  assert.ok(shade, 'empty state harus pakai warna teks slate eksplisit');

  // Empty state duduk di dalam Palette Card: bg-slate-900.
  const ratio = contrast(SLATE[shade], SLATE[900]);
  assert.ok(ratio >= 4.5, `kontras text-slate-${shade} di bg-slate-900 hanya ${ratio.toFixed(2)}:1`);
});

test('panel Pratinjau Store menandai angkanya sebagai data contoh (R-38/R-17)', () => {
  const playListing = block('<!-- Tab 1: Google Play Store Card Preview -->', '<!-- Tab 2:');
  const hasInventedNumber = /\d/.test(playListing);
  if (hasInventedNumber) {
    assert.match(
      playListing,
      /contoh/i,
      'rating & jumlah unduhan di mockup adalah angka karangan — jika tetap ditampilkan, panel wajib menandainya sebagai contoh'
    );
  }
});

test('tidak ada teks slate-500/600/700 (R-25 digeneralisasi)', () => {
  // Semua permukaan di app ini slate-800 atau lebih gelap; text-slate-{500,600,700}
  // kecil di atasnya jatuh di bawah 4.5:1. Disabled state sah pakai opacity — aturan ini
  // hanya menolak kelas warna teks slate yang terlalu gelap.
  const hits = lines
    .map((line, i) => ({ number: i + 1, text: line }))
    .filter(({ text }) => /text-slate-(500|600|700)\b/.test(text))
    .map(({ number }) => number);
  assert.deepStrictEqual(hits, []);
});

test('backdrop-blur hanya pada overlay modal (R-10)', () => {
  const hits = linesContaining('backdrop-blur');
  assert.ok(hits.length > 0, 'overlay modal masih perlu backdrop-blur');

  for (const { number, text } of hits) {
    assert.match(
      text,
      /fixed inset-0/,
      `backdrop-blur di luar overlay modal (src/index.html:${number})`
    );
  }
});

test('tidak ada emoji sebagai ikon UI (R-04)', () => {
  const decorative = ['📁', '⚙️', '✦', '✨', '★', '⚠️'];
  const found = decorative.filter((glyph) => uiChrome.includes(glyph));
  assert.deepStrictEqual(found, [], `emoji dipakai sebagai ikon UI: ${found.join(' ')}`);
});

test('tidak ada orb blur dekoratif (R-01)', () => {
  const hits = linesContaining('blur-2xl').concat(linesContaining('blur-3xl'));
  assert.deepStrictEqual(
    hits.map(({ number }) => number),
    [],
    'glow orb murni ornamen'
  );
});

test('gradient hanya di dalam mockup store yang disimulasikan (R-01/R-13)', () => {
  assert.ok(!uiChrome.includes('bg-gradient'), 'chrome Pixico pakai permukaan solid');
});

test('tidak ada animasi berulang tanpa henti (R-19)', () => {
  const hits = linesContaining('animate-pulse').concat(linesContaining('animate-bounce'));
  assert.deepStrictEqual(
    hits.map(({ number }) => number),
    [],
    'status statis tidak boleh berdenyut terus'
  );
});

test('em dash & link mati tetap nol (R-02/R-24)', () => {
  assert.strictEqual(linesContaining('—').length, 0);
  assert.strictEqual(linesContaining('href="#"').length, 0);
});

test('script inline masih ter-parse (gerbang sintaks)', () => {
  const inline = html.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(inline, 'script inline hilang dari src/index.html');
  assert.doesNotThrow(() => new Script(inline[1], { filename: 'src/index.html' }));
});
