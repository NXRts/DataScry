# 🚀 Roadmap & Inventaris Fitur DataScry

Dokumen ini merangkum inventaris seluruh fitur yang telah terimplementasi serta peta jalan pengembangan fitur baru untuk **DataScry**. Seluruh fitur dibangun dengan memegang teguh filosofi inti: **100% Client-Side, Luring (Offline-First), Tanpa Pengiriman Berkas ke Server, dan Privasi Mutlak**.

---

## 📊 Matriks Status Fitur DataScry

### 1. Fitur yang Sudah Aktif & Siap Digunakan (✅ 28 Alat Aktif)

Semua alat di bawah ini telah terpasang, teruji via build Next.js, dan aktif di navigasi/katalog utama [HomeGrid.tsx](file:///home/nxrts/ProgramKoding/DataScry/src/components/home/HomeGrid.tsx):

| No | Modul Fitur | Kategori | Rute Halaman | Status & Keterangan Standar Fitur |
| :-: | :--- | :--- | :--- || 1 | **Penomoran Halaman Otomatis (Page Numbering PDF)** | Format PDF | `/tools/number-pdf` | ✅ **Rilis Baru** (Bates Stamping Engine 100% Offline via `pdf-lib`, 6 Titik Posisi Presisi, Format Angka/Romawi/Kustom, Lewati Sampul & Nomor Awal, Live Canvas Preview & Lightbox HD) |
| 2 | **Putar Gambar Massal (Rotate IMAGE & Flip)** | Manipulasi Gambar | `/tools/rotate-image` | ✅ **Rilis Baru** (Canvas 2D Matrix HD, Rotasi 90° CW/CCW & 180°, Cermin Mirror Horizontal & Vertikal, Batch Multi-Foto & ZIP, Lightbox HD) |
| 3 | **Tingkatkan Resolusi Foto (AI Image Upscaler)** | Gambar & AI | `/tools/upscale-image` | ✅ **Rilis Baru** (Super-Resolution On-Device 2× s.d. 4× Ultra HD, 4 Mode: Foto/Anime/Dokumen/Vintage, Slider Ketajaman & Denoise, Before/After Slider, Batch ZIP & Lightbox HD) |
| 4 | **Cap Air Gambar / Watermark Foto (Watermark IMAGE)** | Keamanan & Hak Cipta | `/tools/watermark-image` | ✅ **Rilis Baru** (Canvas 2D HD, Teks Pengaman KTP/SIM Anti-Pinjol, Stempel Logo PNG Transparan, Pola Berulang Tiled Grid, Batch Multi-Foto & ZIP) |
| 5 | **Ubah Ukuran Gambar Massal (Resize IMAGE)** | Manipulasi Gambar | `/tools/resize-image` | ✅ **Rilis Baru** (3 Mode: Persen, Piksel Presisi & Batas Maksimal Sisi CASN/BUMN, Kunci Rasio Aspek Otomatis, Stepped Downsampling HD, Preset Resolusi Populer, Batch ZIP) |
| 6 | **Hapus Latar Belakang Foto (Remove BG)** | Gambar & AI | `/tools/remove-background` | ✅ Aktif (ISNet FP16 On-Device AI, HD Lossless, Presets Pas Foto, Slider Before/After) |
| 7 | **Konverter Format Gambar Universal** | Manipulasi Gambar | `/tools/convert-image` | ✅ **Rilis Baru** (WebP ⇄ JPG ⇄ PNG ⇄ AVIF, Latar Anti-Hitam Transparansi, Batch Multi-File & ZIP, Lightbox HD) |
| 8 | **Potong & Pas Foto (Crop & Resize)** | Manipulasi Gambar | `/tools/crop-image` | ✅ **Rilis Baru** (Preset Pas Foto 2×3, 3×4, 4×6 cm, Atur Piksel Presisi, Rotasi/Flip, Rule of Thirds) |
| 9 | **Sensor & Blur Foto (Blur Face & Privacy)** | Privasi Gambar | `/tools/blur-face` | ✅ **Rilis Baru** (Gaussian Blur, Mosaik TV, Sensor Hitam, Kuas Sentuh & Kotak Drag, Layer Stacking Non-Destruktif, Ekspor HD) |
| 10 | **JPG ke PDF** | Konversi | `/tools/jpg-to-pdf` | ✅ Aktif (*Gold Standard*: Lightbox Zoom 400%, Grid Thumbnail, Orientasi/Margin Kustom) |
| 11 | **PDF ke JPG** | Konversi | `/tools/pdf-to-jpg` | ✅ Aktif (*Gold Standard*: Seleksi Halaman, Ekspor ZIP & Direct Download, Lightbox HD) |
| 12 | **Kompresi Dokumen & Foto (Compress)** | Optimasi | `/tools/compress` | ✅ Aktif (Smart Compression multi-level, kalkulator hemat byte, pratinjau sebelum/sesudah) |
| 13 | **Gabung PDF (Merge PDF)** | Manajemen PDF | `/tools/merge-pdf` | ✅ Aktif (Drag-to-reorder, thumbnail visual multi-halaman) |
| 14 | **Pisah PDF (Split PDF)** | Manajemen PDF | `/tools/split-pdf` | ✅ Aktif (Mode rentang, halaman genap/ganjil, ekstraksi selektif) |
| 15 | **Atur & Kelola Halaman PDF (Organize PDF)** | Manajemen PDF | `/tools/organize-pdf` | ✅ **Rilis Baru** (Drag & drop visual reorder, hapus, putar 90°, duplikasi halaman, tambah PDF) |
| 16 | **Putar PDF (Rotate PDF)** | Manajemen PDF | `/tools/rotate-pdf` | ✅ Aktif (Rotasi 90°/180°/270° per halaman atau serentak) |
| 17 | **Tanda Tangan PDF (Sign PDF)** | Tanda Tangan | `/tools/sign-pdf` | ✅ Aktif (Canvas sentuh interaktif, impor stempel PNG transparan, multi-halaman) |
| 18 | **Cap Air PDF (Watermark PDF)** | Keamanan | `/tools/watermark-pdf` | ✅ Aktif (Teks & gambar, kustomisasi opasitas, rotasi sudut, tata letak grid/pusat) |
| 19 | **Kunci PDF (Protect PDF)** | Keamanan | `/tools/protect-pdf` | ✅ Aktif (Enkripsi kata sandi dokumen berbasis WebAssembly) |
| 20 | **Buka Kunci PDF (PDF Unlock)** | Keamanan | `/tools/unlock-pdf` | ✅ Aktif (Hapus proteksi password permanen, dekripsi AES-256 & RC4 client-side) |
| 21 | **Sensor Data Sensitif PDF (PDF Redactor)** | Keamanan & Privasi | `/tools/redact-pdf` | ✅ **Rilis Baru** (*True Redaction*: Burn-in pixel bitmap, musnahkan aliran teks sensitif, 3 gaya sensor) |
| 22 | **Word ke PDF (Word to PDF)** | Konversi | `/tools/word-to-pdf` | ✅ Aktif (Rendering docx lokal langsung menjadi PDF) |
| 23 | **PDF ke Word (PDF to Word)** | Konversi | `/tools/pdf-to-word` | ✅ Aktif (Ekstraksi teks & struktur menjadi berkas `.docx`) |
| 24 | **Gabung Word (Merge Word)** | Dokumen | `/tools/merge-word` | ✅ Aktif (Penggabungan multi-file `.docx` secara client-side) |
| 25 | **Arsip ZIP (Archive ZIP)** | Utilitas Berkas | `/tools/archive-zip` | ✅ Aktif (Kompresi multi-berkas menjadi arsip `.zip` lokal) |
| 26 | **Ekstrak & Intip ZIP (Unzip & Inspect)** | Utilitas Berkas | `/tools/unzip` | ✅ **Rilis Baru** (Tree/List & Grid View, Live Preview Gambar/PDF/Teks/Kode, Ekstraksi Selektif & Massal, HUD Penghematan) |
| 27 | **Inspeksi Metadata (Metadata Viewer)** | Privasi | `/tools/metadata-viewer` | ✅ Aktif (Analisis atribut internal dokumen & berkas) |
| 28 | **Pembersih EXIF (Scrub EXIF)** | Privasi | `/tools/scrub-exif` | ✅ Aktif (Hapus metadata GPS & data sensitif kamera dari foto) |

---

## 🎯 Rekomendasi Teratas untuk Pengembangan Selanjutnya

Setelah sukses mengimplementasikan **Penomoran Halaman Otomatis (`/tools/number-pdf`)**, **Putar Gambar Massal (`/tools/rotate-image`)**, **Ubah Ukuran Gambar Massal (`/tools/resize-image`)**, **Tingkatkan Resolusi Foto (`/tools/upscale-image`)**, dan **Cap Air Gambar (`/tools/watermark-image`)**, berikut adalah urutan fitur prioritas berikutnya:

---

### 🥇 1. Potong / Trim Margin PDF (Crop PDF)
- **Kategori**: Format PDF (`/tools/crop-pdf`)
- **Tingkat Rekomendasi**: **Sangat Tinggi (Pembersihan Dokumen & Kerapian Cetak)**
- **Kenapa Direkomendasikan?**:
  - Banyak scan buku, jurnal ilmiah, slip gaji, atau surat dinas memiliki margin putih yang terlalu tebal atau garis hitam scanner yang mengganggu.
- **Fitur Utama**:
  - Potong margin putih berlebih pada scan buku atau dokumen jurnal.
  - Seleksi kotak potong interaktif visual per halaman atau terapkan ke semua halaman sekaligus.
  - Pratinjau rasio aspek (A4, Letter, Custom) dan Live Lightbox HD.
- **Estimasi Teknologi**: `pdf-lib` MediaBox / CropBox Adjustment.

---

### 🥈 2. Edit PDF (Anotasi, Teks, & Bentuk)
- **Kategori**: Interaktif PDF (`/tools/edit-pdf`)
- **Tingkat Rekomendasi**: **Tinggi (Peralatan Kantor Lengkap)**
- **Fitur Utama**:
  - Bubuhi kotak teks, sorotan warna (highlighter), garis bawah, panah, dan stempel dokumen.
- **Estimasi Teknologi**: Canvas PDF Annotation Layer over `pdfjs-dist` + `pdf-lib`.

---

### 🥉 3. PDF ke Markdown (PDF to Markdown)
- **Kategori**: AI & Teks (`/tools/pdf-to-markdown`)
- **Tingkat Rekomendasi**: **Menengah (Era LLM & AI Notes)**
- **Fitur Utama**:
  - Ekstraksi teks berstruktur rapi lengkap dengan judul (`#`, `##`), tabel markdown, daftar butir, dan kutipan.
- **Estimasi Teknologi**: `pdfjs-dist` Layout Parser + Regex Heuristics.

---

### 🎖️ 4. Editor Foto Ringan (Photo Editor)
- **Kategori**: Gambar (`/tools/photo-editor`)
- **Tingkat Rekomendasi**: **Menengah (Penyempurnaan Visual)**
- **Fitur Utama**:
  - Penyesuaian kecerahan (brightness), kontras, saturasi, kehangatan (warmth), dan filter artistik foto.
- **Estimasi Teknologi**: Canvas 2D ImageData Filter Processing.

---

## 📋 Peta Jalan Lengkap Fitur Mendatang (Backlog Roadmap)

Berikut adalah daftar urutan lengkap seluruh fitur yang direncanakan untuk DataScry:

| No | Modul Fitur Baru | Kategori | Prioritas | Rute Target | Estimasi Teknologi | Status |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Cap Air Gambar (Watermark IMAGE)** | Gambar & Keamanan | Selesai | `/tools/watermark-image` | Canvas 2D Text & Stamp Renderer | ✅ **Sudah Aktif** |
| **2** | **Tingkatkan Resolusi Foto (AI Image Upscaler)** | Gambar & AI | Selesai | `/tools/upscale-image` | On-device Super-Resolution | ✅ **Sudah Aktif** |
| **3** | **Ubah Ukuran Gambar Massal (Resize IMAGE)** | Gambar | Selesai | `/tools/resize-image` | Canvas API (Persen & Dimensi Piksel) | ✅ **Sudah Aktif** |
| **4** | **Putar Gambar Massal (Rotate IMAGE)** | Gambar | Selesai | `/tools/rotate-image` | Canvas 2D Transformation Matrix | ✅ **Sudah Aktif** |
| **5** | **Penomoran Halaman Otomatis (Page Numbering)** | Format PDF | Selesai | `/tools/number-pdf` | `pdf-lib` Bates Stamping | ✅ **Sudah Aktif** |
| **6** | **Potong / Trim Margin PDF (Crop PDF)** | Format PDF | 🥇 Prioritas 1 | `/tools/crop-pdf` | Bounding Box Crop & MediaBox | ⏳ Siap Dikerjakan |
| **7** | **Edit PDF (Anotasi, Teks, & Bentuk)** | Interaktif PDF | 🥈 Prioritas 2 | `/tools/edit-pdf` | Canvas PDF Annotation Layer | ⏳ Siap Dikerjakan |
| **8** | **PDF ke Markdown (PDF to Markdown)** | AI & Teks | 🥉 Prioritas 3 | `/tools/pdf-to-markdown` | `pdfjs-dist` Layout Parser | ⏳ Backlog |
| **9** | **Editor Foto Ringan (Photo Editor)** | Gambar | Prioritas 4 | `/tools/photo-editor` | Filter Canvas (Brightness, Tint) | ⏳ Backlog |
| **10** | **Pembuat Meme Kustom (Meme Generator)** | Kreatif | Prioritas 5 | `/tools/meme-generator` | Canvas Text Impact + Templates | ⏳ Backlog |
| **11** | **OCR Ekstrak Teks Dokumen (Offline OCR)** | AI & Teks | Prioritas 8 | `/tools/ocr-pdf` | `tesseract.js` WebAssembly Worker | ⏳ Backlog |
| **12** | **PDF ke Excel (PDF to Excel)** | Konversi Office | Prioritas 9 | `/tools/pdf-to-excel` | Table Bounding Box Parser to SheetJS | ⏳ Backlog |
| **13** | **Excel ke PDF (Excel to PDF)** | Konversi Office | Prioritas 10 | `/tools/excel-to-pdf` | SheetJS (`xlsx`) to `pdf-lib` | ⏳ Backlog |
| **14** | **PDF ke PowerPoint (PDF to PPTX)** | Konversi Office | Prioritas 11 | `/tools/pdf-to-pptx` | Raster/Vector Slide to `pptxgenjs` | ⏳ Backlog |
| **15** | **PowerPoint ke PDF (PPTX to PDF)** | Konversi Office | Prioritas 12 | `/tools/pptx-to-pdf` | OpenXML Presentation Parser | ⏳ Backlog |
| **16** | **Formulir PDF Interaktif (PDF Forms & Filler)** | Interaktif PDF | Prioritas 13 | `/tools/pdf-forms` | AcroForms Field Filler via `pdf-lib` | ⏳ Backlog |
| **17** | **Bandingkan Dokumen PDF (Compare PDF)** | Analisis PDF | Prioritas 14 | `/tools/compare-pdf` | Side-by-side Visual Diff | ⏳ Backlog |
| **18** | **Pindai Dokumen ke PDF (Scan to PDF via Kamera)** | Utilitas Mobile | Prioritas 15 | `/tools/scan-pdf` | WebRTC Camera + Keystone + PDF | ⏳ Backlog |
| **19** | **Perbaiki PDF Rusak (Repair Corrupt PDF)** | Utilitas PDF | Prioritas 16 | `/tools/repair-pdf` | Byte-stream Scanner & Xref Rebuilder | ⏳ Backlog |
| **20** | **Konversi PDF ke PDF/A (Arsip Standar ISO)** | Kepatuhan PDF | Prioritas 17 | `/tools/pdf-to-pdfa` | PDF/A-1b Metadata & Color Profile | ⏳ Backlog |
| **21** | **Ringkasan Dokumen AI (AI PDF Summarizer)** | AI & Teks | Prioritas 18 | `/tools/summarize-pdf` | On-Device WebLLM / Transformers.js | ⏳ Backlog |
| **22** | **Terjemahan Dokumen PDF (Translate PDF)** | AI & Teks | Prioritas 19 | `/tools/translate-pdf` | Local Translation Worker | ⏳ Backlog |
| **23** | **Konversi HTML ke PDF (HTML to PDF)** | Konversi Web | Prioritas 20 | `/tools/html-to-pdf` | Print CSS Media Engine + Canvas | ⏳ Backlog |
| **24** | **Konversi HTML ke Gambar (HTML to IMAGE)** | Konversi Web | Prioritas 21 | `/tools/html-to-image` | SVG ForeignObject / html2canvas | ⏳ Backlog |
| **25** | **Pembuat Pas Foto Cetak Siap Pakai** | Gambar & Cetak | Prioritas 22 | `/tools/print-photo-sheet` | Canvas Pas Foto + Grid 4R/A4 PDF | ⏳ Backlog |
| **26** | **Alur Kerja Otomatis (Create a Workflow)** | Otomasi | Prioritas 23 | `/tools/workflow` | Pipeline Chaining Engine | ⏳ Backlog |

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
