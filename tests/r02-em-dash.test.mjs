// Gerbang regresi R-02 (tiket #34): em dash harus nol di README dan di seluruh
// teks yang disajikan ke pengguna, supaya klaim "em dash nol" dari audit antislop
// tetap terlindungi oleh test, bukan cuma oleh ingatan. Carve-out R-02 hanya
// berlaku untuk dokumen anti-slop sendiri, dan dokumen itu memang berada di
// luar cakupan pemindaian (README + copy UI), jadi tidak dibaca di sini.
// Tanpa dependensi: `node --test tests/` harus jalan offline, sama seperti app-nya.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('em dash nol di README dan copy UI (R-02, tiket #34)', () => {
  for (const file of ['README.md', 'src/index.html']) {
    const hits = readFileSync(join(root, file), 'utf8')
      .split('\n')
      .map((line, i) => ({ baris: i + 1, line }))
      .filter(({ line }) => line.includes('\u2014'));
    assert.deepStrictEqual(
      hits,
      [],
      `em dash ditemukan di ${file}; R-02 melarangnya di teks apa pun di luar dokumen anti-slop`
    );
  }
});
