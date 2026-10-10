# 🚀 Roadmap & Inventaris Fitur DataScry

Dokumen ini merangkum inventaris seluruh fitur yang telah terimplementasi serta peta jalan pengembangan fitur baru untuk **DataScry**. Seluruh fitur dibangun dengan memegang teguh filosofi inti: **100% Client-Side, Luring (Offline-First), Tanpa Pengiriman Berkas ke Server, dan Privasi Mutlak**.

---

## 📊 Matriks Status Fitur DataScry

### 1. Fitur yang Sudah Aktif & Siap Digunakan (✅ 23 Alat Aktif)

Semua alat di bawah ini telah terpasang, teruji via build Next.js, dan aktif di navigasi/katalog utama [HomeGrid.tsx](file:///home/nxrts/ProgramKoding/DataScry/src/components/home/HomeGrid.tsx):

| No | Modul Fitur | Kategori | Rute Halaman | Status & Keterangan Standar Fitur |
| :-: | :--- | :--- | :--- | :--- |
| 1 | **Hapus Latar Belakang Foto (Remove BG)** | Gambar & AI | `/tools/remove-background` | ✅ Aktif (ISNet FP16 On-Device AI, HD Lossless, Presets Pas Foto, Slider Before/After) |
| 2 | **Konverter Format Gambar Universal** | Manipulasi Gambar | `/tools/convert-image` | ✅ **Rilis Baru** (WebP ⇄ JPG ⇄ PNG ⇄ AVIF, Latar Anti-Hitam Transparansi, Batch Multi-File & ZIP, Lightbox HD) |
| 3 | **Potong & Pas Foto (Crop & Resize)** | Manipulasi Gambar | `/tools/crop-image` | ✅ **Rilis Baru** (Preset Pas Foto 2×3, 3×4, 4×6 cm, Atur Piksel Presisi, Rotasi/Flip, Rule of Thirds) |
| 4 | **Sensor & Blur Foto (Blur Face & Privacy)** | Privasi Gambar | `/tools/blur-face` | ✅ **Rilis Baru** (Gaussian Blur, Mosaik TV, Sensor Hitam, Kuas Sentuh & Kotak Drag, Layer Stacking Non-Destruktif, Ekspor HD) |
| 5 | **JPG ke PDF** | Konversi | `/tools/jpg-to-pdf` | ✅ Aktif (*Gold Standard*: Lightbox Zoom 400%, Grid Thumbnail, Orientasi/Margin Kustom) |
| 6 | **PDF ke JPG** | Konversi | `/tools/pdf-to-jpg` | ✅ Aktif (*Gold Standard*: Seleksi Halaman, Ekspor ZIP & Direct Download, Lightbox HD) |
| 7 | **Kompresi Dokumen & Foto (Compress)** | Optimasi | `/tools/compress` | ✅ Aktif (Smart Compression multi-level, kalkulator hemat byte, pratinjau sebelum/sesudah) |
| 8 | **Gabung PDF (Merge PDF)** | Manajemen PDF | `/tools/merge-pdf` | ✅ Aktif (Drag-to-reorder, thumbnail visual multi-halaman) |
| 9 | **Pisah PDF (Split PDF)** | Manajemen PDF | `/tools/split-pdf` | ✅ Aktif (Mode rentang, halaman genap/ganjil, ekstraksi selektif) |
| 10 | **Atur & Kelola Halaman PDF (Organize PDF)** | Manajemen PDF | `/tools/organize-pdf` | ✅ **Rilis Baru** (Drag & drop visual reorder, hapus, putar 90°, duplikasi halaman, tambah PDF) |
| 11 | **Putar PDF (Rotate PDF)** | Manajemen PDF | `/tools/rotate-pdf` | ✅ Aktif (Rotasi 90°/180°/270° per halaman atau serentak) |
| 12 | **Tanda Tangan PDF (Sign PDF)** | Tanda Tangan | `/tools/sign-pdf` | ✅ Aktif (Canvas sentuh interaktif, impor stempel PNG transparan, multi-halaman) |
| 13 | **Cap Air PDF (Watermark PDF)** | Keamanan | `/tools/watermark-pdf` | ✅ Aktif (Teks & gambar, kustomisasi opasitas, rotasi sudut, tata letak grid/pusat) |
| 14 | **Kunci PDF (Protect PDF)** | Keamanan | `/tools/protect-pdf` | ✅ Aktif (Enkripsi kata sandi dokumen berbasis WebAssembly) |
| 15 | **Buka Kunci PDF (PDF Unlock)** | Keamanan | `/tools/unlock-pdf` | ✅ Aktif (Hapus proteksi password permanen, dekripsi AES-256 & RC4 client-side) |
| 16 | **Sensor Data Sensitif PDF (PDF Redactor)** | Keamanan & Privasi | `/tools/redact-pdf` | ✅ **Rilis Baru** (*True Redaction*: Burn-in pixel bitmap, musnahkan aliran teks sensitif, 3 gaya sensor) |
| 17 | **Word ke PDF (Word to PDF)** | Konversi | `/tools/word-to-pdf` | ✅ Aktif (Rendering docx lokal langsung menjadi PDF) |
| 18 | **PDF ke Word (PDF to Word)** | Konversi | `/tools/pdf-to-word` | ✅ Aktif (Ekstraksi teks & struktur menjadi berkas `.docx`) |
| 19 | **Gabung Word (Merge Word)** | Dokumen | `/tools/merge-word` | ✅ Aktif (Penggabungan multi-file `.docx` secara client-side) |
| 20 | **Arsip ZIP (Archive ZIP)** | Utilitas Berkas | `/tools/archive-zip` | ✅ Aktif (Kompresi multi-berkas menjadi arsip `.zip` lokal) |
| 21 | **Ekstrak & Intip ZIP (Unzip & Inspect)** | Utilitas Berkas | `/tools/unzip` | ✅ **Rilis Baru** (Tree/List & Grid View, Live Preview Gambar/PDF/Teks/Kode, Ekstraksi Selektif & Massal, HUD Penghematan) |
| 22 | **Inspeksi Metadata (Metadata Viewer)** | Privasi | `/tools/metadata-viewer` | ✅ Aktif (Analisis atribut internal dokumen & berkas) |
| 23 | **Pembersih EXIF (Scrub EXIF)** | Privasi | `/tools/scrub-exif` | ✅ Aktif (Hapus metadata GPS & data sensitif kamera dari foto) |

---

## 🎯 Rekomendasi Teratas untuk Pengembangan Selanjutnya

Setelah sukses mengimplementasikan **Konverter Format Gambar Universal (`/tools/convert-image`)**, berikut adalah 5 fitur terbaik berikutnya yang siap diimplementasikan:

---

### 🥇 1. Cap Air Gambar / Watermark Foto (Watermark IMAGE)
- **Kategori**: Keamanan & Hak Cipta Gambar (`/tools/watermark-image`)
- **Tingkat Rekomendasi**: **Sangat Tinggi (Pilihan Utama)**
- **Kenapa Paling Direkomendasikan?**:
  1. **Tren Perlindungan Identitas di Indonesia**: Masyarakat sangat sering diimbau untuk membubuhkan watermark miring di scan KTP/SIM dengan teks seperti *"HANYA UNTUK VERIFIKASI APLIKASI X - TGL DD/MM/YY"* agar tidak disalahgunakan pinjaman online ilegal.
  2. **Melengkapi Watermark PDF**: Melengkapi `/tools/watermark-pdf` yang sudah ada untuk format dokumen PDF.
- **Fitur Utama**:
  - Teks watermark kustom dengan slider ukuran font, transparansi (opasitas), sudut kemiringan, dan warna.
  - Opsi stempel logo PNG transparan.
  - Pola berulang (*tiled diagonal watermark*) untuk proteksi anti-crop.
- **Estimasi Teknologi**: HTML5 Canvas 2D Rendering.

---

### 🥈 2. Tingkatkan Resolusi Foto (AI Image Upscaler)
- **Kategori**: Gambar & AI (`/tools/upscale-image`)
- **Tingkat Rekomendasi**: **Tinggi (Fitur Premium & Futuristik)**
- **Kenapa Direkomendasikan?**:
  1. **Melengkapi Remove BG**: Memperkuat kategori AI canggih di DataScry.
  2. **Kebutuhan Cetak Foto**: Foto lama, pas foto kecil, atau screenshot buram dapat diperbesar 2× hingga 4× dengan tepi yang tetap tajam.
- **Estimasi Teknologi**: WebGL / WebAssembly on-device super-resolution / edge sharpening.

---

### 🥉 3. Ubah Ukuran Gambar Massal (Resize IMAGE)
- **Kategori**: Manipulasi Gambar (`/tools/resize-image`)
- **Tingkat Rekomendasi**: **Menengah (Batch Optimization)**
- **Fitur Utama**:
  - Resize berdasarkan persentase (25%, 50%, 75%) atau resolusi piksel custom (Lock Aspect Ratio).
  - Batch resize puluhan gambar sekaligus dengan unduhan ZIP.
- **Estimasi Teknologi**: Native Canvas 2D API.

---

### 🎖️ 4. Putar Gambar Massal (Rotate IMAGE)
- **Kategori**: Manipulasi Gambar (`/tools/rotate-image`)
- **Tingkat Rekomendasi**: **Praktis & Ringan**
- **Fitur Utama**:
  - Rotasi 90°, 180°, 270°, atau flip horizontal/vertikal secara batch untuk banyak gambar sekaligus.
  - Unduh per berkas atau bundel ZIP.
- **Estimasi Teknologi**: HTML5 Canvas 2D API.

---

### 🎖️ 5. Penomoran Halaman Otomatis (Page Numbering)
- **Kategori**: Format PDF (`/tools/number-pdf`)
- **Tingkat Rekomendasi**: **Kebutuhan Dokumen Resmi**
- **Fitur Utama**:
  - Penomoran otomatis "Halaman X dari Y" atau "Hal X".
  - Pengaturan posisi (bawah tengah, bawah kanan, atas).
- **Estimasi Teknologi**: `pdf-lib` Bates Stamping Engine.

---

## 📋 Peta Jalan Lengkap Fitur Mendatang (Backlog Roadmap)

Berikut adalah daftar urutan lengkap seluruh fitur yang direncanakan untuk DataScry:

| No | Modul Fitur Baru | Kategori | Prioritas | Rute Target | Estimasi Teknologi |
| :-: | :--- | :--- | :--- | :--- | :--- |
| **1** | **Cap Air Gambar (Watermark IMAGE)** | Gambar & Keamanan | 🥇 Prioritas 1 | `/tools/watermark-image` | Canvas 2D Text & Stamp Renderer |
| **2** | **Tingkatkan Resolusi Foto (AI Image Upscaler)** | Gambar & AI | 🥈 Prioritas 2 | `/tools/upscale-image` | On-device Super-Resolution (WebGL) |
| **3** | **Ubah Ukuran Gambar Massal (Resize IMAGE)** | Gambar | 🥉 Prioritas 3 | `/tools/resize-image` | Canvas API (Persen & Dimensi Piksel) |
| **4** | **Putar Gambar Massal (Rotate IMAGE)** | Gambar | Prioritas 4 | `/tools/rotate-image` | Batch Canvas Rotator (Orientasi EXIF) |
| **5** | **Penomoran Halaman Otomatis (Page Numbering)** | Format PDF | Prioritas 5 | `/tools/number-pdf` | `pdf-lib` Bates Stamping ("Hal X dari Y") |
| **6** | **Potong / Trim Margin PDF (Crop PDF)** | Format PDF | Prioritas 6 | `/tools/crop-pdf` | Bounding Box Crop & MediaBox (`pdf-lib`) |
| **7** | **Edit PDF (Anotasi, Teks, & Bentuk)** | Interaktif PDF | Prioritas 7 | `/tools/edit-pdf` | Canvas PDF Annotation Layer |
| **8** | **PDF ke Markdown (PDF to Markdown)** | AI & Teks | Prioritas 8 | `/tools/pdf-to-markdown` | `pdfjs-dist` Layout Parser to GFM Markdown |
| **9** | **Editor Foto Ringan (Photo Editor)** | Gambar | Prioritas 9 | `/tools/photo-editor` | Filter Canvas (Brightness, Contrast, Tint) |
| **10** | **Pembuat Meme Kustom (Meme Generator)** | Kreatif | Prioritas 10 | `/tools/meme-generator` | Canvas Text Impact + Meme Templates |
| **11** | **OCR Ekstrak Teks Dokumen (Offline OCR)** | AI & Teks | Prioritas 11 | `/tools/ocr-pdf` | `tesseract.js` WebAssembly Worker |
| **12** | **PDF ke Excel (PDF to Excel)** | Konversi Office | Prioritas 12 | `/tools/pdf-to-excel` | Table Bounding Box Parser to SheetJS |
| **13** | **Excel ke PDF (Excel to PDF)** | Konversi Office | Prioritas 13 | `/tools/excel-to-pdf` | SheetJS (`xlsx`) to `pdf-lib` Table Renderer |
| **14** | **PDF ke PowerPoint (PDF to PPTX)** | Konversi Office | Prioritas 14 | `/tools/pdf-to-pptx` | Raster/Vector Slide to `pptxgenjs` |
| **15** | **PowerPoint ke PDF (PPTX to PDF)** | Konversi Office | Prioritas 15 | `/tools/pptx-to-pdf` | OpenXML Presentation Parser to PDF |
| **16** | **Formulir PDF Interaktif (PDF Forms & Filler)** | Interaktif PDF | Prioritas 16 | `/tools/pdf-forms` | AcroForms Field Filler via `pdf-lib` |
| **17** | **Bandingkan Dokumen PDF (Compare PDF)** | Analisis PDF | Prioritas 17 | `/tools/compare-pdf` | Side-by-side Visual Diff & Pixel Match |
| **18** | **Pindai Dokumen ke PDF (Scan to PDF via Kamera)** | Utilitas Mobile | Prioritas 18 | `/tools/scan-pdf` | WebRTC Camera + Keystone Correction + PDF |
| **19** | **Perbaiki PDF Rusak (Repair Corrupt PDF)** | Utilitas PDF | Prioritas 19 | `/tools/repair-pdf` | Byte-stream Scanner & Xref Rebuilder |
| **20** | **Konversi PDF ke PDF/A (Arsip Standar ISO)** | Kepatuhan PDF | Prioritas 20 | `/tools/pdf-to-pdfa` | PDF/A-1b Metadata & Color Profile Embedding |
| **21** | **Ringkasan Dokumen AI (AI PDF Summarizer)** | AI & Teks | Prioritas 21 | `/tools/summarize-pdf` | On-Device WebLLM / Transformers.js |
| **22** | **Terjemahan Dokumen PDF (Translate PDF)** | AI & Teks | Prioritas 22 | `/tools/translate-pdf` | Local Translation Worker with Layout Preservation |
| **23** | **Konversi HTML ke PDF (HTML to PDF)** | Konversi Web | Prioritas 23 | `/tools/html-to-pdf` | Print CSS Media Engine + Canvas/pdf-lib |
| **24** | **Konversi HTML ke Gambar (HTML to IMAGE)** | Konversi Web | Prioritas 24 | `/tools/html-to-image` | SVG ForeignObject / html2canvas lokal |
| **25** | **Pembuat Pas Foto Cetak Siap Pakai** | Gambar & Cetak | Prioritas 25 | `/tools/print-photo-sheet` | Canvas Pas Foto + PDF Layout Grid 4R/A4 |
| **26** | **Alur Kerja Otomatis (Create a Workflow)** | Otomasi | Prioritas 26 | `/tools/workflow` | Pipeline Chaining Engine (Kompres -> Watermark -> Enkripsi) |

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
