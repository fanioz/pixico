# Identitas app: `io.github.fanioz.pixico`

Identifier Tauri dipakai sebagai identitas app yang tahan lama di ketiga OS: `CFBundleIdentifier` di macOS, nama desktop-file + app-id di Linux, folder data app (tempat `localStorage` auto-save hidup), dan identitas yang dibawa `winapp pack` saat membentuk MSIX. Nilainya diubah dari `id.pixico.studio` menjadi **`io.github.fanioz.pixico`** sebelum rilis pertama, karena dua alasan: `id.pixico.studio` masih membawa nama lama "Pixico Studio" (tiket #14/#15), dan namespace yang dirujuknya (`studio.pixico.id`) bukan domain yang dimiliki. `io.github.fanioz` merujuk namespace yang benar-benar dikuasai pemilik (github.com/fanioz), tempat rilis macOS/Linux juga didistribusikan.

## Considered Options

- **`id.pixico.studio` (status quo)** — membawa nama produk lama dan mengklaim domain `pixico.id` yang tidak dimiliki.
- **`id.pixico.app` / `com.pixico.app`** — bersih dari nama lama, tapi tetap mengklaim domain yang belum dimiliki; kalau domainnya nanti dipakai orang lain, identitas app menunjuk ke pihak lain.
- **`io.github.fanioz.pixico`** — namespace terverifikasi, dan persis konvensi yang diwajibkan Flathub kalau channel Linux itu suatu saat dibuka (saat ini ditunda).

## Consequences

- Identifier tidak lagi menyebut "Pixico Studio"; sisa nama lama hanya di catatan historis ADR-0001.
- Folder data app berubah, jadi `localStorage` (termasuk auto-save) dari build lama tidak terbaca. Aman: belum ada pengguna.
- Identitas Microsoft Store tetap datang dari Partner Center (tiket #16), bukan dari nilai ini; identifier hanya jadi identitas paket sebelum Store me-re-sign.
- Kalau nanti pemilik memakai domain sendiri, penggantian identifier harus terjadi **sebelum** rilis pertama; setelah itu biayanya adalah app yang dianggap berbeda oleh OS.
