# Riset: Jalur Packaging Desktop — Tauri vs Electron vs PWABuilder

> Resolusi untuk tiket [Riset: jalur packaging desktop (Tauri vs Electron vs alternatif)](https://github.com/fanioz/pixico/issues/2).
> Kendala tetap: dev utama di macOS, PC Windows tersedia untuk build/test, akun Microsoft Partner Center individu sudah ada, app **gratis** dan harus **jalan offline penuh**.

## Konteks aplikasi

`pixico_studio.html` — satu file HTML 124 KB, client-side murni, tanpa backend. Dependensi CDN: Tailwind (cdn.tailwindcss.com — **Play CDN, runtime JIT di browser**), JSZip (cdnjs), Google Fonts (Inter + Press Start 2P).

## Perbandingan

| Kriteria | Tauri v2 | Electron | PWABuilder (PWA→MSIX) |
| --- | --- | --- | --- |
| MSIX untuk Microsoft Store | **Tidak dari bundler resmi** — bundler menghasilkan EXE (NSIS) / MSI. Jalur Store resmi Tauri: **Win32 linked-installer** (listing Store yang menautkan installer EXE/MSI) | **Ya, langsung** — target `msix`/`appx` di electron-builder (build harus di Windows) | **Ya** — MSIX digenerate dari PWA yang di-hosting |
| Notarization macOS | Terdokumentasi rapi di docs Tauri: Developer ID Application cert + notarytool (via App Store Connect API key atau Apple ID app-specific password), integrasi `tauri build --bundles dmg` | Matang (electron-builder `notarize: true` + credential yang sama) | Tidak relevan (jalur web) |
| Ukuran bundle | **~3–10 MB** (pakai WebView2/WKWebView/WebKitGTK milik OS) | ~150–200 MB (bawa Chromium sendiri) | Terkecil (hanya manifest), tapi app = tab browser |
| Offline penuh | **By design** — frontend di-embed ke binary; CDN dihapus begitu aset di-vendor | Bisa (aset dibundel), tapi runtime tetap besar | Tidak natural — butuh hosting + service worker agar cache penuh; tanpa hosting, app butuh online |
| Effort | Sedang: project `src-tauri` + konfigurasi; hanya 3 target bundel dari satu kode | Sedang-rendah untuk build, tapi konfigurasi MSIX + ukuran/ram jadi beban jangka panjang | Rendah awal, tapi menambah kebutuhan hosting website + manifest + SW |
| Risiko sertifikasi Store | Jalur Win32: **wajib silent install** (NSIS `/S`, MSI `/quiet`), offline installer, code signed, auto-update — dijelaskan eksplisit di docs Tauri (rejection 10.2.9.2 kalau tidak silent) | Jalur MSIX: riset submit Store (#6) menunjukkan Store me-re-sign MSIX, WACK tetap wajib | MSIX tipis kadang ditolak karena "app terasa seperti web" |

## Temuan penting yang mengoreksi asumsi tiket

Pertanyaan tiket mengasumsikan output MSIX dari wrapper. Faktanya **Tauri tidak memproduksi MSIX** — docs resminya (tauri.app/distribute/microsoft-store) mengarahkan submission Store berupa **Win32 app (EXE/MSI linked-installer)** dengan syarat: offline installer (`webviewInstallMode: offlineInstaller`), silent install, code signed, dan auto-update (updater plugin). Kalau MSIX tetap diinginkan di jalur Tauri, harus dibungkus manual (MSIX Packaging Tool / MakeAppx) — tidak didukung bundler. Electron satu-satunya yang punya target MSIX first-class.

## Catatan dependensi CDN (feed untuk tiket keputusan arsitektur)

- **Tailwind Play CDN** resmi "not for production"; itu script JIT yang generate style saat runtime. Dua opsi: (a) vendor script-nya apa adanya — jalan offline, cukup untuk app sekecil ini; (b) lebih bersih: pindah ke **Tailwind CLI build** menghasilkan CSS statis. Keputusan di tiket keputusan arsitektur.
- **JSZip**: unduh `jszip.min.js` sekali, hidupkan lokal/inline — tanpa risiko.
- **Google Fonts**: unduh WOFF2 Inter + Press Start 2P, hidupkan via `@font-face` lokal (hindari panggilan `fonts.googleapis.com`).

## Rekomendasi

**Tauri v2** — satu kode untuk ketiga target (MSI/NSIS + DMG + AppImage/deb), bundle terkecil, offline by design, notarization macOS terdokumentasi baik, dan jalur Microsoft Store resmi (Win32 linked-installer) terdokumentasi eksplisit termasuk jebakan silent-install. Electron hanya menang di "MSIX langsung" — dengan biaya bundle ~20× lebih besar dan runtime berat untuk app 124 KB. PWABuilder tidak selaras dengan syarat offline + tidak mau hosting website.

Jalur Win32 vs paksa MSIX di jalur Tauri = keputusan untuk tiket [Keputusan: pilih jalur packaging & arsitektur build](https://github.com/fanioz/pixico/issues/3), dengan input dari riset submit Store (#6): jalur MSIX memanfaatkan re-sign Store dan tidak butuh sertifikat sendiri; jalur Win32 linked-installer butuh code signing sendiri + silent flags.

## Sumber

- Tauri — Distribute to Microsoft Store: https://v2.tauri.app/distribute/microsoft-store/
- Tauri — Code Signing macOS (Developer ID + notarization): https://v2.tauri.app/distribute/sign/macos/
- electron-builder — MsixOptions (MSIX/AppX target): https://www.electron.build
- Microsoft Learn — MSIX Packaging Tool (fallback pembungkus EXE→MSIX): https://learn.microsoft.com/en-us/windows/msix/packaging-tool/packaging-tool
- PWABuilder: https://www.pwabuilder.com / https://docs.pwabuilder.com
