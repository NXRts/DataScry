# 🚀 Roadmap & Inventaris Fitur DataScry

Dokumen ini merangkum inventaris fitur yang telah terimplementasi serta peta jalan pengembangan fitur baru untuk **DataScry**. Seluruh fitur dibangun dengan memegang teguh filosofi inti: **100% Client-Side, Luring (Offline-First), Tanpa Pengiriman Berkas ke Server, dan Privasi Mutlak**.

---

## 📊 Matriks Status Fitur DataScry

| Modul Fitur | Kategori | Status | Keterangan Standar Fitur |
| :--- | :--- | :---: | :--- |
| **Hapus Latar Belakang Foto (Remove BG)** | Gambar & AI | ✅ Selesai | ISNet FP16 On-Device AI, HD Lossless, Presets Pas Foto, Slider Before/After |
| **JPG ke PDF** | Konversi | ✅ Selesai | *Gold Standard*: Lightbox Zoom 400%, Grid Thumbnail, Orientasi/Margin Kustom |
| **PDF ke JPG** | Konversi | ✅ Selesai | *Gold Standard*: Seleksi Halaman, Ekspor ZIP & Direct Download, Lightbox HD |
| **Kompresi PDF & Gambar (Compress)** | Optimasi | ✅ Selesai | Multi-level, kalkulator hemat byte, pratinjau sebelum & sesudah |
| **Gabung PDF (Merge PDF)** | Manajemen PDF | ✅ Selesai | Drag-to-reorder, thumbnail visual multi-halaman |
| **Pisah PDF (Split PDF)** | Manajemen PDF | ✅ Selesai | Mode rentang, halaman genap/ganjil, ekstraksi selektif |
| **Putar PDF (Rotate PDF)** | Manajemen PDF | ✅ Selesai | Rotasi 90°/180°/270° per halaman atau serentak |
| **Tanda Tangan PDF (Sign PDF)** | Tanda Tangan | ✅ Selesai | Canvas sentuh interaktif, impor stempel PNG transparan, multi-halaman |
| **Cap Air PDF (Watermark PDF)** | Keamanan | ✅ Selesai | Teks & gambar, kustomisasi opasitas, rotasi sudut, tata letak grid/pusat |
| **Kunci PDF (Protect PDF)** | Keamanan | ✅ Selesai | Enkripsi kata sandi dokumen berbasis WebAssembly |
| **Word ke PDF (Word to PDF)** | Konversi | ✅ Selesai | Rendering docx lokal langsung menjadi PDF |
| **PDF ke Word (PDF to Word)** | Konversi | ✅ Selesai | Ekstraksi teks & struktur menjadi berkas `.docx` |
| **Gabung Word (Merge Word)** | Dokumen | ✅ Selesai | Penggabungan multi-file `.docx` secara client-side |
| **Arsip ZIP (Archive ZIP)** | Utilitas Berkas | ✅ Selesai | Kompresi multi-berkas menjadi arsip `.zip` lokal |
| **Inspeksi Metadata (Metadata Viewer)** | Privasi | ✅ Selesai | Analisis atribut internal dokumen & berkas |
| **Pembersih EXIF (Scrub EXIF)** | Privasi | ✅ Selesai | Hapus metadata GPS & data sensitif kamera dari foto |
| **Sensor / Redaksi Data Sensitif** | Keamanan | ⏳ Prioritas 1 | Kotak sensor permanen untuk NIK, KK, rekening, dan tanda tangan |
| **Buka Kunci PDF (PDF Unlock)** | Keamanan | ⏳ Prioritas 2 | Hapus kata sandi dari PDF yang sudah diketahui password-nya |
| **Ekstrak & Intip ZIP (ZIP Viewer)** | Utilitas Berkas | ⏳ Prioritas 3 | Eksplorasi & ekstraksi berkas dalam ZIP tanpa aplikasi luar |
| **Penomoran Halaman (Page Numbering)** | Format PDF | ⏳ Prioritas 4 | Nomor otomatis "Halaman X dari Y", romawi, posisi & margin kustom |
| **Konverter Gambar Universal** | Gambar | ⏳ Prioritas 5 | Konversi fleksibel WebP ⇄ JPG ⇄ PNG ⇄ AVIF secara offline |
| **OCR Ekstrak Teks Dokumen** | AI & Teks | ⏳ Prioritas 6 | Pemindai teks offline dari foto/struk via Tesseract.js WebAssembly |
| **Pembuat Pas Foto Formal** | Gambar & Cetak | ⏳ Prioritas 7 | Crop rasio 2x3, 3x4, 4x6 + background pas foto + tata letak cetak A4 |

