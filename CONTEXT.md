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
