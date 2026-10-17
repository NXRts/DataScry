# 🚀 Roadmap & Inventaris Fitur DataScry

Dokumen ini merangkum inventaris seluruh fitur yang telah terimplementasi serta peta jalan pengembangan fitur baru untuk **DataScry**. Seluruh fitur dibangun dengan memegang teguh filosofi inti: **100% Client-Side, Luring (Offline-First), Tanpa Pengiriman Berkas ke Server, dan Privasi Mutlak**.

---

## 📊 Matriks Status Fitur DataScry

### 1. Fitur yang Sudah Aktif & Siap Digunakan (✅ 26 Alat Aktif)

Semua alat di bawah ini telah terpasang, teruji via build Next.js, dan aktif di navigasi/katalog utama [HomeGrid.tsx](file:///home/nxrts/ProgramKoding/DataScry/src/components/home/HomeGrid.tsx):

| No | Modul Fitur | Kategori | Rute Halaman | Status & Keterangan Standar Fitur |
| :-: | :--- | :--- | :--- | :--- |
| 1 | **Tingkatkan Resolusi Foto (AI Image Upscaler)** | Gambar & AI | `/tools/upscale-image` | ✅ **Rilis Baru** (Super-Resolution On-Device 2× s.d. 4× Ultra HD, 4 Mode: Foto/Anime/Dokumen/Vintage, Slider Ketajaman & Denoise, Before/After Slider, Batch ZIP & Lightbox HD) |
| 2 | **Cap Air Gambar / Watermark Foto (Watermark IMAGE)** | Keamanan & Hak Cipta | `/tools/watermark-image` | ✅ **Rilis Baru** (Canvas 2D HD, Teks Pengaman KTP/SIM Anti-Pinjol, Stempel Logo PNG Transparan, Pola Berulang Tiled Grid, Batch Multi-Foto & ZIP) |
| 3 | **Ubah Ukuran Gambar Massal (Resize IMAGE)** | Manipulasi Gambar | `/tools/resize-image` | ✅ **Rilis Baru** (3 Mode: Persen, Piksel Presisi & Batas Maksimal Sisi CASN/BUMN, Kunci Rasio Aspek Otomatis, Stepped Downsampling HD, Preset Resolusi Populer, Batch ZIP) |
| 4 | **Hapus Latar Belakang Foto (Remove BG)** | Gambar & AI | `/tools/remove-background` | ✅ Aktif (ISNet FP16 On-Device AI, HD Lossless, Presets Pas Foto, Slider Before/After) |
| 5 | **Konverter Format Gambar Universal** | Manipulasi Gambar | `/tools/convert-image` | ✅ **Rilis Baru** (WebP ⇄ JPG ⇄ PNG ⇄ AVIF, Latar Anti-Hitam Transparansi, Batch Multi-File & ZIP, Lightbox HD) |
| 6 | **Potong & Pas Foto (Crop & Resize)** | Manipulasi Gambar | `/tools/crop-image` | ✅ **Rilis Baru** (Preset Pas Foto 2×3, 3×4, 4×6 cm, Atur Piksel Presisi, Rotasi/Flip, Rule of Thirds) |
| 7 | **Sensor & Blur Foto (Blur Face & Privacy)** | Privasi Gambar | `/tools/blur-face` | ✅ **Rilis Baru** (Gaussian Blur, Mosaik TV, Sensor Hitam, Kuas Sentuh & Kotak Drag, Layer Stacking Non-Destruktif, Ekspor HD) |
| 8 | **JPG ke PDF** | Konversi | `/tools/jpg-to-pdf` | ✅ Aktif (*Gold Standard*: Lightbox Zoom 400%, Grid Thumbnail, Orientasi/Margin Kustom) |
| 9 | **PDF ke JPG** | Konversi | `/tools/pdf-to-jpg` | ✅ Aktif (*Gold Standard*: Seleksi Halaman, Ekspor ZIP & Direct Download, Lightbox HD) |
| 10 | **Kompresi Dokumen & Foto (Compress)** | Optimasi | `/tools/compress` | ✅ Aktif (Smart Compression multi-level, kalkulator hemat byte, pratinjau sebelum/sesudah) |
| 11 | **Gabung PDF (Merge PDF)** | Manajemen PDF | `/tools/merge-pdf` | ✅ Aktif (Drag-to-reorder, thumbnail visual multi-halaman) |
| 12 | **Pisah PDF (Split PDF)** | Manajemen PDF | `/tools/split-pdf` | ✅ Aktif (Mode rentang, halaman genap/ganjil, ekstraksi selektif) |
| 13 | **Atur & Kelola Halaman PDF (Organize PDF)** | Manajemen PDF | `/tools/organize-pdf` | ✅ **Rilis Baru** (Drag & drop visual reorder, hapus, putar 90°, duplikasi halaman, tambah PDF) |
| 14 | **Putar PDF (Rotate PDF)** | Manajemen PDF | `/tools/rotate-pdf` | ✅ Aktif (Rotasi 90°/180°/270° per halaman atau serentak) |
| 15 | **Tanda Tangan PDF (Sign PDF)** | Tanda Tangan | `/tools/sign-pdf` | ✅ Aktif (Canvas sentuh interaktif, impor stempel PNG transparan, multi-halaman) |
| 16 | **Cap Air PDF (Watermark PDF)** | Keamanan | `/tools/watermark-pdf` | ✅ Aktif (Teks & gambar, kustomisasi opasitas, rotasi sudut, tata letak grid/pusat) |
| 17 | **Kunci PDF (Protect PDF)** | Keamanan | `/tools/protect-pdf` | ✅ Aktif (Enkripsi kata sandi dokumen berbasis WebAssembly) |
| 18 | **Buka Kunci PDF (PDF Unlock)** | Keamanan | `/tools/unlock-pdf` | ✅ Aktif (Hapus proteksi password permanen, dekripsi AES-256 & RC4 client-side) |
| 19 | **Sensor Data Sensitif PDF (PDF Redactor)** | Keamanan & Privasi | `/tools/redact-pdf` | ✅ **Rilis Baru** (*True Redaction*: Burn-in pixel bitmap, musnahkan aliran teks sensitif, 3 gaya sensor) |
| 20 | **Word ke PDF (Word to PDF)** | Konversi | `/tools/word-to-pdf` | ✅ Aktif (Rendering docx lokal langsung menjadi PDF) |
| 21 | **PDF ke Word (PDF to Word)** | Konversi | `/tools/pdf-to-word` | ✅ Aktif (Ekstraksi teks & struktur menjadi berkas `.docx`) |
| 22 | **Gabung Word (Merge Word)** | Dokumen | `/tools/merge-word` | ✅ Aktif (Penggabungan multi-file `.docx` secara client-side) |
| 23 | **Arsip ZIP (Archive ZIP)** | Utilitas Berkas | `/tools/archive-zip` | ✅ Aktif (Kompresi multi-berkas menjadi arsip `.zip` lokal) |
| 24 | **Ekstrak & Intip ZIP (Unzip & Inspect)** | Utilitas Berkas | `/tools/unzip` | ✅ **Rilis Baru** (Tree/List & Grid View, Live Preview Gambar/PDF/Teks/Kode, Ekstraksi Selektif & Massal, HUD Penghematan) |
| 25 | **Inspeksi Metadata (Metadata Viewer)** | Privasi | `/tools/metadata-viewer` | ✅ Aktif (Analisis atribut internal dokumen & berkas) |
| 26 | **Pembersih EXIF (Scrub EXIF)** | Privasi | `/tools/scrub-exif` | ✅ Aktif (Hapus metadata GPS & data sensitif kamera dari foto) |

---

## 🎯 Rekomendasi Teratas untuk Pengembangan Selanjutnya

Setelah sukses mengimplementasikan **Ubah Ukuran Gambar Massal (`/tools/resize-image`)**, **Tingkatkan Resolusi Foto (`/tools/upscale-image`)**, dan **Cap Air Gambar (`/tools/watermark-image`)**, berikut adalah urutan fitur prioritas berikutnya:

---

### 🥇 1. Putar Gambar Massal (Rotate IMAGE)
- **Kategori**: Manipulasi Gambar (`/tools/rotate-image`)
- **Tingkat Rekomendasi**: **Sangat Tinggi (Praktis & Esensial)**
- **Kenapa Direkomendasikan?**:
  - Pengguna ponsel sangat sering memotret dokumen, struk belanja, atau tugas sekolah dalam orientasi miring 90° atau terbalik.
- **Fitur Utama**:
  - Rotasi per foto atau serentak ke semua foto (90° Searah Jarum Jam, 90° Berlawanan, 180°).
  - Pembalik gambar (Flip Horizontal / Mirror & Flip Vertikal).
  - Batch upload banyak gambar dan unduh sekaligus via arsip `.zip`.
- **Estimasi Teknologi**: HTML5 Canvas 2D Transformation Matrix (Ringan & Cepat).

---

### 🥈 2. Penomoran Halaman Otomatis (Page Numbering PDF)
- **Kategori**: Format PDF (`/tools/number-pdf`)
- **Tingkat Rekomendasi**: **Tinggi (Kebutuhan Akademik & Kantor)**
- **Kenapa Direkomendasikan?**:
  - Sangat dibutuhkan untuk skripsi, tesis, laporan dinas, atau ebook digital yang telah digabungkan namun belum memiliki nomor halaman resmi.
- **Fitur Utama**:
  - Format nomor fleksibel: `"1"`, `"Halaman 1 dari 10"`, `"Hal. 1"`, atau angka Romawi (`"i, ii, iii"`).
  - Posisi nomor: 6 titik penempatan (Bawah Tengah, Bawah Kanan, Bawah Kiri, Atas Kanan, dll.).
  - Pengecualian halaman sampul (misal: penomoran baru dimulai dari halaman 2 atau 3).
- **Estimasi Teknologi**: `pdf-lib` Bates Stamping Engine.

---

### 🥉 3. Potong / Trim Margin PDF (Crop PDF)
- **Kategori**: Format PDF (`/tools/crop-pdf`)
- **Tingkat Rekomendasi**: **Menengah (Pembersihan Dokumen)**
- **Fitur Utama**:
  - Potong margin putih berlebih pada scan buku atau dokumen jurnal.
  - Seleksi kotak potong interaktif visual per halaman atau terapkan ke semua halaman sekaligus.
- **Estimasi Teknologi**: `pdf-lib` MediaBox / CropBox Adjustment.

---

### 🎖️ 4. Edit PDF (Anotasi, Teks, & Bentuk)
- **Kategori**: Interaktif PDF (`/tools/edit-pdf`)
- **Tingkat Rekomendasi**: **Tinggi (Peralatan Kantor Lengkap)**
- **Fitur Utama**:
  - Bubuhi kotak teks, sorotan warna (highlighter), garis bawah, panah, dan stempel dokumen.
- **Estimasi Teknologi**: Canvas PDF Annotation Layer over `pdfjs-dist` + `pdf-lib`.

---

## 📋 Peta Jalan Lengkap Fitur Mendatang (Backlog Roadmap)

Berikut adalah daftar urutan lengkap seluruh fitur yang direncanakan untuk DataScry:

| No | Modul Fitur Baru | Kategori | Prioritas | Rute Target | Estimasi Teknologi | Status |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Cap Air Gambar (Watermark IMAGE)** | Gambar & Keamanan | Selesai | `/tools/watermark-image` | Canvas 2D Text & Stamp Renderer | ✅ **Sudah Aktif** |
| **2** | **Tingkatkan Resolusi Foto (AI Image Upscaler)** | Gambar & AI | Selesai | `/tools/upscale-image` | On-device Super-Resolution | ✅ **Sudah Aktif** |
| **3** | **Ubah Ukuran Gambar Massal (Resize IMAGE)** | Gambar | Selesai | `/tools/resize-image` | Canvas API (Persen & Dimensi Piksel) | ✅ **Sudah Aktif** |
| **4** | **Putar Gambar Massal (Rotate IMAGE)** | Gambar | 🥇 Prioritas 1 | `/tools/rotate-image` | Batch Canvas Rotator | ⏳ Siap Dikerjakan |
| **5** | **Penomoran Halaman Otomatis (Page Numbering)** | Format PDF | 🥈 Prioritas 2 | `/tools/number-pdf` | `pdf-lib` Bates Stamping | ⏳ Siap Dikerjakan |
| **6** | **Potong / Trim Margin PDF (Crop PDF)** | Format PDF | 🥉 Prioritas 3 | `/tools/crop-pdf` | Bounding Box Crop & MediaBox | ⏳ Siap Dikerjakan |
| **7** | **Edit PDF (Anotasi, Teks, & Bentuk)** | Interaktif PDF | Prioritas 4 | `/tools/edit-pdf` | Canvas PDF Annotation Layer | ⏳ Backlog |
| **8** | **PDF ke Markdown (PDF to Markdown)** | AI & Teks | Prioritas 5 | `/tools/pdf-to-markdown` | `pdfjs-dist` Layout Parser | ⏳ Backlog |
| **9** | **Editor Foto Ringan (Photo Editor)** | Gambar | Prioritas 6 | `/tools/photo-editor` | Filter Canvas (Brightness, Tint) | ⏳ Backlog |
| **10** | **Pembuat Meme Kustom (Meme Generator)** | Kreatif | Prioritas 7 | `/tools/meme-generator` | Canvas Text Impact + Templates | ⏳ Backlog |
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
