# Riset: Pipeline Rilis macOS (Notarization) & Linux (AppImage/deb) — Tauri v2

> Tiket: fanioz/pixico#10 · Cabang: `research/macos-linux-release` · Tanggal: 2026-09-27
> Jalur sudah terkunci (ADR-0001 + tiket #9): wrapper Tauri v2, distribusi macOS/Linux via GitHub Releases.
> Kendala aktif: keanggotaan Apple Developer sedang diproses di #5; app gratis (bukan App Store).

## Ringkasan jawaban

- **macOS**: `tauri build --bundles dmg` sudah mengintegrasikan codesign + notarization + staple secara otomatis — cukup isi environment variable Apple. Tidak perlu panggil `codesign`/`xcrun notarytool` manual.
- **Linux**: bawaan Tauri bundler **cukup** untuk AppImage + deb, tanpa signing/notarization (tidak wajib di Linux). Yang perlu disiapkan hanya daftar paket dependensi di Ubuntu CI.
- **Publish**: `tauri-apps/tauri-action@v1` di GitHub Actions membangun per-platform dan membuat release + upload asset via GitHub API (pengganti `gh release create` manual).
- **Penghalang tunggal untuk macOS**: notarization butuh Apple Developer Program **berbayar** ($99/thn). Akun gratis hanya bisa ad-hoc signing (user masih harus whitelist di Privacy & Security). → tergantung #5.

## 1. macOS — DMG ternotarisasi

### Prasyarat (tergantung #5)

- [ ] Keanggotaan Apple Developer Program aktif (berbayar $99/thn) — akun gratis **tidak** bisa notarize.
- [ ] Buat sertifikat **Developer ID Application** (bukan Apple Distribution — itu untuk App Store). Hanya **Account Holder** yang bisa membuatnya.
  - Alur: buat CSR di Mac (Keychain Access) → upload ke developer.apple.com (Certificates, IDs & Profiles) → download `.cer` → buka agar masuk login keychain.
- [ ] (Untuk notarization) Kredensial notarytool — pilih salah satu jalur:
  - **App Store Connect API (disarankan untuk CI)**: buat API key di App Store Connect (issuer ID + Key ID + file `.p8` yang hanya bisa didownload sekali).
  - **Apple ID**: email akun + app-specific password + Team ID (dari halaman membership).

### Build lokal (macOS arm64)

- [ ] Verifikasi identitas: `security find-identity -v -p codesigning` → catat nama identity ("Developer ID Application: ...").
- [ ] Set env `APPLE_SIGNING_IDENTITY="<nama identity>"` (atau set `tauri.conf.json > bundle > macOS > signingIdentity`).
- [ ] Set kredensial notarization: `APPLE_API_ISSUER` + `APPLE_API_KEY` + `APPLE_API_KEY_PATH` (atau `APPLE_ID` + `APPLE_PASSWORD` + `APPLE_TEAM_ID`).
- [ ] Jalankan `tauri build --bundles dmg` → Tauri otomatis: sign DMG/binary → kirim ke notarytool → **staple** ke DMG. (Tambahan `--skip-stapling` bila ingin pass pertama tanpa staple.)

### Tanpa sertifikat (sementara #5 belum selesai)

- [ ] Set `signingIdentity: "-"` (ad-hoc) — mencegah app "damaged" saat didownload di Apple Silicon, tapi user tetap harus whitelist via Privacy & Security. Cukup untuk build test, tidak layak untuk rilis publik.

## 2. Linux — AppImage + deb

### Bawaan bundler cukup

- [ ] `tauri build --bundles appimage deb` (atau masukkan `"targets": ["appimage", "deb"]` di `tauri.conf.json`). Keduanya dihasilkan bundler tanpa tooling tambahan selain dependensi OS di bawah.
- [ ] Tidak ada notarization di Linux; **signing AppImage opsional** (meningkatkan trust, tidak diverifikasi otomatis oleh AppImage).

### Dependensi build di Ubuntu (CI)

- [ ] Jalankan (sesuai docs + contoh workflow tauri-action):
  ```bash
  sudo apt update
  sudo apt install -y libwebkit2gtk-4.1-dev build-essential curl wget file \
    libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev \
    patchelf xdg-utils
  ```
  (`patchelf` + `xdg-utils` dari contoh workflow tauri-action — dibutuhkan jalur AppImage.)

### Signing AppImage (opsional, bisa ditunda)

- [ ] Buat GPG key: `gpg2 --full-gen-key`, simpan backup private key.
- [ ] Env di CI: `SIGN=1`, (opsional) `SIGN_KEY=<key id>`, `APPIMAGETOOL_SIGN_PASSPHRASE=<passphrase>` (wajib di CI karena gpg tidak bisa prompt interaktif), `APPIMAGETOOL_FORCE_SIGN=1` bila ingin build gagal ketika signing gagal.
- [ ] Catatan: AppImage tidak memverifikasi signature sendiri — user verifikasi manual (`--appimage-signature` / tool `validate`). Publish key ID di channel terpercaya jika dipakai.
- deb: Tauri tidak mendokumentasikan signing deb — deploy tanpa signing.

## 3. Lokasi script build & publish di repo

- [ ] Struktur Tauri (sesuai ADR-0001): `src/` (HTML/JS) + `src-tauri/` (config Rust). Semua konfigurasi bundler di `src-tauri/tauri.conf.json` — tidak ada script build khusus per platform yang perlu ditulis.
- [ ] Workflow CI: `.github/workflows/publish.yml` — trigger `workflow_dispatch` + push tag `app-v*`. Matrix per contoh resmi:
  - `macos-latest` + `--target aarch64-apple-darwin` (dev utama arm64 — cocok),
  - `macos-latest` + `--target x86_64-apple-darwin` (Intel; cross-compile dari arm64 di mesin lokal kurang praktis — serahkan ke CI),
  - `ubuntu-22.04` (Linux x64),
  - (opsional) `windows-latest` — sudah tercakup jalur MSIX di tiket lain; bisa dikeluarkan dari matrix ini.
- [ ] Step publish memakai `tauri-apps/tauri-action@v1`:
  ```yaml
  - uses: tauri-apps/tauri-action@v1
    env:
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      # env Apple untuk macOS (lihat tabel secrets di bawah)
    with:
      tagName: app-v__VERSION__
      releaseName: 'Pixico Studio v__VERSION__'
      releaseDraft: true
      prerelease: false
      args: ${{ matrix.args }}
  ```
  Action ini membangun app, **membuat GitHub Release sendiri dan meng-upload semua bundle** (DMG, AppImage, deb) via GitHub API — tidak perlu `gh release create` manual. Draft = aman untuk review sebelum publish.
- [ ] Set `permissions: contents: write` pada job, dan aktifkan **Settings → Actions → Workflow permissions → Read and write** (token default read-only → error "Resource not accessible by integration").
- [ ] (Opsional, dikaitkan ke tiket riset updater) `uploadUpdaterJson: true` bila nanti memakai updater plugin Tauri.

### Secrets GitHub yang perlu diisi

| Secret | Kegunaan | Platform |
|---|---|---|
| `APPLE_CERTIFICATE` | `.p12` (export dari Keychain Access) di-base64: `openssl base64 -A -in certificate.p12` | macOS |
| `APPLE_CERTIFICATE_PASSWORD` | Password file `.p12` | macOS |
| `APPLE_API_ISSUER` | Issuer ID App Store Connect API | macOS (notarytool) |
| `APPLE_API_KEY` | Key ID App Store Connect API | macOS (notarytool) |
| `APPLE_API_KEY_PATH` | Path file private key `.p8` (upload sekali-download; di CI: simpan base64 sebagai secret, tulis ke file di langkah workflow) | macOS (notarytool) |
| — *alternatif API key* — | `APPLE_ID` + `APPLE_PASSWORD` (app-specific) + `APPLE_TEAM_ID` | macOS (notarytool) |
| `GITHUB_TOKEN` | Otomatis dari Actions, hanya perlu permission write | semua |
| `APPIMAGETOOL_SIGN_PASSPHRASE`, `SIGN`, `SIGN_KEY` | Signing AppImage (opsional) | Linux |

Setelah semua env Apple terisi di CI, `tauri build` di dalam tauri-action otomatis sign + notarize + staple — tidak ada langkah tambahan di workflow.

## Catatan per konteks

- **Dev utama macOS arm64**: build + test lokal DMG arm64 nyaman (cukup Xcode CLT + env Apple). Rilis Intel didelegasikan ke CI (target `x86_64-apple-darwin` di macos-latest). Universal binary bisa via `--target universal-apple-darwin` jika nanti mau satu DMG untuk kedua arsitektur.
- **App gratis**: tidak lewat App Store → `Developer ID Application` adalah sertifikat yang tepat; notarization wajib agar Gatekeeper tidak menandai app "unverified".
- **Urutan eksekusi**: (1) bangun skeleton Tauri + workflow CI dengan ad-hoc signing agar pipeline Linux/AppImage+deb hijau duluan; (2) begitu #5 selesai → isi secrets Apple → DMG ternotarisasi ikut hijau. Linux tidak diblokir apa pun.

## Sumber

- Tauri v2 — macOS Code Signing: https://v2.tauri.app/distribute/sign/macos/
- Tauri v2 — Linux Code Signing (AppImage): https://v2.tauri.app/distribute/sign/linux/
- Tauri v2 — Prerequisites (deps Ubuntu): https://v2.tauri.app/start/prerequisites/
- Tauri v2 — GitHub Actions pipeline: https://v2.tauri.app/distribute/pipelines/github/
- tauri-action (tauri-apps/tauri-action): https://github.com/tauri-apps/tauri-action
