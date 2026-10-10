export type ToolCategory = "all" | "pdf" | "image" | "utility";

export interface ToolItem {
    id: string;
    title: string;
    description: string;
    href: string;
    category: "pdf" | "image" | "utility";
    color: string;
    iconName: string;
    badge?: string;
}

export const TOOL_CATEGORIES = [
    { id: "all" as ToolCategory, label: "Semua Alat", count: 23 },
    { id: "pdf" as ToolCategory, label: "PDF & Dokumen", count: 13 },
    { id: "image" as ToolCategory, label: "Foto & Gambar", count: 6 },
    { id: "utility" as ToolCategory, label: "Arsip & Utilitas", count: 4 }
];

export const ALL_TOOLS: ToolItem[] = [
    {
        id: "jpg-to-pdf",
        title: "JPG ke PDF",
        description: "Ubah foto JPG, PNG, atau WebP menjadi dokumen PDF dengan cepat.",
        href: "/tools/jpg-to-pdf",
        category: "pdf",
        color: "amber",
        iconName: "ImageIcon"
    },
    {
        id: "pdf-to-jpg",
        title: "PDF ke JPG",
        description: "Ekstrak setiap halaman dari PDF menjadi gambar berkualitas tinggi.",
        href: "/tools/pdf-to-jpg",
        category: "pdf",
        color: "orange",
        iconName: "FileImage"
    },
    {
        id: "remove-background",
        title: "Hapus Latar Belakang",
        description: "Potong background foto secara otomatis dan bersih dengan resolusi tajam HD.",
        href: "/tools/remove-background",
        category: "image",
        color: "emerald",
        iconName: "Eraser",
        badge: "AI HD"
    },
    {
        id: "convert-image",
        title: "Konverter Format Gambar",
        description: "Ubah format WebP ke JPG, PNG, atau sebaliknya secara cepat, massal, dan bebas server.",
        href: "/tools/convert-image",
        category: "image",
        color: "amber",
        iconName: "ArrowLeftRight",
        badge: "Baru"
    },
    {
        id: "crop-image",
        title: "Potong & Pas Foto (Crop)",
        description: "Potong pas foto resmi 2x3, 3x4, 4x6 cm atau ubah ukuran gambar dengan presisi pixel.",
        href: "/tools/crop-image",
        category: "image",
        color: "teal",
        iconName: "Crop"
    },
    {
        id: "blur-face",
        title: "Sensor & Blur Foto",
        description: "Buramkan wajah, plat nomor kendaraan, atau data sensitif pada foto secara instan.",
        href: "/tools/blur-face",
        category: "image",
        color: "rose",
        iconName: "EyeOff"
    },
    {
        id: "merge-pdf",
        title: "Gabungkan PDF",
        description: "Kombinasikan beberapa dokumen PDF menjadi satu file dalam satu klik.",
        href: "/tools/merge-pdf",
        category: "pdf",
        color: "purple",
        iconName: "FilesIcon",
        badge: "Populer"
    },
    {
        id: "split-pdf",
        title: "Pisahkan PDF",
        description: "Ekstrak satu atau beberapa halaman spesifik dari dokumen PDF besar.",
        href: "/tools/split-pdf",
        category: "pdf",
        color: "pink",
        iconName: "Scissors"
    },
    {
        id: "organize-pdf",
        title: "Atur & Kelola Halaman PDF",
        description: "Urutkan ulang (drag & drop), hapus halaman, atau putar halaman dalam kisi visual.",
        href: "/tools/organize-pdf",
        category: "pdf",
        color: "indigo",
        iconName: "FileStack"
    },
    {
        id: "rotate-pdf",
        title: "Putar Halaman PDF",
        description: "Perbaiki orientasi halaman PDF yang miring atau terbalik dengan pratinjau visual instan.",
        href: "/tools/rotate-pdf",
        category: "pdf",
        color: "sky",
        iconName: "RotateCw"
    },
    {
        id: "watermark-pdf",
        title: "Watermark PDF",
        description: "Beri cap pengaman teks diagonal (CASN, Bank, Rahasia) untuk melindungi berkas penting.",
        href: "/tools/watermark-pdf",
        category: "pdf",
        color: "fuchsia",
        iconName: "Stamp"
    },
    {
        id: "sign-pdf",
        title: "Tanda Tangan PDF",
        description: "Bubuhi tanda tangan, paraf transparan, atau ketik nama langsung di atas dokumen PDF Anda.",
        href: "/tools/sign-pdf",
        category: "pdf",
        color: "pink",
        iconName: "PenTool"
    },
    {
        id: "protect-pdf",
        title: "Kunci & Proteksi PDF",
        description: "Kunci dokumen PDF dengan kata sandi rahasia dan enkripsi standar militer AES-256.",
        href: "/tools/protect-pdf",
        category: "pdf",
        color: "amber",
        iconName: "Lock"
    },
    {
        id: "unlock-pdf",
        title: "Buka Kunci PDF",
        description: "Hapus proteksi kata sandi dari dokumen PDF Anda secara permanen dan 100% luring.",
        href: "/tools/unlock-pdf",
        category: "pdf",
        color: "emerald",
        iconName: "Unlock"
    },
    {
        id: "redact-pdf",
        title: "Sensor Data PDF (Redact)",
        description: "Sensor NIK, gaji, nomor rekening, atau tanda tangan secara permanen dan bebas intip.",
        href: "/tools/redact-pdf",
        category: "pdf",
        color: "red",
        iconName: "ShieldAlert"
    },
    {
        id: "compress",
        title: "Kompres PDF & Gambar",
        description: "Kurangi ukuran file dokumen atau foto Anda untuk menghemat ruang.",
        href: "/tools/compress",
        category: "utility",
        color: "blue",
        iconName: "Minimize2"
    },
    {
        id: "archive-zip",
        title: "Kompres Berkas ke ZIP",
        description: "Padatkan dan bungkus banyak file apa saja menjadi arsip .ZIP terkompresi.",
        href: "/tools/archive-zip",
        category: "utility",
        color: "violet",
        iconName: "FolderArchive"
    },
    {
        id: "unzip",
        title: "Ekstrak & Intip ZIP",
        description: "Buka, intip isi berkas, dan ekstrak file arsip .ZIP langsung tanpa aplikasi luar.",
        href: "/tools/unzip",
        category: "utility",
        color: "fuchsia",
        iconName: "FolderOpen",
        badge: "Baru"
    },
    {
        id: "scrub-exif",
        title: "Scrub EXIF Jejak Digital",
        description: "Hapus metadata dan lokasi tersembunyi pada foto sebelum diunggah ke internet.",
        href: "/tools/scrub-exif",
        category: "image",
        color: "lime",
        iconName: "ShieldCheck"
    },
    {
        id: "metadata-viewer",
        title: "Penampil Metadata",
        description: "Intip informasi EXIF rahasia (kamera, GPS, tanggal asli) di balik foto atau dokumen PDF Anda.",
        href: "/tools/metadata-viewer",
        category: "image",
        color: "cyan",
        iconName: "FileSearch"
    },
    {
        id: "merge-word",
        title: "Gabungkan Word",
        description: "Kombinasikan beberapa dokumen Word (.docx) menjadi satu file utuh.",
        href: "/tools/merge-word",
        category: "utility",
        color: "blue",
        iconName: "FileText"
    },
    {
        id: "pdf-to-word",
        title: "PDF ke Word",
        description: "Ubah dokumen PDF menjadi file Word (.docx) yang dapat diedit dengan mudah.",
        href: "/tools/pdf-to-word",
        category: "pdf",
        color: "teal",
        iconName: "FileText"
    },
    {
        id: "word-to-pdf",
        title: "Word ke PDF",
        description: "Konversi dokumen Word (.docx) menjadi format PDF yang universal dan aman.",
        href: "/tools/word-to-pdf",
        category: "pdf",
        color: "indigo",
        iconName: "FileType"
    }
];
