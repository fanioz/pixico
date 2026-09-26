# Riset: Mekanisme Update Setelah App Terpasang

> Tiket: fanioz/pixico#11 · Cabang: `research/update-mechanisms` · Tanggal: 2026-09-27
> Jalur sudah terkunci (ADR-0001 + tiket #9/#10): wrapper Tauri v2, Windows = Microsoft Store via MSIX, macOS/Linux = GitHub Releases (DMG, AppImage, deb). App gratis. Kendala: **tidak ada server sendiri** — hanya GitHub Releases + Microsoft Store.
> Riset terkait: `research/macos-linux-release.md` (#10 — pipeline rilis; notarization tergantung #5).

## Ringkasan rekomendasi (tegas)

| Channel | v1 | Nanti (v1.x+) |
|---|---|---|
| Windows (MSIX/Store) | Otomatis oleh Store — **tidak perlu apa pun** | Sama |
| macOS (DMG) | **Manual re-download + banner "versi baru" in-app** via GitHub API | Tauri updater plugin (endpoint `latest.json` di GitHub Releases) |
| Linux AppImage | **Manual re-download** | Tauri updater (didukung untuk AppImage) |
| Linux deb | **Manual re-install** | Manual tetap (updater tidak mendukung deb) |
| Apt repo / AppImageUpdate | **Jangan** | Tidak pernah — overkill untuk solo dev |

## 1. Windows — Microsoft Store (MSIX): otomatis, tanpa kerja

Konfirmasi klaim tiket: **benar, update di-handle Store sepenuhnya.** Aplikasi MSIX yang dipublikasikan lewat Microsoft Store di-update otomatis oleh Store: developer cukup submit versi baru ke Partner Center, Store yang mendistribusikan dan memasangnya di background. Kontrol di sisi user hanyalah pengaturan Store (auto-update bisa dimatikan oleh user/admin via policy `Turn off Automatic Download and Install of updates`), bukan sesuatu yang developer kelola.

**Konsekuensi untuk kita:** tidak ada kode, infrastruktur, atau manifest update yang perlu dibuat untuk Windows. Perlu disadari saja: tiap versi melewati sertifikasi Store (bisa muncul delay rollout dibanding rilis GitHub), jadi jangan harapkan paritas versi instan antar channel.

## 2. macOS — DMG dari GitHub Releases: manual vs Tauri updater

### Opsi A: manual re-download (rekomendasi v1)

User download DMG baru dari halaman Releases dan menimpa `/Applications/Pixico.app`. Tanpa infrastruktur, tanpa kunci, tanpa risiko. Friction-nya nyata, tapi untuk app gratis dari solo dev ini standar yang wajar (banyak app indie melakukannya).

Mitigasi murah tanpa updater: **pemeriksaan versi in-app** — app memanggil GitHub API `releases/latest` (publik, gratis, tanpa signing), bandingkan dengan versi terpasang, tampilkan banner "Versi baru tersedia" + tautan ke halaman Releases. ~satu fetch + satu komponen UI; tanpa dependensi updater.

### Opsi B: Tauri updater plugin (rekomendasi untuk v1.x, bukan v1)

Fakta dari docs resmi Tauri v2 updater:

- **Signing wajib di semua platform dan tidak bisa dimatikan.** Wajib pasangan kunci `tauri signer generate`: public key di `tauri.conf.json`, private key via env `TAURI_SIGNING_PRIVATE_KEY` saat build. **Kalau private key hilang, tidak bisa menerbitkan update ke user yang sudah terpasang** — jalur update mati permanen.
- **Manifest update: static JSON di GitHub Releases cukup — tidak perlu server sendiri.** Endpoint resmi memakai pola `https://github.com/user/repo/releases/latest/download/latest.json` (URL permanen yang redirect ke asset di release terbaru). Format JSON: `version` + `platforms.{target}.url` + `platforms.{target}.signature` (isi file `.sig`, bukan path). `tauri-action` bisa membuat `latest.json` otomatis saat rilis.
- **macOS**: updater mengunduh `.app.tar.gz` + `.sig` dan mengganti app bundle; tidak lewat DMG. Artinya pipeline rilis perlu menghasilkan artifact updater tambahan (`createUpdaterArtifacts: true`).
- **Nuansa Apple**: signature Tauri updater itu sendiri terpisah dari code signing Apple. Agar pengalaman mulus (Gatekeeper tidak protes terhadap bundle yang digantikan), artifact update sebaiknya tetap di-sign + notarize dengan Developer ID yang sama — bergantung pada #5 ($99/thn, masih diproses).

### Keputusan macOS

v1: **manual + banner in-app**. Alasan: updater menambah kewajiban manajemen kunci jangka panjang, artifact `.app.tar.gz` baru, dan nilai praktisnya rendah selama notarization (#5) belum beres. Banner in-app memberi 80% manfaat (user tahu ada versi baru + diarahkan) dengan 5% biaya. Naik ke updater ketika #5 selesai dan pipeline stabil.

## 3. Linux — AppImage/deb: manual, tanpa mekanisme self-update tambahan

- **deb**: tidak ada mekanisme self-update — apt hanya jalan kalau ada **apt repository** (bukan sekadar file `.deb` di GitHub Releases). Men-host apt repo butuh tempat hosting (mis. GitHub Pages), GPG key repo, dan maintenance file `Packages` tiap rilis. Untuk solo dev dengan app gratis: **overkill, jangan**.
- **AppImage**: distribusi normalnya memang unduhan manual dari halaman author. **AppImageUpdate** ada (delta download via zsync) tapi butuh update information tertanam di dalam AppImage (line `zsync|...` di `.desktop` / metadata), file `.zsync` yang di-host di server dengan dukungan HTTP byte-range, dan tool terpisah yang adopsinya rendah. **Jangan** untuk v1.
- **Catatan penting**: Tauri v2 updater **mendukung AppImage** (bukan deb/rpm). Jadi saat nanti updater diaktifkan, user AppImage dapat auto-update dari `latest.json` yang sama dengan macOS; user deb tetap manual — tak masalah, karena user Linux terbiasa cek update sendiri.

## 4. Perbandingan ringkas

| Opsi | Infra | Biaya dev | UX user | Risiko | Verdict |
|---|---|---|---|---|---|
| Store (Windows) | 0 | 0 | Otomatis | Rollout Store bisa telat | Pakai |
| Manual re-download (macOS/Linux) | 0 | ~0 | Friction tiap versi | User telat update | **v1** |
| Banner in-app via GitHub API | 0 | Kecil | Tahu ada update, unduh sendiri | Rate limit API (cukup longgar) | **v1** |
| Tauri updater + latest.json | 0 (GitHub Releases) | Sedang (kunci, artifact) | Auto-update | Kunci hilang = update mati; perlu disiplin rilis | v1.x |
| Apt repo (GitHub Pages) | Repo kedua + key | Sedang-besar | `apt upgrade` | Maintenance permanen | Tidak |
| AppImageUpdate (zsync) | Host .zsync | Sedang | Delta update | Adopsi rendah, tooling rapuh | Tidak |

## 5. Konsekuensi & risiko rekomendasi v1

- **User macOS/Linux harus pasang ulang manual tiap versi.** Mitigasi: banner in-app + catatan update yang jelas di release notes/README. Dampak bisnis minim karena app gratis.
- **Bootstrap updater nanti butuh satu pasang manual**: user lama tidak bisa di-auto-update ke versi pertama yang membawa updater — mereka pasang manual sekali, setelah itu auto. Tak ada jalan pintas; terima sebagai biaya satu kali.
- **Jangan generate kunci signer sekarang.** Generate saat benar-benar mengaktifkan updater, lalu simpan di GitHub Actions secrets + backup offline (password manager). Kunci yang dibuat tapi tidak dibackup adalah risiko murni.
- **Disiplin `latest.json`**: begitu updater aktif, tiap rilis wajib punya manifest valid untuk semua platform yang terdaftar (JSON divalidasi menyeluruh sebelum pengecekan versi — satu entri rusak bisa menggagalkan cek). Biarkan `tauri-action` yang men-generate, jangan edit manual.

## 6. Checklist aktivasi updater (v1.x, saat #5 selesai)

- [ ] #5 selesai: Developer ID aktif, build DMG ternotarisasi stabil di CI.
- [ ] `tauri signer generate` → backup private key offline + GitHub secret `TAURI_SIGNING_PRIVATE_KEY`.
- [ ] `tauri.conf.json`: public key + `createUpdaterArtifacts: true` + `endpoints: ["https://github.com/fanioz/pixico/releases/latest/download/latest.json"]`.
- [ ] tauri-action menghasilkan `latest.json` (target `darwin-aarch64`, `darwin-x86_64`, `linux-x86_64` AppImage) di tiap release.
- [ ] UI: dialog "update tersedia → unduh → pasang → restart" (Windows installer otomatis exit saat install; macOS mengganti bundle).
- [ ] Rilis satu versi "jembatan" yang diumumkan install manual sebagai basis updater.

## Sumber

- Tauri v2 — Updater plugin (platform support, wajib signing, format manifest, static JSON + contoh endpoint GitHub Releases, perilaku per-platform): <https://v2.tauri.app/plugin/updater/>
- Tauri v2 — macOS code signing / notarization (konteks Developer ID, dirinci di riset #10): <https://v2.tauri.app/distribute/sign/macos/>
- Microsoft Learn — Manage automatic app updates (auto-update Store dikontrol di sisi user/policy): <https://learn.microsoft.com/en-us/windows/configuration/manage-automatic-app-updates>
- Microsoft Learn — Publish Windows apps (Store menangani distribusi & update app MSIX): <https://learn.microsoft.com/en-us/windows/apps/publish/>
- AppImage docs — Updating AppImages (update information tertanam, zsync): <https://docs.appimage.org/user-guide/updates.html>
- AppImageUpdate (repo, status tool): <https://github.com/AppImage/AppImageUpdate>
