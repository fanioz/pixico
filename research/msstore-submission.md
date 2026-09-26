# Riset: Kebutuhan Submit Pixico Studio ke Microsoft Store (MSIX, Partner Center, Akun Individu)

> Tiket: issue #6 · Tanggal: 2026-09-26 · Sumber utama: dokumentasi resmi Microsoft (learn.microsoft.com)
> Konteks: Pixico Studio = aplikasi pembuat ikon pixel art, satu file HTML, 100% offline, tanpa backend, tanpa telemetri, GRATIS. Akun Partner Center INDIVIDU sudah ada.

---

## Ringkasan eksekutif (TL;DR)

1. **Signing MSIX: GRATIS dan otomatis.** Paket MSIX/AppX yang di-upload ke Store **tidak perlu** sertifikat CA terpercaya — Microsoft Store otomatis menandatangani ulang paket dengan sertifikat Microsoft setelah lulus sertifikasi. Tidak perlu .pfx/.cer, tidak perlu token USB/HSM. Sertifikat sendiri hanya wajib jika mendistribusikan MSIX **di luar** Store.
2. **Privacy policy: praktisnya WAJIB untuk Pixico Studio.** Meskipun aplikasi 100% offline dan tidak mengumpulkan data apa pun, Store Policy 10.5.1 menyatakan produk **Desktop Bridge dan Win32 "inherently have access to Personal Information"** sehingga **selalu wajib punya privacy policy**. Kabar baik: privacy policy boleh berupa **teks yang ditempel langsung di Partner Center** (tidak wajib hosting URL).
3. **WACK (Windows App Certification Kit)** wajib dijalankan sendiri sebelum submit; tersedia di Windows SDK; ada GUI dan CLI (`appcert.exe`).
4. **Age rating**: kuesioner IARC pilihan ganda di Partner Center, wajib dijawab akurat, hasilnya dipakai untuk semua market.
5. **Lama review**: resminya **maksimal 3 hari kerja** ("can take up to three business days"), sering lebih cepat; listing tampil ~15 menit setelah publish.

---

## 1. Prasyarat akun (konteks — akun sudah ada)

- Tipe akun: **Individual** (cocok untuk pengembang tunggal / proyek pribadi) vs **Company** (badan usaha).
- Dengan onboarding baru, **tidak ada biaya registrasi** untuk kedua tipe akun: *"With the new onboarding experience, there are no registration fees for either account type"*.
- Akun individu diverifikasi dengan **ID berfoto pemerintah + selfie**.
- **Individual → Company tidak bisa diubah**; harus buat akun Company baru jika suatu saat perlu.
- Akun individu **tidak boleh** memakai "special use capabilities" (EnterpriseAuthentication, SharedUserCertificates, DocumentsLibrary) dan tidak boleh membuat produk yang meminta data finansial (10.8.3) — tidak relevan untuk Pixico.

Sumber: <https://learn.microsoft.com/en-us/windows/apps/publish/partner-center/open-a-developer-account>

---

## 2. Reserved app name & identity (dipakai saat packaging)

### Cara reserve nama

