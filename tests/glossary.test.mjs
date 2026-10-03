// Gerbang glosarium (tiket #36): identifier kode mengikuti kamus domain CONTEXT.md.
// "Store preview" (hindari: mockup) dan "Pixelize" (hindari: import) pada konsep
// sim channel dan konversi gambar. Tanpa dependensi: `node --test tests/` harus
// jalan offline, sama seperti app-nya.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'src/index.html'), 'utf8');
const count = (re) => (html.match(re instanceof RegExp ? new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g') : re) || []).length;

test('tidak ada identifier dengan istilah yang glosarium hindari (tiket #36)', () => {
  const forbidden = [
    [/mockup/i, 'mockup → store preview'],
    [/\.mock-[a-z]/, '.mock-* → .preview-*'],
    [/Import[A-Z]\w*\s*\(/, 'fungsi *Import* → *Pixelize* (openImageImportModal, setImportGrid, dst.)'],
    [/['"`#]import-[a-z]/, "ID/kelas elemen 'import-*' → 'pixelize-*'"],
  ];
  for (const [pattern, arah] of forbidden) {
    assert.strictEqual(
      count(pattern), 0,
      `identifier memakai istilah terlarang (${arah}): ${pattern}`
    );
  }
  // Kontrak glosarium: sisi barunya benar-benar ada, bukan cuma hilang.
  assert.match(html, /function switchPreviewTab\(/);
  assert.match(html, /id="preview-view-playstore"/);
  assert.match(html, /\.preview-tabs \{/);
  assert.match(html, /function openPixelizeModal\(\)/);
  assert.match(html, /id="pixelize-modal"/);
  assert.match(html, /function setPixelizeGrid\(/);
});
