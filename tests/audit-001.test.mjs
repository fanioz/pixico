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

// Empat panel simulasi store (Play / App Store / MS Store / home screen) meniru
// UI pihak ketiga: bintang rating, gloss iOS, taskbar Windows, ikon tetangga adalah
// *konten* simulasi, bukan gaya Pixico sendiri. Region ini dikecualikan dari aturan
// chrome; kartu Export center sesudahnya tetap dihitung chrome.
const simulatedListings = block(
  '<!-- Play Store: konten demo diberi label "contoh" (kejujuran audit #2) -->',
  '<h2 class="card-label" data-i18n="export.title">'
);
const uiChrome = html.replace(simulatedListings, '');

test('teks sekunder memakai token --muted yang lolos WCAG AA (R-25)', () => {
  // Empty state riwayat warna (teksnya kini via i18n) digate lewat kelasnya:
  // warna harus datang dari var(--muted), bukan token lebih redup.
  const line = linesContaining('class="recent-empty"');
  assert.strictEqual(line.length, 1, 'elemen .recent-empty hilang dari src/index.html');
  assert.doesNotMatch(line[0].text, /--meta/, 'teks jangan pakai --meta (3.5:1, hanya untuk non-teks)');

  // Token warnanya sendiri yang dicek kontrasnya di atas --bg (varian light).
  const muted = html.match(/--muted:\s*(#[0-9a-fA-F]{6})/)?.[1];
  const bg = html.match(/--bg:\s*(#[0-9a-fA-F]{6})/)?.[1];
  assert.ok(muted && bg, 'token --muted/--bg hilang dari src/index.html');
  const ratio = contrast(muted, bg);
  assert.ok(ratio >= 4.5, `--muted ${muted} di atas --bg ${bg} hanya ${ratio.toFixed(2)}:1`);
});

test('panel Pratinjau Store menandai angkanya sebagai data contoh (R-38/R-17)', () => {
  const playListing = block(
    '<!-- Play Store: konten demo diberi label "contoh" (kejujuran audit #2) -->',
    'id="mockup-view-appstore"'
  );
  const hasInventedNumber = /\d/.test(playListing);
  if (hasInventedNumber) {
    assert.match(
      playListing,
      /contoh|sample/i,
      'rating & jumlah unduhan di simulasi Play Store adalah angka karangan; jika tetap ditampilkan, panel wajib menandainya sebagai contoh'
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

test('backdrop-filter hanya di header topnav dan overlay modal (R-10)', () => {
  const headerBlock = block('header.topnav {', '}');
  const modalBlock = block('.modal-overlay {', '}');
  const hits = linesContaining('backdrop-filter');
  assert.strictEqual(
    hits.length, 2,
    'dosis glass berubah: header.topnav dan .modal-overlay saja'
  );

  for (const { number, text } of hits) {
    assert.ok(
      headerBlock.includes(text) || modalBlock.includes(text),
      `backdrop-filter di luar header.topnav / .modal-overlay (src/index.html:${number})`
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

test('og:image & twitter:image memakai aset lokal hasil generator (R-23)', () => {
  const og = linesContaining('property="og:image"');
  const tw = linesContaining('name="twitter:image"');
  assert.strictEqual(og.length, 1, 'tepat satu meta og:image');
  assert.strictEqual(tw.length, 1, 'tepat satu meta twitter:image');

  const metaContent = (line) => line.match(/content="([^"]+)"/)?.[1];

  for (const { number, text } of [...og, ...tw]) {
    const content = metaContent(text);
    assert.ok(content, `meta image tanpa content (src/index.html:${number})`);
    assert.doesNotMatch(content, /placehold\.co/i, 'og image masih placehold.co');
    assert.doesNotMatch(content, /^https?:/i, 'aset image harus lokal di repo, bukan hotlink');
  }

  // Asetnya ada di repo, benar-benar PNG, dan 1200x630 (dibaca langsung dari IHDR).
  const ref = metaContent(og[0].text);
  assert.doesNotMatch(ref, /[\\/]\.\.(?:[\\/]|$)/, 'path aset og:image harus tetap di dalam src/');
  const png = readFileSync(join(root, 'src', ref));
  assert.strictEqual(png.subarray(1, 4).toString('ascii'), 'PNG', 'aset og:image bukan PNG');
  assert.strictEqual(png.readUInt32BE(16), 1200, 'lebar og:image harus 1200');
  assert.strictEqual(png.readUInt32BE(20), 630, 'tinggi og:image harus 630');
});
