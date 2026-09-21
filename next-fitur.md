# 🚀 Roadmap Fitur DataScry Selanjutnya

Dokumen ini merangkum rencana pengembangan fitur-fitur baru untuk **DataScry**. Seluruh fitur dirancang berpegang teguh pada filosofi utama: **100% Client-Side, Luring (Offline), Tanpa Server, dan Privasi Mutlak**.

---

## 🌟 Prioritas Utama (High Impact & Rekomendasi)

### 1. ✍️ Tanda Tangan Digital PDF (e-Sign PDF)
- **Deskripsi**: Fitur untuk menggambar tanda tangan langsung di layar (mouse/touchscreen), mengunggah gambar paraf berlatar transparan, dan menempelkannya dengan presisi di halaman dokumen mana pun.
- **Kasus Penggunaan**: Surat lamaran kerja, formulir pendaftaran, surat pernyataan, dokumen kontrak, dan berkas administrasi kuliah/kantor.
- **Fitur Utama**:
  - Pad gambar tanda tangan interaktif (halus dan responsif).
  - Pilihan warna tinta (hitam, biru tua).
  - Unggah stempel/paraf transparan (PNG).
  - Pengatur posisi & skala tanda tangan di atas pratinjau halaman PDF.
- **Teknologi**: Canvas API + `pdf-lib`.

---

### 2. 🔒 Proteksi & Kunci Password PDF (PDF Protect)
- **Deskripsi**: Mengunci dokumen PDF dengan kata sandi rahasia sebelum dikirim atau disimpan, melindungi data dari pihak yang tidak berhak.
- **Kasus Penggunaan**: Laporan keuangan, rekam medis pribadi, dokumen identitas, atau berkas rahasia perusahaan.
- **Fitur Utama**:
  - Enkripsi standar PDF (User Password untuk membuka, Owner Password untuk membatasi izin cetak/edit).
  - Indikator kekuatan kata sandi.
  - 100% diproses di browser tanpa ada kunci yang bocor ke internet.
- **Teknologi**: `pdf-lib` (built-in encryption support).

---

### 3. ✅ 🔄 Putar Halaman PDF (Rotate PDF Pages) - [Selesai Diimplementasikan]
- **Status**: ✅ **Tersedia di `/tools/rotate-pdf`**
- **Deskripsi**: Memperbaiki orientasi halaman dokumen hasil scan yang miring atau terbalik secara *lossless*.
- **Kasus Penggunaan**: Hasil scan scanner atau kamera HP yang terbalik 90° atau 180°.
- **Fitur Utama**:
  - Pratinjau visual seluruh thumbnail halaman dokumen dengan rotasi CSS instan.
  - Putar halaman individual (90° searah jarum jam, 90° berlawanan, atau 180°).
  - Tombol pintas "Putar Semua Kanan (+90°)" dan "Putar Semua Kiri (-90°)".
- **Teknologi**: `pdfjs-dist` (rendering thumbnail) + `pdf-lib` (modifikasi rotasi lossless).

---

## 🛡️ Kategori Keamanan & Privasi Tingkat Lanjut

### 4. 🏷️ Watermark & Stempel Pengaman PDF (PDF Watermark)
- **Deskripsi**: Menambahkan teks cap pengaman transparan diagonal pada setiap halaman dokumen.
- **Kasus Penggunaan**: Menambahkan tanda *"HANYA UNTUK VERIFIKASI BKN / CPNS"*, *"SALINAN KHUSUS BANK"*, atau *"DOKUMEN RAHASIA"* agar tidak disalahgunakan pihak ketiga.
- **Fitur Utama**:
  - Kustomisasi teks, tingkat transparansi (opacity), ukuran font, dan sudut kemiringan.
  - Opsi penempatan (semua halaman atau halaman ganjil/genap).

### 5. ⬛ Sensor / Redaksi Data Sensitif (PDF Redactor)
- **Deskripsi**: Menutup data pribadi (NIK, nomor KK, nomor rekening, alamat, tanda tangan lama) dengan kotak hitam permanen yang menghapus data di bawahnya.
- **Kasus Penggunaan**: Melindungi data sensitif sebelum mengunggah dokumen ke media sosial atau formulir publik.

### 6. 🔓 Buka Kunci PDF (PDF Unlock)
- **Deskripsi**: Menghapus proteksi kata sandi dari PDF yang sudah diketahui password-nya, agar file dapat diarsipkan atau dibuka langsung tanpa memasukkan password berulang kali.

---

## 🗂️ Kategori Utilitas Berkas & Dokumen

### 7. 📦 Ekstrak & Intip Isi ZIP (ZIP Unarchiver / Viewer)
- **Deskripsi**: Membuka dan mengekstrak berkas di dalam arsip `.zip` langsung di peramban tanpa perlu memasang aplikasi pihak ketiga (seperti WinRAR atau 7-Zip).
- **Teknologi**: Pustaka `jszip` (sudah terpasang).

### 8. 🔢 Penomoran Halaman Otomatis (Page Numbering)
- **Deskripsi**: Menambahkan nomor halaman otomatis pada dokumen PDF yang belum memiliki penomoran halaman (contoh: *"Halaman 1 dari 12"*).
- **Fitur**: Pilihan posisi (bawah tengah, bawah kanan, atas), jenis format penomoran, dan ukuran font.

### 9. 🖼️ Konverter Format Foto Universal (WEBP ⇄ JPG ⇄ PNG)
- **Deskripsi**: Mengubah format gambar secara fleksibel, khususnya mengubah format `.webp` menjadi `.jpg` atau `.png` yang sering menjadi syarat wajib portal resmi.

---

## 🧠 Kategori Eksplorasi Tingkat Lanjut

### 10. 📝 OCR Ekstrak Teks Dokumen (Offline Client-Side OCR)
- **Deskripsi**: Memindai foto struk, kwitansi, atau scan buku menjadi teks digital yang dapat disalin tanpa membutuhkan koneksi internet.
- **Teknologi**: `tesseract.js` yang berjalan pada Web Worker lokal.
