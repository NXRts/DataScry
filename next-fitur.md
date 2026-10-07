# 🚀 Roadmap & Inventaris Fitur DataScry

Dokumen ini merangkum inventaris seluruh fitur yang telah terimplementasi serta peta jalan pengembangan fitur baru untuk **DataScry**. Seluruh fitur dibangun dengan memegang teguh filosofi inti: **100% Client-Side, Luring (Offline-First), Tanpa Pengiriman Berkas ke Server, dan Privasi Mutlak**.

---

## 📊 Matriks Status Fitur DataScry

### 1. Fitur yang Sudah Aktif & Siap Digunakan (✅ Selesai - 20 Alat)

| Modul Fitur | Kategori | Rute Halaman | Keterangan Standar Fitur |
| :--- | :--- | :--- | :--- |
| **Hapus Latar Belakang Foto (Remove BG)** | Gambar & AI | `/tools/remove-background` | ISNet FP16 On-Device AI, HD Lossless, Presets Pas Foto, Slider Before/After |
| **Potong & Pas Foto (Crop & Resize)** | Manipulasi Gambar | `/tools/crop-image` | Preset Pas Foto 2×3, 3×4, 4×6 cm, Atur Piksel Presisi, Rotasi/Flip, Rule of Thirds |
| **JPG ke PDF** | Konversi | `/tools/jpg-to-pdf` | *Gold Standard*: Lightbox Zoom 400%, Grid Thumbnail, Orientasi/Margin Kustom |
| **PDF ke JPG** | Konversi | `/tools/pdf-to-jpg` | *Gold Standard*: Seleksi Halaman, Ekspor ZIP & Direct Download, Lightbox HD |
| **Kompresi Dokumen & Foto (Compress)** | Optimasi | `/tools/compress` | Smart Compression multi-level, kalkulator hemat byte, pratinjau sebelum/sesudah |
| **Gabung PDF (Merge PDF)** | Manajemen PDF | `/tools/merge-pdf` | Drag-to-reorder, thumbnail visual multi-halaman |
| **Pisah PDF (Split PDF)** | Manajemen PDF | `/tools/split-pdf` | Mode rentang, halaman genap/ganjil, ekstraksi selektif |
| **Atur & Kelola Halaman PDF (Organize PDF)** | Manajemen PDF | `/tools/organize-pdf` | Drag & drop urutan visual, hapus halaman, putar halaman, duplikat halaman |
| **Putar PDF (Rotate PDF)** | Manajemen PDF | `/tools/rotate-pdf` | Rotasi 90°/180°/270° per halaman atau serentak |
| **Tanda Tangan PDF (Sign PDF)** | Tanda Tangan | `/tools/sign-pdf` | Canvas sentuh interaktif, impor stempel PNG transparan, multi-halaman |
| **Cap Air PDF (Watermark PDF)** | Keamanan | `/tools/watermark-pdf` | Teks & gambar, kustomisasi opasitas, rotasi sudut, tata letak grid/pusat |
| **Kunci PDF (Protect PDF)** | Keamanan | `/tools/protect-pdf` | Enkripsi kata sandi dokumen berbasis WebAssembly |
| **Buka Kunci PDF (PDF Unlock)** | Keamanan | `/tools/unlock-pdf` | Hapus proteksi password permanen, dekripsi AES-256 & RC4 client-side |
| **Sensor Data Sensitif PDF (PDF Redactor)** | Keamanan & Privasi | `/tools/redact-pdf` | *True Redaction*: Burn-in pixel bitmap, musnahkan aliran teks sensitif (NIK, Rekening, Gaji), 3 gaya sensor |
| **Word ke PDF (Word to PDF)** | Konversi | `/tools/word-to-pdf` | Rendering docx lokal langsung menjadi PDF |
| **PDF ke Word (PDF to Word)** | Konversi | `/tools/pdf-to-word` | Ekstraksi teks & struktur menjadi berkas `.docx` |
| **Gabung Word (Merge Word)** | Dokumen | `/tools/merge-word` | Penggabungan multi-file `.docx` secara client-side |
| **Arsip ZIP (Archive ZIP)** | Utilitas Berkas | `/tools/archive-zip` | Kompresi multi-berkas menjadi arsip `.zip` lokal |
| **Inspeksi Metadata (Metadata Viewer)** | Privasi | `/tools/metadata-viewer` | Analisis atribut internal dokumen & berkas |
| **Pembersih EXIF (Scrub EXIF)** | Privasi | `/tools/scrub-exif` | Hapus metadata GPS & data sensitif kamera dari foto |

