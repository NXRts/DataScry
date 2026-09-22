# 🚀 Roadmap Fitur DataScry Selanjutnya

Dokumen ini merangkum rencana pengembangan fitur-fitur baru untuk **DataScry**. Seluruh fitur dirancang berpegang teguh pada filosofi utama: **100% Client-Side, Luring (Offline), Tanpa Server, dan Privasi Mutlak**.

---

## 🛡️ Kategori Keamanan & Privasi Tingkat Lanjut

### 1. ⬛ Sensor / Redaksi Data Sensitif (PDF Redactor)
- **Deskripsi**: Menutup data pribadi (NIK, nomor KK, nomor rekening, alamat, tanda tangan lama) dengan kotak hitam permanen yang menghapus data di bawahnya.
- **Kasus Penggunaan**: Melindungi data sensitif sebelum mengunggah dokumen ke media sosial atau formulir publik.
- **Fitur Utama**:
  - Penanda kotak seleksi visual di atas pratinjau halaman PDF.
  - Opsi warna penutup (Kotak Hitam Sensor / Putih).
  - Ekspor permanen di mana data teks/gambar yang ditutupi benar-benar terhapus (bukan sekadar stiker di atas teks).

### 2. 🔓 Buka Kunci PDF (PDF Unlock)
- **Deskripsi**: Menghapus proteksi kata sandi dari PDF yang sudah diketahui password-nya, agar file dapat diarsipkan atau dibuka langsung tanpa memasukkan password berulang kali.
- **Kasus Penggunaan**: Membuka dokumen slip gaji bulanan, rekening koran bank, atau e-faktur yang terkunci password NIK/tanggal lahir untuk disimpan secara rapi.
- **Teknologi**: `pdf-lib`.

---

## 🗂️ Kategori Utilitas Berkas & Dokumen

### 3. 📦 Ekstrak & Intip Isi ZIP (ZIP Unarchiver / Viewer)
- **Deskripsi**: Membuka dan mengekstrak berkas di dalam arsip `.zip` langsung di peramban tanpa perlu memasang aplikasi pihak ketiga (seperti WinRAR atau 7-Zip).
- **Kasus Penggunaan**: Membuka lampiran berkas ZIP di perangkat umum, Chromebook, atau smartphone tanpa aplikasi tambahan.
- **Teknologi**: Pustaka `jszip` (sudah terpasang).

### 4. 🔢 Penomoran Halaman Otomatis (Page Numbering)
- **Deskripsi**: Menambahkan nomor halaman otomatis pada dokumen PDF yang belum memiliki penomoran halaman (contoh: *"Halaman 1 dari 12"*).
- **Fitur**: Pilihan posisi (bawah tengah, bawah kanan, atas), jenis format penomoran (angka biasa, romawi, "Hal X dari Y"), margin, dan ukuran font.
- **Teknologi**: `pdf-lib`.

### 5. 🖼️ Konverter Format Foto Universal (WEBP ⇄ JPG ⇄ PNG)
- **Deskripsi**: Mengubah format gambar secara fleksibel, khususnya mengubah format modern seperti `.webp` menjadi `.jpg` atau `.png` yang sering menjadi syarat wajib upload berkas portal resmi/pemerintah.
- **Teknologi**: HTML5 Canvas API (tanpa server).

---

## 🧠 Kategori Eksplorasi Tingkat Lanjut

### 6. 📝 OCR Ekstrak Teks Dokumen (Offline Client-Side OCR)
- **Deskripsi**: Memindai foto struk, kwitansi, atau scan buku menjadi teks digital yang dapat disalin tanpa membutuhkan koneksi internet.
- **Teknologi**: `tesseract.js` yang berjalan pada Web Worker lokal di browser.
