import Link from "next/link";
import {
    FileUp,
    FileImage,
    Image as ImageIcon,
    Files as FilesIcon,
    Scissors,
    Minimize2,
    ShieldCheck,
    FileSearch,
    FileText,
    FileType,
    FolderArchive,
    FolderOpen,
    RotateCw,
    Stamp,
    PenTool,
    Lock,
    Unlock,
    Eraser,
    ShieldAlert,
    Crop,
    FileStack,
    EyeOff,
    ArrowLeftRight
} from "lucide-react";

const TOOLS = [
    {
        title: "JPG ke PDF",
        description: "Ubah foto JPG, PNG, atau WebP menjadi dokumen PDF dengan cepat.",
        icon: <ImageIcon size={32} className="text-amber-500" />,
        href: "/tools/jpg-to-pdf",
        color: "amber"
    },
    {
        title: "PDF ke JPG",
        description: "Ekstrak setiap halaman dari PDF menjadi gambar berkualitas tinggi.",
        icon: <FileImage size={32} className="text-orange-500" />,
        href: "/tools/pdf-to-jpg",
        color: "orange"
    },
    {
        title: "Hapus Latar Belakang",
        description: "Potong background foto secara otomatis dan bersih dengan resolusi tajam HD.",
        icon: <Eraser size={32} className="text-emerald-400" />,
        href: "/tools/remove-background",
        color: "emerald"
    },
    {
        title: "Konverter Format Gambar",
        description: "Ubah format WebP ke JPG, PNG, atau sebaliknya secara cepat, massal, dan bebas server.",
        icon: <ArrowLeftRight size={32} className="text-amber-500" />,
        href: "/tools/convert-image",
        color: "amber"
    },
    {
        title: "Potong & Pas Foto (Crop)",
        description: "Potong pas foto resmi 2x3, 3x4, 4x6 cm atau ubah ukuran gambar dengan presisi pixel.",
        icon: <Crop size={32} className="text-teal-400" />,
        href: "/tools/crop-image",
        color: "teal"
    },
    {
        title: "Sensor & Blur Foto",
        description: "Buramkan wajah, plat nomor kendaraan, atau data sensitif pada foto secara instan.",
        icon: <EyeOff size={32} className="text-rose-500" />,
        href: "/tools/blur-face",
        color: "rose"
    },
    {
        title: "Gabungkan PDF",
        description: "Kombinasikan beberapa dokumen PDF menjadi satu file dalam satu klik.",
        icon: <FilesIcon size={32} className="text-purple-500" />,
        href: "/tools/merge-pdf",
        color: "purple"
    },
    {
        title: "Pisahkan PDF",
        description: "Ekstrak satu atau beberapa halaman spesifik dari dokumen PDF besar.",
        icon: <Scissors size={32} className="text-pink-500" />,
        href: "/tools/split-pdf",
        color: "pink"
    },
    {
        title: "Atur & Kelola Halaman PDF",
        description: "Urutkan ulang (drag & drop), hapus halaman, atau putar halaman dalam kisi visual.",
        icon: <FileStack size={32} className="text-indigo-400" />,
        href: "/tools/organize-pdf",
        color: "indigo"
    },
    {
        title: "Putar Halaman PDF",
        description: "Perbaiki orientasi halaman PDF yang miring atau terbalik dengan pratinjau visual instan.",
        icon: <RotateCw size={32} className="text-sky-400" />,
        href: "/tools/rotate-pdf",
        color: "sky"
    },
    {
        title: "Watermark PDF",
        description: "Beri cap pengaman teks diagonal (CASN, Bank, Rahasia) untuk melindungi berkas penting.",
        icon: <Stamp size={32} className="text-fuchsia-400" />,
        href: "/tools/watermark-pdf",
        color: "fuchsia"
    },
    {
        title: "Tanda Tangan PDF",
        description: "Bubuhi tanda tangan, paraf transparan, atau ketik nama langsung di atas dokumen PDF Anda.",
        icon: <PenTool size={32} className="text-pink-400" />,
        href: "/tools/sign-pdf",
        color: "pink"
    },
    {
        title: "Kunci & Proteksi PDF",
        description: "Kunci dokumen PDF dengan kata sandi rahasia dan enkripsi standar militer AES-256.",
        icon: <Lock size={32} className="text-amber-500" />,
        href: "/tools/protect-pdf",
        color: "amber"
    },
    {
        title: "Buka Kunci PDF",
        description: "Hapus proteksi kata sandi dari dokumen PDF Anda secara permanen dan 100% luring.",
        icon: <Unlock size={32} className="text-emerald-400" />,
        href: "/tools/unlock-pdf",
        color: "emerald"
    },
    {
        title: "Sensor Data PDF (Redact)",
        description: "Sensor NIK, gaji, nomor rekening, atau tanda tangan secara permanen dan bebas intip.",
        icon: <ShieldAlert size={32} className="text-red-500" />,
        href: "/tools/redact-pdf",
        color: "red"
    },
    {
        title: "Kompres PDF & Gambar",
        description: "Kurangi ukuran file dokumen atau foto Anda untuk menghemat ruang.",
        icon: <Minimize2 size={32} className="text-blue-500" />,
        href: "/tools/compress",
        color: "blue"
    },
    {
        title: "Kompres Berkas ke ZIP",
        description: "Padatkan dan bungkus banyak file apa saja menjadi arsip .ZIP terkompresi.",
        icon: <FolderArchive size={32} className="text-violet-400" />,
        href: "/tools/archive-zip",
        color: "violet"
    },
    {
        title: "Ekstrak & Intip ZIP",
        description: "Buka, intip isi berkas, dan ekstrak file arsip .ZIP langsung tanpa aplikasi luar.",
        icon: <FolderOpen size={32} className="text-fuchsia-400" />,
        href: "/tools/unzip",
        color: "fuchsia"
    },
    {
        title: "Scrub EXIF Jejak Digital",
        description: "Hapus metadata dan lokasi tersembunyi pada foto sebelum diunggah ke internet.",
        icon: <ShieldCheck size={32} className="text-lime-400" />,
        href: "/tools/scrub-exif",
        color: "lime"
    },
    {
        title: "Penampil Metadata",
        description: "Intip informasi EXIF rahasia (kamera, GPS, tanggal asli) di balik foto atau dokumen PDF Anda.",
        icon: <FileSearch size={32} className="text-cyan-400" />,
        href: "/tools/metadata-viewer",
        color: "cyan"
    },
    {
        title: "Gabungkan Word",
        description: "Kombinasikan beberapa dokumen Word (.docx) menjadi satu file utuh.",
        icon: <FileText size={32} className="text-blue-500" />,
        href: "/tools/merge-word",
        color: "blue"
    },
    {
        title: "PDF ke Word",
        description: "Ubah dokumen PDF menjadi file Word (.docx) yang dapat diedit dengan mudah.",
        icon: <FileText size={32} className="text-teal-400" />,
        href: "/tools/pdf-to-word",
        color: "teal"
    },
    {
        title: "Word ke PDF",
        description: "Konversi dokumen Word (.docx) menjadi format PDF yang universal dan aman.",
        icon: <FileType size={32} className="text-indigo-400" />,
        href: "/tools/word-to-pdf",
        color: "indigo"
    }
];