---

## 🛡️ Roadmap Fitur Baru Mendatang (Upcoming Features)

### 1. ⬛ Sensor / Redaksi Data Sensitif Permanen (PDF Redactor)
- **Status**: ⏳ Direncanakan (Prioritas 1)
- **Deskripsi**: Menutup data sensitif pribadi (NIK, nomor KK, nomor rekening bank, alamat rumah, tanda tangan lama) dengan kotak hitam/putih permanen.
- **Kasus Penggunaan**: Melindungi kerahasiaan identitas sebelum mengunggah scan KTP, formulir bank, atau dokumen legal ke platform publik/medsos.
- **Kunci Arsitektur**:
  - Teks dan gambar di bawah kotak sensor **dihapus secara permanen dari stream dokumen** (bukan sekadar overlay stiker visual yang masih bisa di-copy paste).
  - Seleksi kotak visual langsung di atas pratinjau halaman PDF.
  - Pilihan warna sensor (Hitam Pekat Redaksi / Putih Bersih).
- **Pustaka Utama**: `pdf-lib` + Canvas Rasterization Burn-in.

---

### 2. 🔓 Buka Kunci PDF (PDF Unlock & Password Remover)
- **Status**: ⏳ Direncanakan (Prioritas 2)
- **Deskripsi**: Menghapus proteksi kata sandi dari dokumen PDF yang sudah diketahui kata sandinya, sehingga berkas dapat diarsipkan atau dibuka kapan saja tanpa meminta password berulang kali.
- **Kasus Penggunaan**: Membuka e-faktur pajak bulanan, rekening koran bank, slip gaji kantor yang terkunci NIK/tanggal lahir agar mudah diarsipkan secara permanen.
- **Kunci Arsitektur**:
  - Modal input password yang aman.
  - Dekripsi lokal di memori browser dan ekspor ulang dokumen dalam format PDF standar tanpa enkripsi.
- **Pustaka Utama**: `pdf-lib`.

---

### 3. 📦 Ekstrak & Intip Isi ZIP (ZIP Unarchiver / Viewer)
- **Status**: ⏳ Direncanakan (Prioritas 3)
- **Deskripsi**: Membuka, melihat struktur folder, dan mengekstrak berkas di dalam arsip `.zip` langsung di browser tanpa perlu menginstal aplikasi seperti WinRAR atau 7-Zip.
- **Kasus Penggunaan**: Mengunduh lampiran email ZIP di perangkat publik, Chromebook, tablet, atau smartphone dan mengunduh berkas tertentu saja.
- **Fitur Utama**:
  - Pohon direktori (*tree view*) dan daftar berkas interaktif dengan ikon format.
  - Pratinjau instan untuk berkas gambar/teks di dalam ZIP.
  - Opsi: *Unduh Berkas Terpilih* atau *Ekstrak Semua*.
- **Pustaka Utama**: `jszip` (sudah terpasang di dependensi).

---

### 4. 🔢 Penomoran Halaman Otomatis (PDF Page Numbering / Bate Stamping)
- **Status**: ⏳ Direncanakan (Prioritas 4)
- **Deskripsi**: Menyisipkan nomor halaman otomatis pada dokumen PDF yang belum bernomor atau dokumen hasil penggabungan (*merge*).
- **Fitur Utama**:
  - Pilihan posisi nomor: Bawah Tengah, Bawah Kanan, Bawah Kiri, Atas Kanan.
  - Pilihan format: Angka Biasa (`1, 2, 3`), Romawi (`i, ii, iii`), atau Lengkap (`Halaman 1 dari 15`).
  - Opsi pengecualian cover (mulai nomor dari halaman 2).
  - Kustomisasi ukuran huruf, margin tepi, dan font (Helvetica, Times, Courier).
- **Pustaka Utama**: `pdf-lib`.

---

