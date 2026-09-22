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
    RotateCw,
    Stamp
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
        icon: <FileImage size={32} className="text-amber-500" />,
        href: "/tools/pdf-to-jpg",
        color: "amber"
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
        icon: <Scissors size={32} className="text-rose-500" />,
        href: "/tools/split-pdf",
        color: "rose"
    },
    {
        title: "Putar Halaman PDF",
        description: "Perbaiki orientasi halaman PDF yang miring atau terbalik dengan pratinjau visual instan.",
        icon: <RotateCw size={32} className="text-rose-400" />,
        href: "/tools/rotate-pdf",
        color: "rose"
    },
    {
        title: "Watermark PDF",
        description: "Beri cap pengaman teks diagonal (CASN, Bank, Rahasia) untuk melindungi berkas penting.",
        icon: <Stamp size={32} className="text-rose-500" />,
        href: "/tools/watermark-pdf",
        color: "rose"
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
        icon: <FolderArchive size={32} className="text-purple-500" />,
        href: "/tools/archive-zip",
        color: "purple"
    },
    {
        title: "Scrub EXIF Jejak Digital",
        description: "Hapus metadata dan lokasi tersembunyi pada foto sebelum diunggah ke internet.",
        icon: <ShieldCheck size={32} className="text-emerald-500" />,
        href: "/tools/scrub-exif",
        color: "emerald"
    },
    {
        title: "Penampil Metadata",
        description: "Intip informasi EXIF rahasia (kamera, GPS, tanggal asli) di balik foto atau dokumen PDF Anda.",
        icon: <FileSearch size={32} className="text-blue-400" />,
        href: "/tools/metadata-viewer",
        color: "blue"
    },
    {
        title: "Gabungkan Word",
        description: "Kombinasikan beberapa dokumen Word (.docx) menjadi satu file utuh.",
        icon: <FileText size={32} className="text-cyan-500" />,
        href: "/tools/merge-word",
        color: "cyan"
    },
    {
        title: "PDF ke Word",
        description: "Ubah dokumen PDF menjadi file Word (.docx) yang dapat diedit dengan mudah.",
        icon: <FileText size={32} className="text-blue-500" />,
        href: "/tools/pdf-to-word",
        color: "blue"
    },
    {
        title: "Word ke PDF",
        description: "Konversi dokumen Word (.docx) menjadi format PDF yang universal dan aman.",
        icon: <FileType size={32} className="text-indigo-500" />,
        href: "/tools/word-to-pdf",
        color: "indigo"
    }
];

export default function HomeGrid() {
    const colorClasses: Record<string, string> = {
        amber: "bg-amber-500/10 text-amber-500",
        purple: "bg-purple-500/10 text-purple-500",
        rose: "bg-rose-500/10 text-rose-500",
        blue: "bg-blue-500/10 text-blue-500",
        emerald: "bg-emerald-500/10 text-emerald-500",
        indigo: "bg-indigo-500/10 text-indigo-500",
        cyan: "bg-cyan-500/10 text-cyan-500",
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {TOOLS.map((tool) => (
                <Link
                    key={tool.href}
                    href={tool.href}
                    className="group block h-full"
                >
                    <div className="h-full glass-panel p-5 md:p-6 rounded-2xl flex flex-col gap-3 md:gap-4 transition-all duration-300 hover:scale-[1.02] hover:bg-surface/60 border-2 border-transparent hover:border-primary/20 cursor-pointer">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className={`p-2.5 md:p-3 rounded-xl ${colorClasses[tool.color] || "bg-primary/10 text-primary"}`}>
                                {tool.icon}
                            </div>
                            <h3 className="text-lg md:text-xl font-bold tracking-tight group-hover:text-primary transition-colors">
                                {tool.title}
                            </h3>
                        </div>
                        <p className="text-foreground/70 text-sm leading-relaxed">
                            {tool.description}
                        </p>
                    </div>
                </Link>
            ))}
        </div>
    );
}