export default function HomeGrid() {
    const colorThemes: Record<
        string,
        {
            badge: string;
            borderHover: string;
            titleHover: string;
            iconBgHover: string;
        }
    > = {
        amber: {
            badge: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
            borderHover: "hover:border-amber-500/50",
            titleHover: "group-hover:text-amber-400",
            iconBgHover: "group-hover:bg-amber-500/20 group-hover:border-amber-500/40",
        },
        orange: {
            badge: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
            borderHover: "hover:border-orange-500/50",
            titleHover: "group-hover:text-orange-400",
            iconBgHover: "group-hover:bg-orange-500/20 group-hover:border-orange-500/40",
        },
        purple: {
            badge: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
            borderHover: "hover:border-purple-500/50",
            titleHover: "group-hover:text-purple-400",
            iconBgHover: "group-hover:bg-purple-500/20 group-hover:border-purple-500/40",
        },
        violet: {
            badge: "bg-violet-500/10 text-violet-400 border border-violet-500/20",
            borderHover: "hover:border-violet-500/50",
            titleHover: "group-hover:text-violet-400",
            iconBgHover: "group-hover:bg-violet-500/20 group-hover:border-violet-500/40",
        },
        fuchsia: {
            badge: "bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20",
            borderHover: "hover:border-fuchsia-500/50",
            titleHover: "group-hover:text-fuchsia-400",
            iconBgHover: "group-hover:bg-fuchsia-500/20 group-hover:border-fuchsia-500/40",
        },
        pink: {
            badge: "bg-pink-500/10 text-pink-400 border border-pink-500/20",
            borderHover: "hover:border-pink-500/50",
            titleHover: "group-hover:text-pink-400",
            iconBgHover: "group-hover:bg-pink-500/20 group-hover:border-pink-500/40",
        },
        rose: {
            badge: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
            borderHover: "hover:border-rose-500/50",
            titleHover: "group-hover:text-rose-400",
            iconBgHover: "group-hover:bg-rose-500/20 group-hover:border-rose-500/40",
        },
        red: {
            badge: "bg-red-500/10 text-red-400 border border-red-500/20",
            borderHover: "hover:border-red-500/50",
            titleHover: "group-hover:text-red-400",
            iconBgHover: "group-hover:bg-red-500/20 group-hover:border-red-500/40",
        },
        blue: {
            badge: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
            borderHover: "hover:border-blue-500/50",
            titleHover: "group-hover:text-blue-400",
            iconBgHover: "group-hover:bg-blue-500/20 group-hover:border-blue-500/40",
        },
        sky: {
            badge: "bg-sky-500/10 text-sky-400 border border-sky-500/20",
            borderHover: "hover:border-sky-500/50",
            titleHover: "group-hover:text-sky-400",
            iconBgHover: "group-hover:bg-sky-500/20 group-hover:border-sky-500/40",
        },
        cyan: {
            badge: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
            borderHover: "hover:border-cyan-500/50",
            titleHover: "group-hover:text-cyan-400",
            iconBgHover: "group-hover:bg-cyan-500/20 group-hover:border-cyan-500/40",
        },
        teal: {
            badge: "bg-teal-500/10 text-teal-400 border border-teal-500/20",
            borderHover: "hover:border-teal-500/50",
            titleHover: "group-hover:text-teal-400",
            iconBgHover: "group-hover:bg-teal-500/20 group-hover:border-teal-500/40",
        },
        emerald: {
            badge: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
            borderHover: "hover:border-emerald-500/50",
            titleHover: "group-hover:text-emerald-400",
            iconBgHover: "group-hover:bg-emerald-500/20 group-hover:border-emerald-500/40",
        },
        lime: {
            badge: "bg-lime-500/10 text-lime-400 border border-lime-500/20",
            borderHover: "hover:border-lime-500/50",
            titleHover: "group-hover:text-lime-400",
            iconBgHover: "group-hover:bg-lime-500/20 group-hover:border-lime-500/40",
        },
        indigo: {
            badge: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
            borderHover: "hover:border-indigo-500/50",
            titleHover: "group-hover:text-indigo-400",
            iconBgHover: "group-hover:bg-indigo-500/20 group-hover:border-indigo-500/40",
        },
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {TOOLS.map((tool) => {
                const theme = colorThemes[tool.color] || colorThemes.blue;
                return (
                    <Link
                        key={tool.href}
                        href={tool.href}
                        className="group block h-full"
                    >
                        <div className={`h-full glass-panel p-5 md:p-6 rounded-2xl flex flex-col gap-3 md:gap-4 transition-all duration-300 hover:scale-[1.02] hover:bg-surface/60 border-2 border-transparent ${theme.borderHover} cursor-pointer`}>
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className={`p-2.5 md:p-3 rounded-xl transition-all duration-300 group-hover:scale-105 ${theme.badge} ${theme.iconBgHover}`}>
                                    {tool.icon}
                                </div>
                                <h3 className={`text-lg md:text-xl font-bold tracking-tight ${theme.titleHover} transition-colors`}>
                                    {tool.title}
                                </h3>
                            </div>
                            <p className="text-foreground/70 text-sm leading-relaxed">
                                {tool.description}
                            </p>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
