# Pixico

Aplikasi editor dan generator ikon pixel-art siap rilis ke store — web app satu file yang dibungkus menjadi aplikasi desktop lintas platform.

## Language

**Pixico**:
Nama resmi produk di semua channel (Microsoft Store, GitHub Releases, judul app). Nama lama "Pixico Studio" sudah diganti keluar (tiket #14/#15); sisa kemunculannya hanya di catatan historis (`docs/adr/`).
_Avoid_: Pixico Studio

**Aset ter-vendor**:
Dependensi yang dulu diambil dari CDN (Tailwind Play CDN, JSZip, Google Fonts) kini disalin ke `src/vendor/` dan `src/fonts/`, supaya app jalan **offline penuh** — tanpa satu pun panggilan jaringan saat runtime.

**Store sizes**:
Ukuran ikon siap rilis yang menjadi target inti aplikasi: Google Play 512×512, Apple App Store 1024×1024, Microsoft Store/MSIX.

**Canvas**:
Area gambar pixel utama; dirender di atas stage gelap dengan checker transparansi.
_Avoid_: kanvas, drawing area

**Grid**:
Ukuran matriks pixel (16/24/32/48/64). Satu canvas = satu grid.
_Avoid_: resolution, size

**Starter**:
Template ikon siap pakai yang dimuat ke canvas.
_Avoid_: template (istilah lama), preset

**Store preview**:
Simulasi tampilan ikon di channel asli (Play Store, App Store, MS Store, home screen) — konten demonya berlabel "sample/contoh".
_Avoid_: mockup

**Pixelize**:
Konversi gambar HD menjadi pixel art (crop fokus + kuantisasi + dithering).
_Avoid_: import (terlalu umum)

**Autosave**:
Pemulihan otomatis proyek dari localStorage saat app dibuka.