1. Login [Partner Center](https://partner.microsoft.com/dashboard) → halaman **Apps and games**.
2. **New product** → **MSIX or PWA app**.
3. Masukkan nama → **Check availability** → **Reserve product name**.
- Nama bisa di-reserve sampai 3 bulan sebelum siap publish; **reservasi hangus jika tidak dipakai dalam 3 bulan**.
- Nama aplikasi Store harus unik; tidak boleh emoji/simbol tak didukung; hindari nama trademarked.

### Bagaimana identity dipakai saat packaging

Dari halaman **Product management → Product identity** di Partner Center, ambil tiga nilai yang **wajib masuk ke AppxManifest**:

- `Package/Identity/Name`
- `Package/Identity/Publisher`
- `Package/Properties/PublisherDisplayName`

> *"Values in the manifest are case-sensitive. Spaces and other punctuation must also match."*

- Jika packaging dengan **Visual Studio** dan login dengan akun yang terkait developer account, nilai ini **diisi otomatis**.
- Jika packaging manual / tool lain (mis. MSIX Packaging Tool, PWABuilder, WebView2 wrapper), ketik nilai `Identity Name` dan `Publisher` **persis** seperti di Product identity.
- Kegagalan klasik saat upload: error *"The name found in the package is not one of your reserved app names"* → karena Identity Name di manifest ≠ nama yang di-reserve. Solusi: samakan nama paket dengan yang di-reserve (atau reserve nama tambahan).
- Informasi tambahan di halaman yang sama: **Package Family Name (PFN)** dan **Package SID** (dipakai API tertentu, bukan bagian manifest), serta Store ID (`https://apps.microsoft.com/detail/<Store ID>`).

Sumber:
- <https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/reserve-your-apps-name>
- <https://learn.microsoft.com/en-us/windows/apps/publish/view-app-identity-details>
- <https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/resolve-submission-errors>

---

## 3. Paket MSIX & signing

### Signing — jawaban tegas

> *"Your MSIX and AppX packages don't have to be signed with a certificate rooted in a trusted certificate authority when submitting to the Microsoft Store. The Microsoft Store will automatically re-sign your MSIX/AppX packages with a Microsoft certificate during the publishing process after your app passes certification."*

Artinya untuk submit via Store:

- ✅ Tidak perlu beli sertifikat code signing CA.
- ✅ Tidak perlu file .pfx/.cer dari CA.
- ✅ Tidak perlu token USB / HSM.
- ⚠️ **LARANG**: jangan sertakan file kunci privat (`.pfx`, `.snk`) **di dalam** paket — ini salah satu tes WACK (Private Code Signing) yang akan gagal.
- Self-signing sendiri hanya diperlukan untuk **distribusi di luar Store** (sideload/enterprise).
- Jalur alternatif **MSI/EXE**: Store TIDAK me-re-sign installer; wajib Authenticode-sign sendiri dengan sertifikat CA yang termasuk Microsoft Trusted Root Program, plus host installer di URL HTTPS sendiri (silent install). Untuk Pixico, jalur **MSIX lebih menguntungkan**: signing + hosting CDN gratis dari Microsoft.

### Format paket yang di-upload

- **`.msixupload`** (atau `.appxupload`) — direkomendasikan untuk Store; berisi paket untuk semua arsitektur + file simbol `.appxsym` (untuk crash analytics di Partner Center).
- Bisa juga .msix / .msixbundle / .appx / .appxbundle, tapi `.msixupload` adalah pilihan utama untuk Windows 10/11.
- Batas ukuran: 25 GB per paket/bundle. Block map hash: SHA2-256.
- **Versi paket**: bagian ke-4 dari nomor versi **harus 0** (dipesan untuk Store); bagian pertama tidak boleh 0; tiap bagian lain 0–65535.
- Target `TargetDeviceFamily` → untuk aplikasi desktop murni, targetkan **`Windows.Desktop`** (bukan `Windows.Universal`) agar tidak ditawarkan ke device family lain.
- Semua filename pakai ANSI.

### Pilihan tooling untuk membungkus Pixico Studio (satu file HTML)

Dokumentasi tidak mewajibkan tool tertentu; yang dinilai adalah hasil MSIX yang valid. Opsi realistis:

1. **PWA route**: host HTML sebagai PWA lalu generate MSIX via **PWABuilder** (isikan Identity Name/Publisher dari Partner Center) — jalur paling ringan untuk satu file HTML.
2. **WebView2 wrapper** (mis. Tauri/C#/WPF WebView2) + **Visual Studio Windows Application Packaging Project** (Desktop Bridge) — docs menyarankan paket yang berisi Win32+UWP dibuat dengan Windows Packaging Project (VS 2017 Update 4+).
3. **MSIX Packaging Tool** — konversi aplikasi yang sudah ter-install.

Sumber:
- <https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/app-package-requirements>
- <https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/upload-app-packages>
- <https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/resolve-submission-errors>

---

## 4. Checklist sertifikasi: WACK (Windows App Certification Kit)

### Cara menjalankan

**GUI (interaktif):**

1. Install **Windows SDK** (WACK termasuk di dalamnya: "Windows App Certification Kit").
2. Pastikan device sudah di-enable untuk development dan app sudah di-deploy/ter-install.
3. Start menu → **Windows Kits** → **Windows App Cert Kit**.
4. Pilih **Validate a Windows app** → pilih app dari daftar (atau browse) → **Next**.
5. Pilih alur tes sesuai tipe app → jalankan → simpan laporan (HTML + XML) → periksa hasil.

**CLI:**

```bat
:: command prompt "Run as administrator"; butuh sesi user aktif (bukan Session0)
cd "C:\Program Files (x86)\Windows Kits\10\App Certification Kit"
appcert.exe reset
appcert.exe test -packagefullname [package full name] -reportoutputpath [report.xml]
:: atau jika paket belum ter-install:
appcert.exe test -appxpackagepath [path\ke\paket.msix] -reportoutputpath [report.xml]
```

Catatan lingkungan: UAC harus aktif, resolusi minimal 1024x768; threshold performa WACK mengasumsikan komputer low-power (disarankan tes di spek rendah).

### Apa yang diuji (alur Desktop Bridge — relevan untuk aplikasi desktop MSIX)

**Required tests** (menentukan lulus/gagal Store onboarding):

| Tes | Inti pemeriksaan |
| --- | --- |
| App Capabilities (special use) | Tidak boleh declare EnterpriseAuthentication / SharedUserCertificates / DocumentsLibrary (hanya akun Company) |
| App manifest resources | resources.pri valid, semua gambar manifest ada & ukuran benar, string manifest valid |
| Branding validation | **Ikon/gambar tidak boleh default template VS/SDK** — harus asli |
| Package compliance: App Manifest | Manifest benar; pembatasan file association; framework dependency; larangan IPC via `DesktopApplicationPath` |
| Package compliance: Application Count | Satu aplikasi utama per paket; revisi versi bundle = 0 |
| Package compliance: Registry Checks | Tidak boleh meng-install **service/driver** |
| Platform appropriate files | Bitness binary harus cocok dengan arsitektur paket (tidak ada binary campur) |
| Supported API | Tidak ada API terlarang; **debug build otomatis gagal** |
| User account control (UAC) | Tidak boleh minta elevasi admin / UIAccess saat runtime |
| Windows Runtime metadata | Validitas tipe WinRT |
| Windows security features | Banned file analyzer; **tidak boleh ada .pfx/.snk di paket** |

**Optional tests** (informatif, tidak menentukan pass/fail): Digitally signed file (disarankan semua PE ter-sign — tidak wajib untuk Store), File association verbs, Debug configuration, Package sanity (archive yang berisi exe; blocked executables).

**Tes tambahan pada alur UWP/Store** (Deployment & launch, Platform version launch, Performance, File encoding UTF-8+BOM, dsb.) memantau crash/hang saat app diluncurkan.

### Hal yang paling relevan untuk Pixico Studio

- Build/kan paket dalam mode **release**, bukan debug.
- Jangan masukkan `.pfx`/`.snk` ke paket.
- Ikon/gambar bukan bawaan template.
- Jangan declare capability yang tidak dipakai (aplikasi offline tidak perlu `internetClient`).
- Aplikasi harus jalan tanpa interaksi admin dan tidak crash saat offline (Pixico offline by design — aman).

Sumber:
- <https://learn.microsoft.com/en-us/windows/uwp/debug-test-perf/windows-app-certification-kit>
- <https://learn.microsoft.com/en-us/windows/uwp/debug-test-perf/windows-app-certification-kit-tests>
- <https://learn.microsoft.com/en-us/windows/uwp/debug-test-perf/windows-desktop-bridge-app-tests>

---

## 5. Age rating (IARC)

- Saat submission pertama, Partner Center meminta **kuesioner pilihan ganda IARC** di halaman **Age ratings**.
- Pertanyaan pertama: pilih kategori yang paling menggambarkan app; jawaban itu menentukan pertanyaan lanjutan.
- **Wajib dijawab akurat**: *"You are required to answer the questions accurately."* — jawaban tidak akurat = pelanggaran kebijakan 11.11.
- Klik **Save and generate** → rating muncul dan dipakai untuk semua market. IARC mengirim email konfirmasi setelah app publish.
- Ada ikon "info" di tiap pertanyaan untuk penjelasan; bisa edit/ulang jika salah.
- Rating yang sama berlaku untuk update berikutnya; jika konten berubah, ambil ulang kuesioner (Edit).
- Untuk Pixico (editor gambar offline, tanpa konten sensitif/UGC/online): jawabannya akan menghasilkan rating rendah (semua umur); tetap jawab jujur sesuai kuesioner.

Sumber:
- <https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/age-ratings>
- Store Policies 11.11: <https://learn.microsoft.com/en-us/windows/apps/publish/store-policies>

---

## 6. Field listing wajib (checklist submission Partner Center)

Ringkasan resmi dari halaman "Create app submission for MSIX apps":

| Bagian | Field | Wajib? |
| --- | --- | --- |
| **Pricing & availability** | Markets | ✅ (default: semua market) |
| | Audience / Discoverability / Schedule | ✅ (ada default) |
| | **Base price** | ✅ → pilih **Free/Gratis** |
| **Properties** | **Category** (+ subcategory opsional) | ✅ |
| | **Privacy policy URL / teks** | ✅ **jika** app akses/kumpulkan/kirim info pribadi (lihat §7 — untuk desktop bridge praktisnya ya) |
| | Website | Opsional |
| | Support contact info | Opsional (wajib hanya untuk Xbox) |
| | Contact details (telepon/alamat) | Wajib untuk **akun company**; **opsional untuk individu** |
| | Product declarations, System requirements | Opsional |
| **Age ratings** | Semua pertanyaan IARC | ✅ |
| **Packages** | Minimal 1 paket (`.msixupload`) | ✅ |
| | Device family availability | Opsional (default dari manifest) |
| **Store listings** (min. 1 bahasa) | **Description** (maks 10.000 karakter) | ✅ |
| | **Screenshots** — minimal 1 (disarankan ≥4) | ✅ |
| | Store logos | Opsional untuk Win10/11 (wajib untuk tampilan Xbox) |
| | What's new / App features / Trailers / Keywords / dll. | Opsional |
| **Submission options** | Notes for certification | Opsional tapi **sangat disarankan** |
| | Restricted capabilities | ✅ **jika** paket declare restricted capability (Desktop Bridge memakai `runFullTrust` → jelaskan alasan singkat di sini) |

Catatan deskripsi: tanpa HTML/snippet kode/URL — taruh link support & privacy di field resminya.

Sumber:
- <https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/create-app-submission>
- <https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/add-and-edit-store-listing-info>
- <https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/enter-app-properties>
- <https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/support-info>

---

## 7. ⭐ PRIVACY POLICY — jawaban tegas untuk Pixico Studio

**Pertanyaan**: apakah privacy policy URL wajib untuk app desktop 100% offline tanpa pengumpulan data?

**Jawaban berlapis:**

1. **Aturan umum di Partner Center** — Anda harus menyatakan apakah app *"accesses, collects, or transmits personal information"*. Jika **Ya** → privacy policy **wajib**. Jika **Tidak** → opsional.
2. **TETAPI** Microsoft menambahkan dua pagar pengaman:
   - *"If we detect that your packages declare capabilities that could allow personal information to be accessed, transmitted, or collected, we will mark this question as Yes, and you will be required to enter a privacy policy."* (capability paket dapat memaksa jawaban jadi Yes secara otomatis)
   - **Store Policy 10.5.1** (versi 7.20): *"Product types that inherently have access to Personal Information must always have privacy policies. These include, but are not limited to, **Desktop Bridge and Win32 products**."*
3. **Konsekuensi untuk Pixico Studio**: karena Pixico akan dikemas sebagai **MSIX desktop (Desktop Bridge/Win32)**, privacy policy **praktis WAJIB** — meskipun aplikasi 100% offline, tanpa backend, tanpa telemetri. Menjawab "No" berisiko di-flip otomatis oleh deteksi capability (mis. `runFullTrust`) atau ditandai saat content compliance.
4. **Tidak perlu hosting**: sesuai docs terbaru, selain URL, *"you can also provide the privacy policy text directly"* — teks bisa ditempel langsung di Partner Center dan dipakai untuk semua market. (URL opsi lain: halaman GitHub Pages repo pixico.)
5. **Isi privacy policy minimal**: menyatakan bahwa Pixico Studio **tidak mengakses, mengumpulkan, menyimpan, atau mentransmisikan informasi pribadi apa pun ke luar perangkat**; semua data (proyek, gambar, ekspor ikon) diproses dan disimpan **secara lokal** oleh pengguna; tidak ada telemetri, iklan, akun, atau layanan pihak ketiga.
6. Microsoft tidak menyediakan privacy policy default: *"Microsoft doesn't provide a default privacy policy for your app."*

**Kesimpulan tegas**: anggap privacy policy sebagai item wajib. Jawab pertanyaan Partner Center dengan "Yes" (karena produk Desktop Bridge/Win32 inherent per 10.5.1) dan sediakan privacy policy pendek via teks langsung atau URL — biaya nol, menghilangkan satu penyebab penolakan.

Sumber:
- <https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/support-info>
- <https://learn.microsoft.com/en-us/windows/apps/publish/store-policies> (§10.5.1)
- <https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/enter-app-properties>

---

## 8. Penyebab penolakan paling umum (app desktop sederhana)

Dari halaman resmi "Resolve submission errors" (bagian *Avoid common certification failures*) + Store Policies:

1. **App belum "selesai"** — ada bagian kosong, link "under construction", placeholder, atau deskripsi tidak mewakili fungsi app (Store Policies 10.1).
2. **Crash / hang** — app gagal diluncurkan atau tidak responsif saat diuji (deployment & launch test); tidak stabil di beberapa konfigurasi.
3. **Gagal WACK** — debug build, API terlarang, manifest tidak valid, gambar default template (branding), resources.pri rusak, binary arsitektur campur, minta elevasi UAC, file kunci privat (.pfx/.snk) di dalam paket.
4. **Security scan gagal** — paket terdeteksi virus/malware (biasanya sistem build tercemar; rebuild di sistem bersih).
5. **Privacy policy hilang** padahal diperlukan — terutama untuk produk Desktop Bridge/Win32 (lihat §7).
6. **Age rating tidak akurat** — kuesioner IARC tidak dijawab sungguh-sungguh.
7. **Identity/nama paket tidak cocok** dengan reserved name → error preprocessing ("The name found in the package is not one of your reserved app names").
8. **App tidak testable** (perlu login/server yang mati) — untuk Pixico tidak relevan, tapi jika ada fitur tersembunyi, jelaskan di **Notes for certification**.
9. **Metadata bermasalah** — emoji di nama, keyword berlebihan, klaim kepemilikan palsu, deskripsi menyesatkan.
10. **Klaim aksesibilitas palsu** — jangan centang "accessibility" jika tidak benar-benar diuji.

Sumber:
- <https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/resolve-submission-errors>
- <https://learn.microsoft.com/en-us/windows/apps/publish/store-policies>

---

## 9. Lama review tipikal

- **Sertifikasi**: *"This process can take up to three business days"* — resmi maksimal **3 hari kerja**, sering lebih cepat (app sederhana umumnya hitungan jam–1 hari).
- Fase: **Preprocessing** → **Certification** (security scan → technical compliance (WACK) → content compliance/review manusia) → **Release** → **Publishing**.
- Setelah lulus, listing tampil di Store rata-rata **~15 menit**.
- Laporan sertifikasi diberikan jika gagal (menyebut tes/kebijakan yang dilanggar); perbaiki lalu submit ulang.
- Email tanya-jawab sertifikasi/appeal: reportapp@microsoft.com.

Sumber: <https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/app-certification-process>

---

## 10. Checklist siap-submit Pixico Studio (bisa dicentang)

**Persiapan paket**

- [ ] Reserve nama app di Partner Center (New product → MSIX or PWA app) — catat nama persisnya
- [ ] Salin identity dari **Product management → Product identity**: `Identity Name`, `Publisher`, `PublisherDisplayName`
- [ ] Bungkus Pixico Studio jadi MSIX (PWA/PWABuilder, WebView2 wrapper + VS Packaging Project, atau MSIX Packaging Tool) dengan identity persis sesuai di atas (case-sensitive)
- [ ] `TargetDeviceFamily` = `Windows.Desktop`; version `x.y.z.0` (bagian ke-4 = 0)
- [ ] Build release; ikon custom (bukan template); tanpa `.pfx`/`.snk` di paket; tanpa capability yang tidak dipakai; tidak minta elevasi admin
- [ ] Generate **`.msixupload`** (termasuk .appxsym)
- [ ] Jalankan **WACK** (`appcert.exe` / GUI) sampai lulus; simpan laporan

**Partner Center submission**

- [ ] Upload `.msixupload` di halaman **Packages**
- [ ] **Pricing**: Base price = **Free**; markets default (semua); schedule rilis ASAP
- [ ] **Properties**: pilih Category (mis. Photo & video); jawab pertanyaan personal information = **Yes** (produk Desktop Bridge/Win32 per kebijakan 10.5.1) → tempel **teks privacy policy** langsung di Partner Center (atau URL GitHub Pages)
- [ ] **Age ratings**: isi kuesioner IARC dengan akurat → Save and generate
- [ ] **Store listing** (min. 1 bahasa): deskripsi ≤10.000 karakter + **minimal 1 screenshot** (target 4+) + logo
- [ ] **Submission options**: isi **Notes for certification** (mis. "Aplikasi 100% offline, tidak perlu koneksi/jaringan; buka file lalu mulai menggambar") + penjelasan `runFullTrust` bila diminta
- [ ] Klik **Submit for certification** → tunggu ≤ 3 hari kerja → status "In the Store"

---

## Daftar sumber (prioritas learn.microsoft.com)

1. App package requirements (signing gratis oleh Store): <https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/app-package-requirements>
2. Reserve your app's name: <https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/reserve-your-apps-name>
3. View app identity details: <https://learn.microsoft.com/en-us/windows/apps/publish/view-app-identity-details>
4. Upload MSIX app packages: <https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/upload-app-packages>
5. Create app submission (checklist field wajib): <https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/create-app-submission>
6. Enter app properties: <https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/enter-app-properties>
7. Support info / privacy policy: <https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/support-info>
8. Microsoft Store Policies (§10.5 Personal Information, §11.11 Age Ratings): <https://learn.microsoft.com/en-us/windows/apps/publish/store-policies>
9. Age ratings (IARC): <https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/age-ratings>
10. App certification process (durasi & fase): <https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/app-certification-process>
11. Resolve submission errors + Avoid common certification failures: <https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/resolve-submission-errors>
12. Windows App Certification Kit (cara jalanin): <https://learn.microsoft.com/en-us/windows/uwp/debug-test-perf/windows-app-certification-kit>
13. WACK tests (detail tiap tes): <https://learn.microsoft.com/en-us/windows/uwp/debug-test-perf/windows-app-certification-kit-tests>
14. Desktop Bridge app tests: <https://learn.microsoft.com/en-us/windows/uwp/debug-test-perf/windows-desktop-bridge-app-tests>
15. Open a developer account: <https://learn.microsoft.com/en-us/windows/apps/publish/partner-center/open-a-developer-account>
16. Add and edit Store listing info: <https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/add-and-edit-store-listing-info>