---

### 2. Peta Jalan Fitur Baru Mendatang (⏳ Rencana Pengembangan)

| No | Modul Fitur Baru | Kategori | Prioritas | Rute Target | Estimasi Teknologi |
| :-: | :--- | :--- | :--- | :---: | :--- |
| **1** | **Sensor & Blur Wajah / Plat Nomor (Blur Face)** | Privasi Gambar | 🥇 Prioritas 1 (Rekomendasi Utama) | `/tools/blur-face` | BlazeFace / MediaPipe Local + Canvas Gaussian Blur |
| **2** | **Tingkatkan Resolusi Foto (AI Image Upscaler)** | Gambar & AI | 🥈 Prioritas 2 (Rekomendasi #2) | `/tools/upscale-image` | On-device Super-Resolution (WebGL / Bicubic Sharp) |
| **3** | **Ubah Ukuran Gambar (Resize IMAGE)** | Gambar | 🥉 Prioritas 3 (Rekomendasi #3) | `/tools/resize-image` | Canvas API (Persen & Dimensi Piksel) |
| **4** | **Ekstrak & Intip Isi ZIP (ZIP Viewer)** | Utilitas Berkas | Prioritas 4 | `/tools/unzip` | `jszip` (sudah terpasang di dependensi) |
| **5** | **Cap Air Gambar (Watermark IMAGE)** | Gambar & Hak Cipta | Prioritas 5 | `/tools/watermark-image` | Canvas 2D Stamp & Text Renderer |
| **6** | **Konverter Format Gambar Universal** | Gambar | Prioritas 6 | `/tools/convert-image` | Canvas API (WebP ⇄ JPG ⇄ PNG ⇄ AVIF ⇄ GIF) |
| **7** | **Putar Gambar Massal (Rotate IMAGE)** | Gambar | Prioritas 7 | `/tools/rotate-image` | Batch Canvas Rotator (Deteksi Portrait/Landscape) |
| **8** | **Penomoran Halaman Otomatis (Page Numbering)** | Format PDF | Prioritas 8 | `/tools/number-pdf` | `pdf-lib` Bate Stamping ("Halaman X dari Y") |
| **9** | **Potong / Trim Margin PDF (Crop PDF)** | Format PDF | Prioritas 9 | Bounding Box Crop & MediaBox Resizing (`pdf-lib`) |
| **10** | **Edit PDF (Anotasi, Teks, & Bentuk)** | Interaktif PDF | Prioritas 10 | Canvas PDF Annotation Layer (Text, Shapes, Freehand) |
| **11** | **PDF ke Markdown (PDF to Markdown untuk AI/LLM)** | AI & Teks | Prioritas 11 | `pdfjs-dist` Layout Parser to GFM Markdown |
| **12** | **Editor Foto Ringan (Photo Editor)** | Gambar | Prioritas 12 | Filter CSS / Canvas (Brightness, Contrast, Text, Frame) |
| **13** | **Pembuat Meme Kustom (Meme Generator)** | Kreatif | Prioritas 13 | Meme Template Canvas Generator (Font Impact + Outline) |
| **14** | **OCR Ekstrak Teks Dokumen (Offline OCR)** | AI & Teks | Prioritas 14 | `tesseract.js` WebAssembly Worker |
| **15** | **PDF ke Excel (PDF to Excel)** | Konversi Office | Prioritas 15 | Table Structure Recognition to SheetJS (`xlsx`) |
| **16** | **Excel ke PDF (Excel to PDF)** | Konversi Office | Prioritas 16 | SheetJS (`xlsx`) Renderer to `pdf-lib` |
| **17** | **PDF ke PowerPoint (PDF to PPTX)** | Konversi Office | Prioritas 17 | Vector/Raster Slide Extractor to `pptxgenjs` |
| **18** | **PowerPoint ke PDF (PPTX to PDF)** | Konversi Office | Prioritas 18 | Client-side OpenXML Presentation Parser to PDF |
| **19** | **Formulir PDF Interaktif (PDF Forms & Filler)** | Interaktif PDF | Prioritas 19 | AcroForms Reader & Field Filler via `pdf-lib` |
| **20** | **Bandingkan Dokumen PDF (Compare PDF Difference)** | Analisis PDF | Prioritas 20 | Side-by-side Visual Diff & Pixel-Level Inspection |
| **21** | **Pindai Dokumen ke PDF (Scan to PDF via Kamera)** | Utilitas Mobile | Prioritas 21 | WebRTC Camera Capture + Perspective Crop + PDF Export |
| **22** | **Perbaiki PDF Rusak (Repair Corrupt PDF)** | Utilitas PDF | Prioritas 22 | Byte-stream Scanner, Header Reconstruction & Xref Rebuild |
| **23** | **Konversi PDF ke PDF/A (Arsip Standar ISO)** | Kepatuhan PDF | Prioritas 23 | PDF/A-1b Metadata & Color Profile Embedding (`pdf-lib`) |
| **24** | **Ringkasan Dokumen AI (AI PDF Summarizer)** | AI & Teks | Prioritas 24 | On-Device LLM (WebLLM / Wasm Transformers) |
| **25** | **Terjemahan Dokumen PDF (Translate PDF)** | AI & Teks | Prioritas 25 | Local Translation Worker with Layout Preservation |
| **26** | **Konversi HTML ke PDF (HTML to PDF)** | Konversi Web | Prioritas 26 | Print CSS Media Engine + `html2pdf.js` / Canvas |
| **27** | **Konversi HTML ke Gambar (HTML to IMAGE)** | Konversi Web | Prioritas 27 | SVG ForeignObject / html2canvas lokal |
| **28** | **Pembuat Pas Foto Cetak Siap Pakai** | Gambar & Cetak | Prioritas 28 | Canvas Face Alignment + PDF Print Layout 4R/A4 |
| **29** | **Alur Kerja Otomatis (Create a Workflow)** | Otomasi | Prioritas 29 | Pipeline Chaining Engine (Contoh: Kompres -> Watermark -> Enkripsi) |

---

## 🎨 Detail Spesifikasi Fitur Baru (Berdasarkan Kategori)

---

### A. 🖼️ Kategori Manipulasi & AI Gambar (Image Suite)

#### 1. 🔍 Tingkatkan Resolusi Foto (AI Image Upscaler)
- **Deskripsi**: Memperbesar dimensi gambar (skala 2x hingga 4x) dengan tetap mempertahankan ketajaman visual, meminimalkan pikselasi, dan mempertajam tepi objek.
- **Kasus Penggunaan**: Memperbaiki foto resolusi rendah, logo jadul, atau tangkapan layar kecil agar layak dicetak atau dijadikan wallpaper HD.
- **Kunci Arsitektur**:
  - Model inferensi AI super-resolution lokal berbasis WebGL/WebAssembly (Real-ESRGAN lightweight / bicubic edge sharpening).
  - Mode pratinjau perbandingan split-slider (*before vs after upscaled*).
  - Ekspor format PNG/JPG resolusi tinggi tanpa batasan kuota server.

#### 2. 🎭 Sensor & Blur Wajah / Objek Sensitif (Blur Face & Privacy)
- **Deskripsi**: Mendeteksi dan memburamkan (*gaussian blur*) wajah orang, plat nomor kendaraan, atau area rahasia pada foto secara otomatis atau manual.
- **Kasus Penggunaan**: Menjaga privasi pejalan kaki, anak di bawah umur, atau identitas pribadi sebelum mengunggah foto jalanan/kegiatan ke media sosial.
- **Fitur Utama**:
  - Deteksi wajah otomatis client-side via BlazeFace/MediaPipe.
  - Kuas/kotak seleksi manual untuk plat nomor, dokumen, atau objek kustom.
  - Pilihan intensitas keburaman (*blur radius*) atau sensor kotak mosaik/hitam pekat.

#### 3. 📐 Ubah Ukuran Gambar (Resize IMAGE)
- **Deskripsi**: Mengubah ukuran dimensi gambar secara presisi berdasarkan persentase (25%, 50%, 75%) atau piksel pasti (Width × Height).
- **Fitur Utama**:
  - Tombol *Lock Aspect Ratio* (rasio aspek terkunci otomatis).
  - Pilihan kualitas resampling (Lanczos/Bicubic smooth) agar gambar hasil resize tidak bergerigi.
  - Pemrosesan batch multi-gambar sekaligus dengan hasil unduhan ZIP.

#### 4. ✂️ Potong & Ubah Ukuran Gambar Presisi (Crop & Resize IMAGE)
- **Status**: ✅ Selesai (Aktif di `/tools/crop-image`)
- **Rute Target**: `/tools/crop-image`
- **Deskripsi**: Memotong dan mengubah dimensi gambar/pas foto secara presisi dengan kotak seleksi visual interaktif.
- **Fitur Utama**:
  - Preset rasio resmi: Pas Foto Indonesia (2×3, 3×4, 4×6 cm), Persegi (1:1), Cerita/Reels (9:16), Standar Layar (16:9), Foto (4:3), Profil Lingkaran.
  - Input ukuran piksel manual untuk hasil potongan presisi pendaftaran CPNS/BUMN.
  - Rotasi bebas (90° CW/CCW), flip horizontal/vertikal, dan grid pembantu *Rule of Thirds*.

#### 5. 💧 Cap Air Gambar (Watermark IMAGE)
- **Deskripsi**: Membubuhkan teks hak cipta atau stempel logo transparan di atas foto dalam hitungan detik.
- **Fitur Utama**:
  - Mode Teks: Pilihan font, ukuran, warna, opasitas, dan rotasi sudut.
  - Mode Logo: Upload PNG transparan, skala ukuran logo.
  - Penempatan: 9 titik jangkar (Pojok kiri atas, tengah, pojok kanan bawah, dll.) atau pola ubin berulang (*repeating tiled grid*).

#### 6. 🔄 Putar Gambar Massal (Rotate IMAGE)
- **Deskripsi**: Memutar puluhan foto JPG, PNG, atau WebP sekaligus dengan mudah.
- **Fitur Khusus**:
  - Opsi pintar: Putar hanya gambar orientasi *Portrait*, atau putar hanya gambar *Landscape*.
  - Pemutaran 90° searah jarum jam, 90° berlawanan arah, atau 180°.

#### 7. 🎨 Editor Foto Ringan (Photo Editor)
- **Deskripsi**: Alat penyunting foto cepat di peramban tanpa perlu membuka software berat seperti Photoshop.
- **Fitur Utama**:
  - Penyesuaian warna: *Brightness*, *Contrast*, *Saturation*, *Exposure*, dan *Hue*.
  - Efek filter artistik: *Grayscale*, *Sepia*, *Vintage*, *Invert*.
  - Pembalik gambar (*Flip Horizontal* & *Flip Vertical*).
  - Penambahan teks, bingkai (*frames*), dan stiker dasar.

#### 8. 😂 Pembuat Meme Kustom (Meme Generator)
- **Deskripsi**: Membuat meme viral secara instan langsung di peramban.
- **Fitur Utama**:
  - Pilihan template meme legendaris bawaan atau upload gambar sendiri.
  - Input teks atas (*Top Text*) dan teks bawah (*Bottom Text*) dengan font khas *Impact* bergaris tepi hitam pekat (*outline*).
  - Teks dapat digeser, diputar, dan diubah ukurannya secara bebas di atas gambar.

#### 9. 🌐 Konversi HTML ke Gambar (HTML to IMAGE)
- **Deskripsi**: Mengubah potongan kode HTML/CSS, kartu visual, atau tabel data web menjadi berkas gambar JPG/PNG tajam.
- **Fitur Utama**:
  - Render elemen web ke Canvas via SVG `foreignObject` secara lokal.
  - Pengaturan rasio densitas piksel (1x, 2x, 3x Retina) untuk hasil jernih anti-blur.

---

### B. 🛡️ Kategori Keamanan & Privasi Dokumen (Document Security)

#### 10. ⬛ Sensor / Redaksi Data Sensitif Permanen (PDF Redactor)
- **Status**: ✅ Selesai (Aktif di `/tools/redact-pdf`)
- **Rute Target**: `/tools/redact-pdf`
- **Deskripsi**: Menutup data pribadi (NIK, nomor KK, nomor rekening bank, alamat, tanda tangan) dengan kotak sensor permanen.
- **Keunggulan**: Teks dan gambar di bawah kotak sensor **dihapus secara permanen dari stream dokumen PDF**, bukan sekadar stiker visual yang masih bisa disalin teksnya. Dilengkapi 3 gaya sensor (Blackout, Whiteout, Badge DISENSOR).

#### 11. 🔓 Buka Kunci PDF (PDF Unlock & Password Remover)
- **Status**: ✅ Selesai (Aktif di `/tools/unlock-pdf`)
- **Deskripsi**: Menghapus proteksi kata sandi dari dokumen PDF yang sudah diketahui password-nya secara permanen dan 100% luring via Web Crypto API.

---

### C. 📑 Kategori Konversi & Ekstraksi Office (Office Document Suite)

#### 12. 📊 PDF ke Excel (PDF to Excel)
- **Deskripsi**: Mengekstrak data tabel dari halaman PDF langsung menjadi spreadsheet Excel (`.xlsx`) yang dapat diedit rumus dan angkanya.
- **Kunci Arsitektur**: Algoritma deteksi batas kolom/baris (*bounding box analysis*) berbasis koordinat teks `pdfjs-dist` dikonversi ke workbook SheetJS.

#### 13. 📈 Excel ke PDF (Excel to PDF)
- **Deskripsi**: Mengubah file spreadsheet Excel (`.xlsx`, `.xls`, `.csv`) menjadi dokumen PDF rapi dengan orientasi halaman otomatis (*Fit Sheet to Page*).

#### 14. 📽️ PDF ke PowerPoint (PDF to PowerPoint)
- **Deskripsi**: Mengubah halaman PDF menjadi slide presentasi PowerPoint (`.pptx`) di mana teks, gambar latar, dan bentuk dapat diedit kembali per slide.

#### 15. 💻 PowerPoint ke PDF (PowerPoint to PDF)
- **Deskripsi**: Mengonversi presentasi slide `.pptx` menjadi file PDF siap cetak atau siap presentasi tanpa risiko font berantakan di perangkat lain.

---

### D. 🛠️ Kategori Penyuntingan & Penataan PDF (PDF Editing & Organization)

#### 16. 🗂️ Atur & Kelola Halaman PDF (Organize PDF)
- **Status**: ✅ Selesai (Aktif di `/tools/organize-pdf`)
- **Rute Target**: `/tools/organize-pdf`
- **Deskripsi**: Mengatur tata letak halaman PDF dalam tampilan grid visual: memindahkan urutan (*drag and drop reorder*), menduplikasi halaman, menghapus halaman tertentu, atau menyisipkan halaman kosong/PDF lain di posisi spesifik.

#### 17. ✂️ Potong & Trim Margin PDF (Crop PDF)
- **Deskripsi**: Memotong margin putih yang terlalu lebar atau memotong dokumen PDF ke area penting tertentu dengan mengubah `MediaBox` dan `CropBox` halaman tanpa merusak ketajaman vektor teks.

#### 18. ✏️ Edit PDF (Anotasi, Teks, & Bentuk)
- **Deskripsi**: Membubuhkan catatan, menambahkan teks baru dengan font kustom, menyorot teks (*highlight*), menggambar coretan bebas (*freehand pen*), serta menyisipkan bentuk geometris (persegi, lingkaran, panah) di atas halaman PDF.

#### 19. 📋 Formulir PDF Interaktif (PDF Forms & Filler)
- **Deskripsi**: Mendeteksi dan mengisi formulir PDF interaktif (*AcroForms*) seperti teks isian, tanda centang (*checkbox*), tombol radio, dan dropdown. Mendukung pembuatan form baru yang dapat diisi orang lain.

#### 20. 🩹 Perbaiki PDF Rusak (Repair Corrupt PDF)
- **Deskripsi**: Memindai aliran byte (*byte-stream*) dokumen PDF yang rusak atau tidak bisa dibuka oleh pembaca PDF standar, membangun ulang tabel referensi silang (*Xref table*), dan menyelamatkan halaman yang masih utuh.

#### 21. 🏛️ Konversi PDF ke PDF/A (Arsip Standar ISO)
- **Deskripsi**: Mengonversi berkas PDF menjadi standar ISO PDF/A (PDF/A-1b / PDF/A-2b) untuk kebutuhan arsip jangka panjang instansi/pemerintah, memastikan font tertanam penuh (*embedded fonts*) dan profil warna terstandarisasi.

---

### E. 🤖 Kategori AI & Kecerdasan Dokumen (PDF Intelligence & Automation)

#### 22. 📝 PDF ke Markdown (PDF to Markdown untuk LLM & RAG)
- **Deskripsi**: Mengonversi dokumen PDF menjadi format Markdown (`.md`) bersih dengan mempertahankan struktur heading (`#`, `##`), tabel markdown, daftar butir (*bullet points*), dan tautan. Sangat ideal untuk memasukkan dokumen ke prompt AI/LLM atau catatan digital (Obsidian/Notion).

#### 23. 🧠 Ringkasan Dokumen AI (AI PDF Summarizer)
- **Deskripsi**: Menghasilkan ringkasan poin-poin penting, intisari eksekutif, dan FAQ dari jurnal, skripsi, atau laporan tebal menggunakan model AI lokal on-device tanpa mengunggah dokumen ke server pihak ketiga.

#### 24. 🌐 Terjemahan Dokumen PDF (Translate PDF)
- **Deskripsi**: Menerjemahkan isi teks dokumen PDF ke berbagai bahasa dengan tetap mempertahankan tata letak, posisi gambar, dan format tabel dokumen asli.

#### 25. 🔍 Bandingkan Dokumen PDF (Compare PDF Difference)
- **Deskripsi**: Membuka 2 versi dokumen PDF berdampingan (*side-by-side*) dengan visualisasi warna perbandingan: hijau untuk teks baru yang ditambahkan, dan merah untuk teks yang dihapus atau diubah.

#### 26. 📷 Pindai Dokumen ke PDF (Scan to PDF via Kamera)
- **Deskripsi**: Menggunakan kamera webcam laptop atau kamera ponsel untuk memindai dokumen fisik, mengoreksi sudut perspektif (*keystone correction*), meningkatkan kontras hitam-putih, dan menyusunnya menjadi file PDF rapi.

#### 27. ⚡ Alur Kerja Otomatis (Create a Workflow)
- **Deskripsi**: Membangun pipeline otomatisasi mandiri: menggabungkan beberapa alat menjadi satu alur terpadu. Contoh: `Upload Banyak Berkas -> Kompres Otomatis -> Beri Watermark -> Proteksi Password -> Unduh ZIP Otomatis`.

---

### F. 📦 Kategori Utilitas Berkas Lainnya

#### 28. 📦 Ekstrak & Intip Isi ZIP (ZIP Unarchiver / Viewer)
- **Deskripsi**: Membuka struktur arsip `.zip` langsung di browser, melihat pratinjau isi berkas, dan mengekstrak berkas terpilih tanpa aplikasi luar.

#### 29. 🔢 Penomoran Halaman Otomatis (Page Numbering)
- **Deskripsi**: Menyisipkan penomoran otomatis ("Halaman 1 dari 15", angka romawi, angka standar) pada dokumen PDF dengan margin dan posisi kustom.

#### 30. 📝 OCR Ekstrak Teks Dokumen (Offline OCR)
- **Deskripsi**: Memindai foto dokumen fisik, kwitansi, atau struk menjadi teks digital yang dapat disalin tanpa membutuhkan koneksi internet (via Tesseract.js WebAssembly).

#### 31. 📸 Pembuat Pas Foto Cetak Siap Pakai (Passport Photo Maker)
- **Deskripsi**: Memotong foto wajah sesuai standar resmi (2×3, 3×4, 4×6 cm), mengombinasikannya dengan fitur *Hapus Latar Belakang*, dan menyusunnya ke dalam lembar cetak standar (ukuran 4R/A4) siap print.

#### 32. 🌐 Konversi HTML ke PDF (HTML to PDF)
- **Deskripsi**: Mengonversi kode HTML/CSS, dokumen web, atau invoice faktur berbasis web menjadi file PDF beresolusi tinggi dengan dukungan pemisah halaman (*page breaks*) presisi.

---

## 💎 Standar Kualitas Fitur DataScry (7 Pilar Gold Standard)

Seluruh fitur baru yang akan dibangun wajib mengadopsi standar yang telah dibuktikan pada modul **JPG ke PDF**, **PDF ke JPG**, dan **Hapus Latar Belakang (Remove BG)**:

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
   - Dukungan unduhan langsung per berkas (*single download*) dan pengemasan ZIP batch untuk antrean banyak file.
7. **Offline-First, Privasi Mutlak, & Ketahanan Mobile**:
   - **Nol Telemetri, Nol Pelacakan, Nol Pengiriman Server**. Semua komputasi berjalan 100% di CPU/GPU peramban pengguna (*in-memory*). Target sentuh nyaman untuk layar ponsel (*mobile touch-friendly*).