### 5. 🖼️ Konverter Format Foto Universal (WEBP ⇄ JPG ⇄ PNG ⇄ AVIF)
- **Status**: ⏳ Direncanakan (Prioritas 5)
- **Deskripsi**: Mengubah format berkas gambar secara instan antar-format modern dan format konvensional.
- **Kasus Penggunaan**: Mengubah foto `.webp` dari internet menjadi format `.jpg` atau `.png` yang diwajibkan oleh portal pendaftaran instansi resmi/pemerintah.
- **Fitur Utama**:
  - Pengaturan kualitas kompresi (10% - 100%).
  - Penghapusan atau preservasi transparansi (opsi latar belakang putih saat konversi PNG transparan ke JPG).
  - Konversi batch multi-gambar sekaligus dengan hasil unduhan ZIP.
- **Teknologi**: HTML5 Canvas & OffscreenCanvas API (native browser).

---

### 6. 📝 OCR Ekstrak Teks Dokumen (Offline Client-Side OCR)
- **Status**: ⏳ Direncanakan (Prioritas 6)
- **Deskripsi**: Memindai gambar struk belanja, kwitansi, surat edaran, atau scan buku menjadi teks digital yang dapat disalin dan diedit tanpa mengirim gambar ke server cloud.
- **Fitur Utama**:
  - Dukungan Bahasa Indonesia & Bahasa Inggris.
  - Web Worker terisolasi agar antarmuka tidak membeku selama proses pengenalan karakter.
  - Ekspor teks langsung ke Clipboard, file `.txt`, atau `.docx`.
- **Pustaka Utama**: `tesseract.js` (WebAssembly Worker lokal).

---

### 7. 📸 Pembuat Pas Foto Cetak Siap Pakai (Passport Photo Maker)
- **Status**: ⏳ Direncanakan (Prioritas 7)
- **Deskripsi**: Memotong foto wajah dengan panduan proporsi resmi, menggabungkannya dengan fitur *Hapus Latar Belakang*, dan menyusunnya ke dalam lembar cetak standar (ukuran 4R atau A4) berisi kombinasi ukuran 2×3, 3×4, dan 4×6 cm.
- **Kasus Penggunaan**: Persiapan berkas lamaran kerja, buku nikah, paspor, ijazah, atau pendaftaran CPNS/BUMN tanpa perlu ke studio foto.
- **Fitur Utama**:
  - Garis panduan posisi mata dan dagu (*facial alignment guides*).
  - Generator grid lembar cetak siap print di kertas foto.
- **Teknologi**: Canvas 2D Transform & PDF generation via `pdf-lib`.

---

## 💎 Standar Kualitas Fitur DataScry (7 Pilar Gold Standard)

Seluruh fitur baru yang akan dibangun wajib mengadopsi standar yang telah dibuktikan pada modul **JPG ke PDF**, **PDF ke JPG**, dan **Hapus Latar Belakang (Remove BG)**:

1. **Interactive Lightbox Inspection**:
   - Skala zoom halus 50% – 400% dengan mouse wheel, double click/tap, dan drag-to-pan.
   - Menggunakan sudut tajam (`rounded-none`) agar isi dokumen tidak terpotong.
2. **Visual Multi-File & Multi-Page Grid**:
   - Kartu thumbnail responsif yang menampilkan rasio aspek asli, label dimensi piksel/halaman, dan status aktif.
3. **Pembersihan Bersih (Clean Reset Lifecycle)**:
   - Tombol **Clear Semua** yang mencabut memori blob (`revokeObjectURL`), membatalkan antrean worker yang berjalan, dan mereset nilai input file secara tuntas.
4. **Indikator Progres Real-Time & Monotonik**:
   - Nilai progres hanya bergerak maju (tidak melompat mundur ke 0%).
   - Teks deskripsi fase AI / Worker informatif dan kartu HUD status yang ramah pengguna.
5. **Opsi Unduhan Fleksibel**:
   - Dukungan unduhan langsung per file (*single download*) dan pengemasan ZIP batch untuk antrean banyak file.
6. **Privasi & Keamanan Mutlak**:
   - **Nol Telemetri, Nol Pelacakan, Nol Pengiriman Server**. Semua komputasi berjalan di CPU/GPU peramban pengguna.
