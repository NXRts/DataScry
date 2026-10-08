# 🚀 Roadmap & Inventaris Fitur DataScry

Dokumen ini merangkum inventaris seluruh fitur yang telah terimplementasi serta peta jalan pengembangan fitur baru untuk **DataScry**. Seluruh fitur dibangun dengan memegang teguh filosofi inti: **100% Client-Side, Luring (Offline-First), Tanpa Pengiriman Berkas ke Server, dan Privasi Mutlak**.

---

## 📊 Matriks Status Fitur DataScry

### 1. Fitur yang Sudah Aktif & Siap Digunakan (✅ 21 Alat Aktif)

Semua alat di bawah ini telah terpasang, teruji via build Next.js, dan aktif di navigasi/katalog utama [HomeGrid.tsx](file:///home/nxrts/ProgramKoding/DataScry/src/components/home/HomeGrid.tsx):

| No | Modul Fitur | Kategori | Rute Halaman | Status & Keterangan Standar Fitur |
| :-: | :--- | :--- | :--- | :--- |
| 1 | **Hapus Latar Belakang Foto (Remove BG)** | Gambar & AI | `/tools/remove-background` | ✅ Aktif (ISNet FP16 On-Device AI, HD Lossless, Presets Pas Foto, Slider Before/After) |
| 2 | **Potong & Pas Foto (Crop & Resize)** | Manipulasi Gambar | `/tools/crop-image` | ✅ **Rilis Baru** (Preset Pas Foto 2×3, 3×4, 4×6 cm, Atur Piksel Presisi, Rotasi/Flip, Rule of Thirds) |
| 3 | **Sensor & Blur Foto (Blur Face & Privacy)** | Privasi Gambar | `/tools/blur-face` | ✅ **Rilis Baru** (Gaussian Blur, Mosaik TV, Sensor Hitam, Kuas Sentuh & Kotak Drag, Hold to Compare Asli, Ekspor HD) |
| 4 | **JPG ke PDF** | Konversi | `/tools/jpg-to-pdf` | ✅ Aktif (*Gold Standard*: Lightbox Zoom 400%, Grid Thumbnail, Orientasi/Margin Kustom) |
| 5 | **PDF ke JPG** | Konversi | `/tools/pdf-to-jpg` | ✅ Aktif (*Gold Standard*: Seleksi Halaman, Ekspor ZIP & Direct Download, Lightbox HD) |
| 6 | **Kompresi Dokumen & Foto (Compress)** | Optimasi | `/tools/compress` | ✅ Aktif (Smart Compression multi-level, kalkulator hemat byte, pratinjau sebelum/sesudah) |
| 7 | **Gabung PDF (Merge PDF)** | Manajemen PDF | `/tools/merge-pdf` | ✅ Aktif (Drag-to-reorder, thumbnail visual multi-halaman) |
| 8 | **Pisah PDF (Split PDF)** | Manajemen PDF | `/tools/split-pdf` | ✅ Aktif (Mode rentang, halaman genap/ganjil, ekstraksi selektif) |
| 9 | **Atur & Kelola Halaman PDF (Organize PDF)** | Manajemen PDF | `/tools/organize-pdf` | ✅ **Rilis Baru** (Drag & drop visual reorder, hapus, putar 90°, duplikasi halaman, tambah PDF) |
| 10 | **Putar PDF (Rotate PDF)** | Manajemen PDF | `/tools/rotate-pdf` | ✅ Aktif (Rotasi 90°/180°/270° per halaman atau serentak) |
| 11 | **Tanda Tangan PDF (Sign PDF)** | Tanda Tangan | `/tools/sign-pdf` | ✅ Aktif (Canvas sentuh interaktif, impor stempel PNG transparan, multi-halaman) |
| 12 | **Cap Air PDF (Watermark PDF)** | Keamanan | `/tools/watermark-pdf` | ✅ Aktif (Teks & gambar, kustomisasi opasitas, rotasi sudut, tata letak grid/pusat) |
| 13 | **Kunci PDF (Protect PDF)** | Keamanan | `/tools/protect-pdf` | ✅ Aktif (Enkripsi kata sandi dokumen berbasis WebAssembly) |
| 14 | **Buka Kunci PDF (PDF Unlock)** | Keamanan | `/tools/unlock-pdf` | ✅ Aktif (Hapus proteksi password permanen, dekripsi AES-256 & RC4 client-side) |
| 15 | **Sensor Data Sensitif PDF (PDF Redactor)** | Keamanan & Privasi | `/tools/redact-pdf` | ✅ **Rilis Baru** (*True Redaction*: Burn-in pixel bitmap, musnahkan aliran teks sensitif, 3 gaya sensor) |
| 16 | **Word ke PDF (Word to PDF)** | Konversi | `/tools/word-to-pdf` | ✅ Aktif (Rendering docx lokal langsung menjadi PDF) |
| 17 | **PDF ke Word (PDF to Word)** | Konversi | `/tools/pdf-to-word` | ✅ Aktif (Ekstraksi teks & struktur menjadi berkas `.docx`) |
| 18 | **Gabung Word (Merge Word)** | Dokumen | `/tools/merge-word` | ✅ Aktif (Penggabungan multi-file `.docx` secara client-side) |
| 19 | **Arsip ZIP (Archive ZIP)** | Utilitas Berkas | `/tools/archive-zip` | ✅ Aktif (Kompresi multi-berkas menjadi arsip `.zip` lokal) |
| 20 | **Inspeksi Metadata (Metadata Viewer)** | Privasi | `/tools/metadata-viewer` | ✅ Aktif (Analisis atribut internal dokumen & berkas) |
| 21 | **Pembersih EXIF (Scrub EXIF)** | Privasi | `/tools/scrub-exif` | ✅ Aktif (Hapus metadata GPS & data sensitif kamera dari foto) |

---

## 🎯 Rekomendasi Teratas untuk Pengembangan Selanjutnya

Setelah sukses mengimplementasikan **Sensor & Blur Foto (`/tools/blur-face`)**, berikut adalah 5 fitur terbaik berikutnya yang siap diimplementasikan:

---

### 🥇 1. Ekstrak & Intip Isi ZIP (ZIP Viewer & Unarchiver)
- **Kategori**: Utilitas Berkas (`/tools/unzip`)
- **Tingkat Rekomendasi**: **Sangat Tinggi (Pilihan Utama)**
- **Kenapa Paling Kuat?**:
  1. **Menutup Siklus Arsip ZIP**: DataScry sudah memiliki `/tools/archive-zip` (pembuat arsip ZIP) dan fitur lain (PDF ke JPG, Crop, Kompres) menghasilkan unduhan berkas ZIP. Alat ini melengkapi pasangannya agar pengguna bisa membuka kembali arsip tersebut.
  2. **Buka ZIP Tanpa Aplikasi Tambahan**: Pengguna smartphone atau Chromebook yang tidak punya aplikasi pembuka file ZIP bawaan dapat melihat isi berkas langsung di peramban.
  3. **Aman & Bebas Virus**: Berkas ZIP diperiksa dan diekstrak di sandbox peramban tanpa risiko malware menginfeksi sistem operasi lokal.
- **Fitur Utama**:
  - Penjelajah hierarki folder ZIP (Tree View / List View).
  - Pratinjau berkas langsung (teks, gambar, PDF) sebelum diekstrak.
  - Ekstraksi selektif (unduh 1 berkas tertentu saja) atau ekstrak seluruhnya.
- **Estimasi Teknologi**: `jszip` (sudah terpasang di dependensi proyek, *zero new package*).

---

### 🥈 2. Konverter Format Gambar Universal (Universal Image Converter)
- **Kategori**: Manipulasi Gambar (`/tools/convert-image`)
- **Tingkat Rekomendasi**: **Tinggi (Solusi Masalah Harian)**
- **Kenapa Sangat Dibutuhkan?**:
  1. **Masalah Format WebP**: Hampir semua situs web modern mengunduh gambar sebagai `.webp`, namun portal pendaftaran resmi (CPNS, BUMN, perbankan, kampus) mewajibkan format `.jpg` atau `.png`.
  2. **Konversi Dua Arah Cepat**: Mendukung konversi batch WebP ⇄ JPG ⇄ PNG ⇄ AVIF.
  3. **Hemat Kuota & Cepat**: Konversi puluhan gambar selesai dalam 1 detik karena diproses langsung oleh kartu grafis/CPU pengguna.
- **Fitur Utama**:
  - Pilihan target format (JPG, PNG, WebP).
  - Slider kualitas kompresi untuk output JPG/WebP (1% - 100%).
  - Multi-file batch processing dengan unduhan per-berkas atau paket ZIP.
- **Estimasi Teknologi**: Native HTML5 Canvas `canvas.toBlob(type, quality)`.

---

### 🥉 3. Cap Air Gambar / Watermark Foto (Watermark IMAGE)
- **Kategori**: Keamanan & Hak Cipta Gambar (`/tools/watermark-image`)
- **Tingkat Rekomendasi**: **Tinggi**
- **Kenapa Direkomendasikan?**:
  1. **Tren Perlindungan Identitas di Indonesia**: Masyarakat sangat sering diimbau untuk membubuhkan watermark miring di scan KTP/SIM dengan teks seperti *"HANYA UNTUK VERIFIKASI APLIKASI X - TGL DD/MM/YY"* agar tidak disalahgunakan pinjaman online ilegal.
  2. **Melengkapi Watermark PDF**: Melengkapi `/tools/watermark-pdf` yang sudah ada untuk format dokumen PDF.
- **Fitur Utama**:
  - Teks watermark kustom dengan slider ukuran font, transparansi (opasitas), sudut kemiringan, dan warna.
  - Opsi stempel logo PNG transparan.
  - Pola berulang (*tiled diagonal watermark*) untuk proteksi anti-crop.
- **Estimasi Teknologi**: HTML5 Canvas 2D Rendering.

---

### 🎖️ 4. Tingkatkan Resolusi Foto (AI Image Upscaler)
- **Kategori**: Gambar & AI (`/tools/upscale-image`)
- **Tingkat Rekomendasi**: **Menengah (Fitur Premium & Futuristik)**
- **Kenapa Direkomendasikan?**:
  1. **Melengkapi Remove BG**: Memperkuat kategori AI canggih di DataScry.
  2. **Kebutuhan Cetak Foto**: Foto lama, pas foto kecil, atau screenshot buram dapat diperbesar 2× hingga 4× dengan tepi yang tetap tajam.
- **Estimasi Teknologi**: WebGL / WebAssembly on-device super-resolution / edge sharpening.

---

### 🎖️ 5. Ubah Ukuran Gambar Massal (Resize IMAGE)
- **Kategori**: Manipulasi Gambar (`/tools/resize-image`)
- **Tingkat Rekomendasi**: **Menengah (Batch Optimization)**
- **Fitur Utama**:
  - Resize berdasarkan persentase (25%, 50%, 75%) atau resolusi piksel custom (Lock Aspect Ratio).
  - Batch resize puluhan gambar sekaligus dengan unduhan ZIP.
- **Estimasi Teknologi**: Native Canvas 2D API.

---

## 📋 Peta Jalan Lengkap Fitur Mendatang (Backlog Roadmap)

Berikut adalah daftar urutan lengkap seluruh fitur yang direncanakan untuk DataScry:

| No | Modul Fitur Baru | Kategori | Prioritas | Rute Target | Estimasi Teknologi |
| :-: | :--- | :--- | :--- | :--- | :--- |
| **1** | **Ekstrak & Intip Isi ZIP (ZIP Viewer)** | Utilitas Berkas | 🥇 Prioritas 1 | `/tools/unzip` | `jszip` (sudah ada di dependensi) |
| **2** | **Konverter Format Gambar Universal** | Gambar | 🥈 Prioritas 2 | `/tools/convert-image` | Canvas API (WebP ⇄ JPG ⇄ PNG ⇄ AVIF) |
| **3** | **Cap Air Gambar (Watermark IMAGE)** | Gambar & Keamanan | 🥉 Prioritas 3 | `/tools/watermark-image` | Canvas 2D Text & Stamp Renderer |
| **4** | **Tingkatkan Resolusi Foto (AI Image Upscaler)** | Gambar & AI | Prioritas 4 | `/tools/upscale-image` | On-device Super-Resolution (WebGL) |
| **5** | **Ubah Ukuran Gambar Massal (Resize IMAGE)** | Gambar | Prioritas 5 | `/tools/resize-image` | Canvas API (Persen & Dimensi Piksel) |
| **6** | **Putar Gambar Massal (Rotate IMAGE)** | Gambar | Prioritas 6 | `/tools/rotate-image` | Batch Canvas Rotator (Orientasi EXIF) |
| **7** | **Penomoran Halaman Otomatis (Page Numbering)** | Format PDF | Prioritas 7 | `/tools/number-pdf` | `pdf-lib` Bates Stamping ("Hal X dari Y") |
| **8** | **Potong / Trim Margin PDF (Crop PDF)** | Format PDF | Prioritas 8 | `/tools/crop-pdf` | Bounding Box Crop & MediaBox (`pdf-lib`) |
| **9** | **Edit PDF (Anotasi, Teks, & Bentuk)** | Interaktif PDF | Prioritas 9 | `/tools/edit-pdf` | Canvas PDF Annotation Layer |
| **10** | **PDF ke Markdown (PDF to Markdown)** | AI & Teks | Prioritas 10 | `/tools/pdf-to-markdown` | `pdfjs-dist` Layout Parser to GFM Markdown |
| **11** | **Editor Foto Ringan (Photo Editor)** | Gambar | Prioritas 11 | `/tools/photo-editor` | Filter Canvas (Brightness, Contrast, Tint) |
| **12** | **Pembuat Meme Kustom (Meme Generator)** | Kreatif | Prioritas 12 | `/tools/meme-generator` | Canvas Text Impact + Meme Templates |
| **13** | **OCR Ekstrak Teks Dokumen (Offline OCR)** | AI & Teks | Prioritas 13 | `/tools/ocr-pdf` | `tesseract.js` WebAssembly Worker |
| **14** | **PDF ke Excel (PDF to Excel)** | Konversi Office | Prioritas 14 | `/tools/pdf-to-excel` | Table Bounding Box Parser to SheetJS |
| **15** | **Excel ke PDF (Excel to PDF)** | Konversi Office | Prioritas 15 | `/tools/excel-to-pdf` | SheetJS (`xlsx`) to `pdf-lib` Table Renderer |
| **16** | **PDF ke PowerPoint (PDF to PPTX)** | Konversi Office | Prioritas 16 | `/tools/pdf-to-pptx` | Raster/Vector Slide to `pptxgenjs` |
| **17** | **PowerPoint ke PDF (PPTX to PDF)** | Konversi Office | Prioritas 17 | `/tools/pptx-to-pdf` | OpenXML Presentation Parser to PDF |
| **18** | **Formulir PDF Interaktif (PDF Forms & Filler)** | Interaktif PDF | Prioritas 18 | `/tools/pdf-forms` | AcroForms Field Filler via `pdf-lib` |
| **19** | **Bandingkan Dokumen PDF (Compare PDF)** | Analisis PDF | Prioritas 19 | `/tools/compare-pdf` | Side-by-side Visual Diff & Pixel Match |
| **20** | **Pindai Dokumen ke PDF (Scan to PDF via Kamera)** | Utilitas Mobile | Prioritas 21 | `/tools/scan-pdf` | WebRTC Camera + Keystone Correction + PDF |
| **21** | **Perbaiki PDF Rusak (Repair Corrupt PDF)** | Utilitas PDF | Prioritas 22 | `/tools/repair-pdf` | Byte-stream Scanner & Xref Rebuilder |
| **22** | **Konversi PDF ke PDF/A (Arsip Standar ISO)** | Kepatuhan PDF | Prioritas 23 | `/tools/pdf-to-pdfa` | PDF/A-1b Metadata & Color Profile Embedding |
| **23** | **Ringkasan Dokumen AI (AI PDF Summarizer)** | AI & Teks | Prioritas 24 | `/tools/summarize-pdf` | On-Device WebLLM / Transformers.js |
| **24** | **Terjemahan Dokumen PDF (Translate PDF)** | AI & Teks | Prioritas 25 | `/tools/translate-pdf` | Local Translation Worker with Layout Preservation |
| **25** | **Konversi HTML ke PDF (HTML to PDF)** | Konversi Web | Prioritas 26 | `/tools/html-to-pdf` | Print CSS Media Engine + Canvas/pdf-lib |
| **26** | **Konversi HTML ke Gambar (HTML to IMAGE)** | Konversi Web | Prioritas 27 | `/tools/html-to-image` | SVG ForeignObject / html2canvas lokal |
| **27** | **Pembuat Pas Foto Cetak Siap Pakai** | Gambar & Cetak | Prioritas 28 | `/tools/print-photo-sheet` | Canvas Pas Foto + PDF Layout Grid 4R/A4 |
| **28** | **Alur Kerja Otomatis (Create a Workflow)** | Otomasi | Prioritas 29 | `/tools/workflow` | Pipeline Chaining Engine (Kompres -> Watermark -> Enkripsi) |

---

## 💎 Standar Kualitas Fitur DataScry (7 Pilar Gold Standard)

Seluruh fitur baru yang dibangun wajib mengadopsi standar kualitas DataScry:

1. **Interactive Lightbox Inspection (Zoom & Pan)**:
   - Skala zoom halus 50% – 400% dengan mouse wheel, double click/tap, dan drag-to-pan.
   - Menggunakan sudut tajam (`rounded-none`) agar isi dokumen tidak terpotong.
2. **Visual Multi-File & Multi-Page Grid**:
   - Kartu thumbnail responsif yang menampilkan rasio aspek asli, label dimensi piksel/halaman, status aktif, dan checkbox seleksi.
3. **Preset & Pengaturan Presisi (Controls & Presets)**:
   - Dropdown custom select dengan deskripsi informatif, fine-tuning slider, dan kartu preset instan.
4. **Pembersihan Bersih (Clean Reset Lifecycle)**:
   - Tombol **Clear Semua** yang mencabut alokasi memori blob (`revokeObjectURL`), membatalkan antrean worker/AI yang berjalan, dan mereset nilai input berkas secara tuntas.
5. **Indikator Progres Real-Time & Monotonik**:
   - Nilai progres persentase yang hanya bergerak maju (tidak melompat mundur).
   - Kartu HUD status informatif dan peringatan in-app banner tanpa menggunakan dialog bawaan `alert()`.
6. **Opsi Unduhan Ganda & Fleksibel (Dual Downloads)**:
   - Dukungan unduhan langsung per berkas (*single download*) dan pengemasan ZIP batch untuk antrean banyak berkas.
7. **Offline-First, Privasi Mutlak, & Ketahanan Mobile**:
   - **Nol Telemetri, Nol Pelacakan, Nol Pengiriman Server**. Semua komputasi berjalan 100% di CPU/GPU peramban pengguna (*in-memory*). Target sentuh nyaman untuk layar ponsel (*mobile touch-friendly*).
