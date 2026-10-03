# Identitas visual: rebuild mengikuti DESIGN.md (light Apple-system)

Pixico memiliki dua identitas yang bertentangan: app yang berjalan (`src/index.html`, dark Tailwind slate+indigo, dibangun sebelum ada arah tertulis) dan `DESIGN.md` — arah light Apple-system dengan accent biru tunggal `#0071e3`, diekstrak pemilik dari prototype `pixico-aesthetic-editor.html` miliknya. Pemilik memutuskan (tiket #18, 2026-09-27): **app di-rebuild mengikuti DESIGN.md**; arah dark pensiun; prototype aesthetic di-commit sebagai acuan bila file-nya ditemukan.

## Considered Options

- **Pertahankan dark + tulis ulang DESIGN.md** — rilis tercepat, tapi menolak arah yang sudah jadi keinginan pemilik dan menunda identitas cozy/pastel yang menjadi alasan produk dibuat ulang.
- **Hybrid (dark untuk app, light untuk listing)** — dua identitas dalam satu produk = tidak ada identitas (R-20 antislop).

## Consequences

- Semua fitur app lama (export store 512/1024/ICO, ZIP bundle, pixelize/import, templates, autosave) harus diporting ke skin baru sebelum rilis — submit Microsoft Store menunggu rebuild selesai.
- Temuan antislop 001 #5, #9, #12 (logo gradient, panel gradient, tipografi) tuntas mengikuti token DESIGN.md: logo solid, panel flat, accent tunggal.
- Sesi rebuild bekerja di branch `rebuild/design-md`; main tetap memuat app dark yang berfungsi sampai rebuild lolos verifikasi.

## Amendment (2026-10-01, tiket #29)

Keputusan "arah dark pensiun" di atas disesuaikan: pemilik menyetujui tema gelap sebagai varian resmi di atas identitas light DESIGN.md (tercatat di §10 DESIGN.md, dibangun di branch `rebuild/design-md` sejak af9f470). Identitas light tetap menjadi basis; dark adalah varian token, bukan identitas kedua.
