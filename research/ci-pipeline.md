# Riset: Pipeline CI build & rilis otomatis (Tauri v2 + winapp CLI)

> Tiket: fanioz/pixico#13 · Cabang: `research/ci-pipeline` · Tanggal: 2026-09-27
> Jalur terkunci (ADR-0001 + tiket #3): wrapper Tauri v2; distribusi macOS/Linux via GitHub Releases; Microsoft Store via MSIX dari winapp CLI.
> Konteks: repo kecil, solo dev, app gratis, tanpa backend. Riset terkait: #6 (submit Partner Center), #10 (macOS/Linux rilis), #2 (jalur packaging).

## Ringkasan jawaban (TL;DR)

- **Satu workflow cukup**: `tauri-apps/tauri-action@v1` dengan matrix 4 job (macOS arm64, macOS Intel, Ubuntu, Windows) — trigger push tag `app-v*` + `workflow_dispatch`, output **draft GitHub Release** berisi DMG + AppImage + deb + NSIS/MSI.
- **MSIX di job Windows**: setelah tauri-action, jalankan `microsoft/setup-WinAppCli@v0.1` lalu `winapp pack` atas exe hasil build Tauri → `.msix` di-upload sebagai **workflow artifact** (bukan asset release). Upload ke Partner Center **tetap manual**.
- **Nol secret untuk MSIX/Store**: Store me-re-sign MSIX otomatis (temuan #6, dikonfirmasi guide winapp CLI) — tidak perlu sertifikat, tidak perlu credential Partner Center di CI. Identitas (Name/Publisher) dari Product identity Partner Center di-commit sebagai manifest, bukan secret.
- **Secret Apple hanya diperlukan setelah tiket #5** (Apple Developer Program aktif). Sebelum itu pipeline tetap hijau: DMG unsigned/ad-hoc, notarization menyusul.
- **Yang tetap manual**: submit Partner Center (upload paket, listing, IARC, privacy policy), WACK di PC Windows lokal, dan klik publish pada draft release.

---

## 1. Peta pipeline — tauri-action di GitHub Actions

### Trigger & struktur

- **Trigger**: `on: push: tags: ['app-v*']` + `workflow_dispatch`. Pola tag `app-v*` (bukan `v*` yang mentah) sudah jadi rekomendasi riset #10 — membedakan tag rilis app dari tag lain. tauri-action mensubstitusi `__VERSION__` dari `tauri.conf.json` (saat ini `0.1.0`, produk `Pixico Studio`).
- **Matrix** (contoh resmi README tauri-action):
  - `macos-latest` + `--target aarch64-apple-darwin` (dev utama arm64),
  - `macos-latest` + `--target x86_64-apple-darwin` (Intel — didelegasikan ke CI, cross-compile lokal tidak praktis),
  - `ubuntu-22.04` + deps apt (AppImage + deb),
  - `windows-latest` + winapp step (NSIS/MSI dari tauri-action, MSIX dari winapp).
- `fail-fast: false` agar satu platform gagal tidak membatalkan yang lain.
- **Permission**: job butuh `permissions: contents: write` (tauri-action membuat release + upload asset via GitHub API). Juga pastikan Settings → Actions → Workflow permissions → **Read and write** (default read-only → error "Resource not accessible by integration").
- **Output**: `releaseDraft: true` → release draft berisi semua asset; manusia review lalu klik Publish. Ini juga gerbang aman: MSIX belum di Partner Center saat release masih draft.
- Aksi ini **membuat release sendiri** — tidak perlu `gh release create` manual. Input relevan lain: `generateReleaseNotes`, `uploadUpdaterJson` (untuk updater plugin nanti), `uploadWorkflowArtifacts`.

### Skeleton workflow (`.github/workflows/release.yml`)

> Catatan: `src-tauri/` belum ada di `main` (masih di `prototype/desktop-wrap`) — skeleton ini mengasumsikan merge prototype. Nama exe `Pixico Studio.exe` mengikuti `productName` di `tauri.conf.json`.

```yaml
name: release
on:
  push:
    tags: ['app-v*']
  workflow_dispatch:

jobs:
  publish-tauri:
    permissions:
      contents: write
    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: 'macos-latest'   # Apple Silicon
            args: '--target aarch64-apple-darwin'
          - platform: 'macos-latest'   # Intel
            args: '--target x86_64-apple-darwin'
          - platform: 'ubuntu-22.04'
            args: ''
          - platform: 'windows-latest'
            args: ''
    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: lts/* }
      - uses: dtolnay/rust-toolchain@stable
        with:
          targets: ${{ matrix.platform == 'macos-latest' && 'aarch64-apple-darwin,x86_64-apple-darwin' || '' }}
      - name: install dependencies (ubuntu only)
        if: matrix.platform == 'ubuntu-22.04'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev build-essential curl wget file \
            libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev \
            patchelf xdg-utils
      - name: install frontend dependencies
        run: npm ci

      # Semua platform: build + buat draft release + upload asset
      - uses: tauri-apps/tauri-action@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          # --- macOS, isi SETELAH tiket #5 (Apple Developer) selesai ---
          # APPLE_CERTIFICATE: ${{ secrets.APPLE_CERTIFICATE }}          # .p12 base64
          # APPLE_CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
          # APPLE_API_ISSUER: ${{ secrets.APPLE_API_ISSUER }}            # notarytool
          # APPLE_API_KEY: ${{ secrets.APPLE_API_KEY }}                  # Key ID
          # APPLE_API_KEY_PATH: /Users/runner/AuthKey.p8                 # ditulis dari secret base64 di step sebelumnya
        with:
          tagName: app-v__VERSION__
          releaseName: 'Pixico Studio v__VERSION__'
          releaseBody: 'Lihat aset untuk mengunduh dan memasang versi ini.'
          releaseDraft: true
          prerelease: false
          args: ${{ matrix.args }}

      # ===== Windows saja: MSIX untuk Microsoft Store =====
      - name: setup WinApp CLI
        if: matrix.platform == 'windows-latest'
        uses: microsoft/setup-WinAppCli@v0.1

      - name: pack MSIX (unsigned — Store me-re-sign)
        if: matrix.platform == 'windows-latest'
        shell: pwsh
        run: |
          New-Item -ItemType Directory -Force dist | Out-Null
          Copy-Item 'src-tauri/target/release/Pixico Studio.exe' 'dist/'
          # Package.appxmanifest di-commit di root (dibuat sekali via `winapp manifest`)
          winapp pack .\dist

      - name: upload MSIX sebagai artifact
        if: matrix.platform == 'windows-latest'
        uses: actions/upload-artifact@v4
        with:
          name: msix-store
          path: '*.msix'
```

### Alternatif install winapp di runner

- **Direkomendasikan**: `microsoft/setup-WinAppCli@v0.1` — action resmi untuk GitHub Actions/Azure DevOps (ada juga task Azure `UseWinAppCLI@0`). Masih `v0.1` (muda) — pin versinya, review changelog sebelum bump.
- **Alternatif**: `winget install Microsoft.winappcli --source winget`. Winget **preinstalled** di runner GitHub windows-latest (image windows-2022/2025), tapi di CI non-interaktif perlu flag `--accept-package-agreements --accept-source-agreements --disable-interactivity`; action setup menghindari kerapuhan ini. Opsi lain: unduh binary dari GitHub Releases winappCli.

---

## 2. Langkah winapp CLI di Windows runner

Alur dari guide resmi winapp CLI untuk Tauri (`docs/guides/tauri.md`):

1. **Sekali, di lokal (bukan CI)**: `winapp init` (jawab "Do not setup SDKs" — Tauri pakai crate `windows` Rust) atau `winapp manifest` → menghasilkan `Package.appxmanifest` + folder `Assets`. **File ini di-commit ke repo** dan diedit dengan nilai Partner Center (lihat bawah). `winapp init` interaktif — jangan dijalankan di CI.
2. **Per rilis, di CI**:
   - Stage exe Tauri ke folder `dist` (hanya exe utama, bukan seluruh `target\release`): `Copy-Item 'src-tauri/target/release/Pixico Studio.exe' 'dist/'`.
   - `winapp pack .\dist` → manifest disalin ke folder target, `.msix` muncul di direktori kerja dengan nama otomatis dari manifest (`<name>_<version>_<arch>.msix`).
   - **Tanpa `--cert`** untuk jalur Store: guide menyatakan eksplisit "the Store will sign the MSIX for you, no need to sign before submission". (`winapp cert`/`--cert` hanya untuk tes lokal via `Add-AppxPackage`.)
3. **Output** di-upload sebagai workflow artifact (bukan asset release) — konsumennya adalah submit Partner Center manual.

### Identitas & versi (menyambung riset #6)

- Isi manifest dari halaman Partner Center **Product management → Product identity**: `Package/Identity/Name`, `Package/Identity/Publisher`, `Properties/PublisherDisplayName` — **case-sensitive persis**; kalau tidak cocok dengan nama yang di-reserve → error "The name found in the package is not one of your reserved app names".
- **Versi**: segmen ke-4 harus `0` (dipesan Store). `tauri.conf.json` `0.1.0` → manifest `Version="0.1.0.0"`. Bump keduanya per rilis (manifest di-commit, jadi jelas di diff).
- Target `TargetDeviceFamily` → `Windows.Desktop`. Arsitektur: windows-latest build x64 dulu; Arm64 menyusul bila perlu (paket terpisah).
- WACK (Windows App Certification Kit) **tidak jalan di CI** dengan andal (butuh sesi user interaktif, bukan Session 0) → jalankan manual di PC Windows sebelum submit (`appcert.exe test -appxpackagepath ...`).

---

## 3. Secrets yang dibutuhkan (dan kapan)

| Secret | Kegunaan | Platform | Kapan wajib |
|---|---|---|---|
| `GITHUB_TOKEN` | Buat release + upload asset | semua | Otomatis (bukan secret milik sendiri); cukup `permissions: contents: write` |
| `APPLE_CERTIFICATE` | `.p12` Developer ID Application di-base64 (`openssl base64 -A -in cert.p12`) | macOS | Setelah #5 aktif |
| `APPLE_CERTIFICATE_PASSWORD` | Password file `.p12` | macOS | Setelah #5 |
| `APPLE_API_ISSUER` | Issuer ID App Store Connect API | macOS (notarytool) | Setelah #5 (jalur disarankan untuk CI) |
| `APPLE_API_KEY` | Key ID App Store Connect API | macOS (notarytool) | Setelah #5 |
| `APPLE_API_KEY_PATH` | Path file `.p8` — di CI: simpan base64 sebagai secret, tulis ke file di step sebelumnya | macOS (notarytool) | Setelah #5 |
| *(alternatif Apple)* | `APPLE_ID` + `APPLE_PASSWORD` (app-specific) + `APPLE_TEAM_ID` | macOS (notarytool) | Setelah #5 — pilih salah satu jalur |
| *(opsional)* `SIGN`, `SIGN_KEY`, `APPIMAGETOOL_SIGN_PASSPHRASE` | Signing AppImage (GPG) | Linux | Opsional, bisa ditunda tanpa blokir |

**Tidak ada secret untuk MSIX/Partner Center.** Store me-re-sign; identitas ada di manifest yang di-commit. Perhatian: jangan pernah memasukkan `.pfx`/`.snk` ke dalam paket (tes WACK "Private Code Signing" gagal — #6). Dev cert winapp (`winapp cert generate/install`) hanya untuk instalasi tes lokal, tidak masuk CI.

---

## 4. Otomatis di CI vs tetap manual

| Pekerjaan | Status | Catatan |
|---|---|---|
| Build MSI/NSIS (Windows) | **CI** | tauri-action, asset draft release |
| Build DMG arm64 + Intel (macOS) | **CI** | tauri-action, dua target matrix |
| Build AppImage + deb (Linux) | **CI** | tauri-action + deps apt |
| Notarization + staple macOS | **CI** (otomatis) | `tauri build` menangani semua begitu env Apple terisi — bukan kerjaan manual |
| Generate MSIX (winapp pack) | **CI** | job Windows, output artifact |
| **Submit Partner Center** | **Manual** | Upload `.msix`/`.msixupload` via web Partner Center + listing + IARC age rating + privacy policy (checklist lengkap di riset #6). Otomatisasi API submission ada (`winapp store` membungkus Microsoft Store Developer CLI) tapi overkill untuk solo dev rilis jarang — pertimbangkan nanti |
| **WACK** | **Manual** | PC Windows lokal, `appcert.exe` (#6) |
| **Publish draft release** | **Manual** | Review asset draft di GitHub, klik Publish — sinkron dengan submit Store agar versi rapi |

---

## 5. Batasan & risiko

- **Jalur winapp CLI bukan jalur yang didokumentasikan Tauri** (ADR-0001) — skeleton harus divalidasi di tiket prototype dulu; eksekusi Windows Tauri menghasilkan `Pixico Studio.exe` yang saat ini belum bisa di-pack bila ada sidecar/WebView2 loader tambahan (belum ada — risiko rendah).
- `setup-WinAppCli` masih `v0.1`; winapp CLI sendiri masih berkembang (perintah/flag bisa bergeser) — pin versi, cek release notes sebelum bump.
- `Package.appxmanifest` dan folder `Assets` (ikon Store) wajib di-commit — jangan generate di CI (`winapp init` interaktif, `manifest` perlu jawaban identitas).
- DMG unsigned/ad-hoc (`signingIdentity: "-"`) sampai #5 selesai: app jalan tapi user harus whitelist via Privacy & Security — layak untuk smoke test CI, bukan rilis publik.
- Tag `app-v*` di-push → workflow jalan. Untuk re-run tag sama, tauri-action **meng-update release yang ada** (draft tetap draft) — aman untuk retry.
- Biaya: repo publik → GitHub-hosted runner gratis; macOS runner 10× multipler biaya di repo privat — bukan masalah untuk kasus ini.

## 6. Langkah implementasi (usulan)

1. Merge prototype (`src-tauri/`) → commit `Package.appxmanifest` + `Assets` dengan identitas Partner Center (reserve nama dulu bila belum — #6 §2).
2. Tambahkan `.github/workflows/release.yml` dari skeleton atas; jalankan via `workflow_dispatch` dengan `releaseDraft: true` — validasi Linux hijau dulu (tidak diblokir apa pun).
3. Tag uji `app-v0.1.0` → validasi 4 job + artifact MSIX; tes `Add-AppxPackage` MSIX hasil CI di PC Windows + WACK.
4. Setelah #5: isi secrets Apple, hapus komentar env — DMG ternotarisasi otomatis.
5. Submit pertama ke Partner Center manual (checklist #6); publikasikan draft release setelah app lolos sertifikasi.

## Sumber

- tauri-action (tauri-apps/tauri-action) — README, contoh workflow, input matrix: <https://github.com/tauri-apps/tauri-action>
- Tauri v2 — GitHub Actions pipeline: <https://v2.tauri.app/distribute/pipelines/github/>
- winapp CLI (microsoft/winappCli) — README (install winget/setup action, commands overview): <https://github.com/microsoft/winappCli>
- winapp CLI — Guide Tauri (init/manifest/pack, Store re-sign): <https://github.com/microsoft/winappCli/blob/main/docs/guides/tauri.md>
- setup-WinAppCli action: <https://github.com/microsoft/setup-WinAppCli>
- Riset internal: #6 `research/msstore-submission.md` (Partner Center, re-sign, WACK, versi), #10 `research/macos-linux-release.md` (secrets Apple, deps Linux, tauri-action), #2 `research/packaging-routes.md` (keputusan jalur)
