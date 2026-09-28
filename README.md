# Pixico

<p align="center"><img src="icon-source.png" alt="Ikon Pixico" width="120"></p>

[![release](https://github.com/fanioz/pixico/actions/workflows/release.yml/badge.svg)](https://github.com/fanioz/pixico/actions/workflows/release.yml)
[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

Editor dan generator ikon pixel-art siap rilis ke Google Play, App Store, dan Microsoft Store.

Pixico adalah aplikasi desktop lintas platform (Windows, macOS, Linux) yang dibungkus Tauri v2 di atas sebuah web app satu file (`src/index.html`). Seluruh styling dan logika hidup di satu berkas HTML: CSS ditulis inline, font memakai font sistem, dan satu-satunya dependensi eksternal (JSZip) ter-vendor di `src/vendor/`, sehingga aplikasi berjalan **offline penuh**, tanpa satu pun panggilan jaringan saat runtime. Canvas, gambar, dan proyek pengguna diproses lokal di perangkat. Saat ini versi 0.1.0 (pra-rilis), gratis, dengan antarmuka dwibahasa EN|ID.

## Latar Belakang

Pixico dimulai sebagai halaman HTML tunggal untuk kebutuhan ikon sendiri, lalu disiapkan menjadi aplikasi desktop gratis yang didistribusikan lewat Microsoft Store dan unduhan langsung. Wrapper Tauri v2 dipilih agar aplikasi HTML eksisting tidak perlu ditulis ulang; paket MSIX untuk Microsoft Store dibuat lewat winapp CLI: MSIX di-upload unsigned ke Partner Center dan di-re-sign oleh Store, tanpa sertifikat Authenticode berbayar.

Keputusan arsitektur dan identitas visual didokumentasikan sebagai ADR:

- [ADR 0001: Wrapper Tauri v2 + packaging Microsoft Store lewat winapp CLI](docs/adr/0001-tauri-winapp-msix.md)
- [ADR 0002: Identitas app `io.github.fanioz.pixico`](docs/adr/0002-app-identifier.md)
- [ADR 0003: Rebuild identitas visual mengikuti DESIGN.md](docs/adr/0003-rebuild-design-md.md)

## Instalasi

Prasyarat: Node.js (LTS), Rust toolchain, dan dependensi Tauri untuk OS masing-masing, lihat [prasyarat Tauri](https://tauri.app/start/prerequisites/).

```sh
git clone https://github.com/fanioz/pixico.git
cd pixico
npm install
npm run tauri dev
```

`npm install` hanya memasang CLI Tauri; aset frontend tidak diunduh dari internet karena JSZip sudah ter-vendor dan sisanya inline di `src/index.html`.

## Penggunaan

```sh
npm run tauri dev    # jalankan app desktop dalam mode dev
npx tauri build      # build rilis (.msi/.nsis, .dmg/.app, .deb/.AppImage)
npm test             # uji audit (node --test)
```

Rilis dipicu tag `app-v*` dan dibangun otomatis untuk macOS (Apple Silicon + Intel), Linux, dan Windows oleh GitHub Actions (`.github/workflows/release.yml`).

Alur kerja di dalam app:

1. Pilih ukuran grid (16/24/32/48/64) atau mulai dari starter yang tersedia.
2. Gambar langsung di canvas, atau **Pixelize** gambar HD menjadi pixel art (crop fokus + kuantisasi + dithering).
3. Periksa tampilan lewat store preview: Google Play, App Store, Microsoft Store, dan home screen.
4. **Export** ke PNG/ICO/ZIP sesuai target store lewat dialog simpan native.

Proyek terakhir otomatis dipulihkan lewat autosave (localStorage) saat app dibuka lagi.

## Fitur

- **Grid 16/24/32/48/64**: satu canvas = satu grid, dirender di atas stage gelap ber-checker transparansi.
- **Pixelize**: konversi gambar HD menjadi pixel art (crop fokus, kuantisasi, dithering).
- **Starter**: ikon contoh siap pakai untuk memulai.
- **Store preview**: simulasi ikon di channel asli (konten demo berlabel sample/contoh).
- **Export siap store**: PNG, ICO, dan ZIP lewat dialog simpan native; membatalkan dialog berarti tidak ada berkas.
- **Ukuran target store**: Google Play 512×512, Apple App Store 1024×1024, Microsoft Store/MSIX.
- **Autosave**: pemulihan otomatis proyek dari localStorage.
- **Offline penuh**: tanpa panggilan jaringan saat runtime.
- **Dwibahasa EN|ID**: toggle bahasa di app.

## Struktur

| Jalur | Isi |
| --- | --- |
| `src/index.html` | Seluruh aplikasi (satu berkas HTML) |
| `src/vendor/` | Dependensi ter-vendor (JSZip) |
| `src-tauri/` | Wrapper Tauri v2 (Rust) + konfigurasi bundle |
| `docs/adr/` | Keputusan arsitektur |
| `tests/` | Uji audit (`npm test`) |

## Privasi

Pixico tidak mengumpulkan apa pun: berjalan sepenuhnya di perangkat, offline, tanpa akun, telemetri, iklan, maupun pelacakan. Lihat [privacy-policy.md](privacy-policy.md).

## Maintainer

[@fanioz](https://github.com/fanioz)

## Terima Kasih

- [Tauri](https://tauri.app): wrapper desktop dan plugin dialog/fs-nya.
- [JSZip](https://stuk.github.io/jszip/): pembuatan arsip ZIP pada export.

## Kontribusi

Repo ini privat; diskusi dan pelaporan bug tetap terpusat di [GitHub Issues](https://github.com/fanioz/pixico/issues). PR diterima: jalankan `npm test` sebelum mengirim, dan pastikan `npx tauri build` sukses untuk perubahan yang menyentuh app atau wrapper.

## Lisensi

UNLICENSED: proyek privat, semua hak dilindungi. © 2026 [fanioz](https://github.com/fanioz).
