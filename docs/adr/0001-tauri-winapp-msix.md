# Wrapper Tauri v2 + packaging Microsoft Store lewat winapp CLI

Pixico Studio dirilis sebagai app desktop (Windows/macOS/Linux) tanpa menulis ulang aplikasi: HTML eksisting dibungkus **Tauri v2**, dengan source direstrukturisasi minimal ke `src/` dan dependensi CDN (Tailwind Play CDN, JSZip, Google Fonts) di-vendor agar jalan offline penuh. Paket Microsoft Store dibuat lewat **winapp CLI** (`microsoft/winappCli`, resmi Microsoft, ada sampel Tauri) dari hasil `tauri build`: MSIX di-upload unsigned ke Partner Center dan di-re-sign oleh Store — tanpa sertifikat Authenticode berbayar, update di-handle Store.

## Considered Options

- **Electron** — target MSIX first-class, tapi bundle ~150–200 MB (bawa Chromium sendiri) untuk app 124 KB.
- **Avalonia** — jalur MSIX paling mulus (Parcel), tapi berarti port ulang seluruh UI + logika ke C#/XAML (orde minggu, risiko regresi fitur).
- **PWABuilder** — butuh hosting PWA + manifest + service worker; tidak selaras syarat offline.
- **Tauri + Win32 linked-installer** (jalur resmi docs Tauri) — butuh sertifikat Authenticode berbayar berkelanjutan (wajib hardware token) + auto-update di-handle sendiri via updater plugin.
- **Tauri + MSIX manual (MakeAppx / MSIX Packaging Tool)** — digantikan winapp CLI yang resmi dari Microsoft dan didokumentasikan untuk Tauri.

## Consequences

- Kode Rust hanya konfigurasi Tauri; logika aplikasi tetap HTML/JS satu keluarga file di `src/`.
- Jalur packaging Store (winapp CLI) bukan jalur yang didokumentasikan Tauri sendiri — perlu divalidasi lebih dulu di tiket prototype.
- Bundle Windows kecil (WebView2 milik OS, mode `offlineInstaller`); konsekuensi vendor aset: aplikasi wajib berjalan offline penuh, tidak ada panggilan CDN apa pun.
