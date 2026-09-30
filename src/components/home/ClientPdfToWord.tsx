"use client";

import { useState, useEffect, useRef } from "react";
import Dropzone from "@/components/ui/Dropzone";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.mjs";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, LevelFormat } from "docx";
import { 
    FileText, 
    RotateCcw, 
    CheckCircle2, 
    ZoomIn, 
    CheckSquare, 
    Square, 
    ArrowRight, 
    FolderOpen, 
    Download, 
    AlertCircle, 
    X,
    Eye,
    Loader2
} from "lucide-react";
import MediaLightboxModal, { LightboxItem } from "@/components/shared/MediaLightboxModal";

interface PageThumbnail {
    pageNumber: number;
    dataUrl: string;
    width: number;
    height: number;
    aspectRatio: string;
}

interface ExtractedChunk {
    str: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontName: string;
    isBold: boolean;
    isItalic: boolean;
}

interface ExtractedLine {
    y: number;
    x: number;
    width: number;
    height: number;
    items: ExtractedChunk[];
    text: string;
    isBold: boolean;
}

interface ExtractedBlock {
    lines: ExtractedLine[];
    isCentered: boolean;
    isBullet: boolean;
    isNumberedList: boolean;
    isHeading: boolean;
    isMetadata: boolean;
}

interface PageData {
    pageNumber: number;
    blocks: ExtractedBlock[];
}

export default function ClientPdfToWord() {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pages, setPages] = useState<PageThumbnail[]>([]);
    const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
    const [pageRange, setPageRange] = useState<string>("");
    
    // Status
    const [isLoadingPages, setIsLoadingPages] = useState<boolean>(false);
    const [loadingProgress, setLoadingProgress] = useState<string>("");
    const [isConverting, setIsConverting] = useState<boolean>(false);
    const [convertProgress, setConvertProgress] = useState<number>(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Result
    const [docxBlob, setDocxBlob] = useState<Blob | null>(null);
    const [convertedPageCount, setConvertedPageCount] = useState<number>(0);

    // Lightbox
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (typeof window !== "undefined" && pdfjsLib?.GlobalWorkerOptions) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        }
    }, []);

    const formatAspectRatio = (width: number, height: number): string => {
        const ratio = width / height;
        if (Math.abs(ratio - 16 / 9) < 0.08) return "16:9 Landscape";
        if (Math.abs(ratio - 9 / 16) < 0.08) return "9:16 Portrait";
        if (Math.abs(ratio - 1 / 1.414) < 0.08) return "A4 Portrait";
        if (Math.abs(ratio - 1.414 / 1) < 0.08) return "A4 Landscape";
        if (Math.abs(ratio - 4 / 3) < 0.08) return "4:3 Standard";
        return ratio >= 1 ? "Landscape" : "Portrait";
    };

    // Parse page range input (e.g., "1-3, 5")
    const parsePageRange = (rangeStr: string, totalPages: number): Set<number> => {
        const result = new Set<number>();
        if (!rangeStr.trim()) return result;

        const parts = rangeStr.split(",");
        for (const part of parts) {
            const trimmed = part.trim();
            if (trimmed.includes("-")) {
                const [startStr, endStr] = trimmed.split("-").map(s => s.trim());
                const start = parseInt(startStr, 10);
                const end = parseInt(endStr, 10);
                if (!isNaN(start) && !isNaN(end) && start <= end) {
                    for (let i = Math.max(1, start); i <= Math.min(totalPages, end); i++) {
                        result.add(i);
                    }
                }
            } else {
                const p = parseInt(trimmed, 10);
                if (!isNaN(p) && p >= 1 && p <= totalPages) {
                    result.add(p);
                }
            }
        }
        return result;
    };

    const formatSelectedPagesToRange = (selected: Set<number>, total: number): string => {
        if (selected.size === total && total > 0) return `1-${total}`;
        if (selected.size === 0) return "";

        const sorted = Array.from(selected).sort((a, b) => a - b);
        const ranges: string[] = [];
        let start = sorted[0];
        let prev = sorted[0];

        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i] === prev + 1) {
                prev = sorted[i];
            } else {
                ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
                start = sorted[i];
                prev = sorted[i];
            }
        }
        ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
        return ranges.join(", ");
    };

    const handleFiles = async (newFiles: File[]) => {
        const pdfFiles = newFiles.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
        if (pdfFiles.length === 0) {
            setErrorMessage("Silakan pilih dokumen berformat PDF yang valid.");
            return;
        }

        const targetFile = pdfFiles[0];
        setPdfFile(targetFile);
        setIsLoadingPages(true);
        setErrorMessage(null);
        setPages([]);
        setSelectedPages(new Set());
        setPageRange("");
        setDocxBlob(null);
        setLoadingProgress("Membuka dokumen PDF...");

        try {
            const arrayBuffer = await targetFile.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
            const pdf = await loadingTask.promise;
            const totalPages = pdf.numPages;

            const loadedThumbs: PageThumbnail[] = [];
            const defaultSelected = new Set<number>();

            for (let i = 1; i <= totalPages; i++) {
                setLoadingProgress(`Merender pratinjau halaman ${i} dari ${totalPages}...`);
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 0.65 });

                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");
                if (context) {
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    await page.render({ canvasContext: context, viewport, canvas }).promise;
                    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

                    loadedThumbs.push({
                        pageNumber: i,
                        dataUrl,
                        width: Math.round(viewport.width / 0.65),
                        height: Math.round(viewport.height / 0.65),
                        aspectRatio: formatAspectRatio(viewport.width, viewport.height)
                    });
                } else {
                    loadedThumbs.push({
                        pageNumber: i,
                        dataUrl: "",
                        width: 595,
                        height: 842,
                        aspectRatio: "A4 Portrait"
                    });
                }

                defaultSelected.add(i);
            }

            setPages(loadedThumbs);
            setSelectedPages(defaultSelected);
            setPageRange(totalPages > 1 ? `1-${totalPages}` : "1");
        } catch (err: any) {
            console.error("Gagal membaca PDF:", err);
            setErrorMessage("Gagal membaca dokumen PDF. Berkas mungkin rusak atau dilindungi kata sandi.");
        } finally {
            setIsLoadingPages(false);
            setLoadingProgress("");
        }
    };

    const handleTogglePage = (pageNum: number) => {
        setSelectedPages(prev => {
            const next = new Set(prev);
            if (next.has(pageNum)) {
                next.delete(pageNum);
            } else {
                next.add(pageNum);
            }
            setPageRange(formatSelectedPagesToRange(next, pages.length));
            return next;
        });
    };

    const handleSelectAll = () => {
        const all = new Set(pages.map(p => p.pageNumber));
        setSelectedPages(all);
        setPageRange(pages.length > 1 ? `1-${pages.length}` : "1");
    };

    const handleDeselectAll = () => {
        setSelectedPages(new Set());
        setPageRange("");
    };

    const handleRangeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setPageRange(val);
        const parsed = parsePageRange(val, pages.length);
        setSelectedPages(parsed);
    };

    const handleClearAll = () => {
        setPdfFile(null);
        setPages([]);
        setSelectedPages(new Set());
        setPageRange("");
        setDocxBlob(null);
        setErrorMessage(null);
        setConvertProgress(0);
        setIsConverting(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const convertToDocx = async (pagesData: PageData[]): Promise<Blob> => {
        const paragraphs: Paragraph[] = [];

        pagesData.forEach((pageData, pageIdx) => {
            let isFirstParagraphOfPage = true;

            pageData.blocks.forEach((block) => {
                let fullBlockText = "";
                for (let li = 0; li < block.lines.length; li++) {
                    const t = block.lines[li].text;
                    if (li === 0) fullBlockText = t;
                    else {
                        if (fullBlockText.endsWith("-")) fullBlockText += t;
                        else fullBlockText += " " + t;
                    }
                }
                fullBlockText = fullBlockText.trim();
                if (!fullBlockText) return;

                // Proper page break before first paragraph of subsequent pages
                const pageBreakBefore = (pageIdx > 0 && isFirstParagraphOfPage);
                isFirstParagraphOfPage = false;

                if (block.isBullet) {
                    // Clean leading bullet symbol
                    const cleanText = fullBlockText.replace(/^[•\-*]\s*/, "");
                    const children: TextRun[] = [];
                    const colonIdx = cleanText.indexOf(":");
                    if (colonIdx > 0 && colonIdx < 60) {
                        const label = cleanText.substring(0, colonIdx + 1);
                        const rest = cleanText.substring(colonIdx + 1);
                        children.push(new TextRun({ text: label, bold: true, size: 24, font: "Times New Roman", color: "000000" }));
                        children.push(new TextRun({ text: rest, bold: false, size: 24, font: "Times New Roman", color: "000000" }));
                    } else {
                        children.push(new TextRun({ text: cleanText, size: 24, font: "Times New Roman", color: "000000" }));
                    }

                    paragraphs.push(
                        new Paragraph({
                            children,
                            numbering: {
                                reference: "standard-bullet",
                                level: 0,
                            },
                            spacing: { after: 100, line: 276 },
                            pageBreakBefore,
                        })
                    );
                } else if (block.isNumberedList) {
                    // Numbered list items (e.g. 1. https://..., 2. https://...)
                    const match = fullBlockText.match(/^(\d+[\.\)]|[a-zA-Z][\.\)])\s+(.*)/);
                    const children: TextRun[] = [];
                    if (match) {
                        const prefix = match[1];
                        const content = match[2];
                        children.push(new TextRun({ text: prefix + " ", bold: false, size: 24, font: "Times New Roman", color: "000000" }));
                        if (content.startsWith("http://") || content.startsWith("https://")) {
                            children.push(new TextRun({ text: content, size: 24, font: "Times New Roman", color: "0563C1", underline: {} }));
                        } else {
                            children.push(new TextRun({ text: content, size: 24, font: "Times New Roman", color: "000000" }));
                        }
                    } else {
                        children.push(new TextRun({ text: fullBlockText, size: 24, font: "Times New Roman", color: "000000" }));
                    }

                    paragraphs.push(
                        new Paragraph({
                            children,
                            alignment: AlignmentType.LEFT,
                            indent: { left: 720, hanging: 360 },
                            spacing: { before: 40, after: 80, line: 276 },
                            pageBreakBefore,
                        })
                    );
                } else if (block.isCentered) {
                    // Centered titles / headers
                    block.lines.forEach((line, li) => {
                        paragraphs.push(
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: line.text,
                                        bold: true,
                                        color: "000000",
                                        size: line.height >= 14 ? 28 : 24,
                                        font: "Times New Roman",
                                    }),
                                ],
                                alignment: AlignmentType.CENTER,
                                spacing: { before: li === 0 ? 120 : 60, after: 60, line: 276 },
                                pageBreakBefore: (pageBreakBefore && li === 0),
                            })
                        );
                    });
                } else if (block.isMetadata) {
                    // Metadata lines (Nama :, NIM :, Prodi :, Soal :)
                    block.lines.forEach((line, li) => {
                        const colonIdx = line.text.indexOf(":");
                        const children: TextRun[] = [];
                        if (colonIdx > 0 && colonIdx < 20) {
                            const label = line.text.substring(0, colonIdx + 1);
                            const rest = line.text.substring(colonIdx + 1);
                            children.push(new TextRun({ text: label, bold: true, size: 24, font: "Times New Roman", color: "000000" }));
                            children.push(new TextRun({ text: rest, size: 24, font: "Times New Roman", color: "000000" }));
                        } else {
                            children.push(new TextRun({ text: line.text, size: 24, font: "Times New Roman", color: "000000" }));
                        }

                        paragraphs.push(
                            new Paragraph({
                                children,
                                alignment: AlignmentType.LEFT,
                                spacing: { before: 40, after: 40, line: 276 },
                                pageBreakBefore: (pageBreakBefore && li === 0),
                            })
                        );
                    });
                } else if (block.isHeading) {
                    // Section headings (e.g. 1. Pengertian Kernel, Daftar Referensi)
                    paragraphs.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: fullBlockText,
                                    bold: true,
                                    color: "000000",
                                    size: 24,
                                    font: "Times New Roman",
                                }),
                            ],
                            alignment: AlignmentType.LEFT,
                            spacing: { before: 240, after: 120, line: 276 },
                            pageBreakBefore,
                        })
                    );
                } else {
                    // Standard body paragraph
                    paragraphs.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: fullBlockText,
                                    size: 24,
                                    font: "Times New Roman",
                                    color: "000000",
                                }),
                            ],
                            alignment: AlignmentType.JUSTIFIED,
                            spacing: { after: 160, line: 276 },
                            pageBreakBefore,
                        })
                    );
                }
            });
        });

        const doc = new Document({
            numbering: {
                config: [
                    {
                        reference: "standard-bullet",
                        levels: [
                            {
                                level: 0,
                                format: LevelFormat.BULLET,
                                text: "\uF0B7",
                                alignment: AlignmentType.LEFT,
                                style: {
                                    paragraph: {
                                        indent: { left: 720, hanging: 360 },
                                    },
                                    run: {
                                        font: "Symbol",
                                        size: 20,
                                    },
                                },
                            },
                        ],
                    },
                ],
            },
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: 1440,
                            right: 1440,
                            bottom: 1440,
                            left: 1440,
                        },
                    },
                },
                children: paragraphs.length > 0 ? paragraphs : [new Paragraph({ text: "(Halaman tidak memuat teks)" })],
            }],
        });

        return await Packer.toBlob(doc);
    };

    const handleConvert = async () => {
        if (!pdfFile || selectedPages.size === 0) return;
        setIsConverting(true);
        setErrorMessage(null);
        setDocxBlob(null);
        setConvertProgress(0);

        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
            const targetPageNums = Array.from(selectedPages).sort((a, b) => a - b);
            const extractedPages: PageData[] = [];

            for (let idx = 0; idx < targetPageNums.length; idx++) {
                const pageNum = targetPageNums[idx];
                const page = await pdf.getPage(pageNum);
                const viewport = page.getViewport({ scale: 1.0 });
                const pageWidth = viewport.width;

                await page.getOperatorList();
                const textContent = await page.getTextContent();

                // 1. Collect chunks with font properties
                const chunks: ExtractedChunk[] = [];
                for (const item of textContent.items) {
                    if (!("str" in item) || !item.str) continue;

                    const fontObj = page.commonObjs.has(item.fontName) ? page.commonObjs.get(item.fontName) : null;
                    const fontFullName = (fontObj?.name || item.fontName || "").toLowerCase();
                    const isBold = fontFullName.includes("bold") || fontFullName.includes("heavy") || fontFullName.includes("black");
                    const isItalic = fontFullName.includes("italic") || fontFullName.includes("oblique");

                    chunks.push({
                        str: item.str,
                        x: item.transform[4],
                        y: item.transform[5],
                        width: item.width || 0,
                        height: item.height || Math.abs(item.transform[0]) || 12,
                        fontName: item.fontName,
                        isBold,
                        isItalic,
                    });
                }

                // 2. Group chunks into lines (vertical distance <= 4pt)
                chunks.sort((a, b) => b.y - a.y || a.x - b.x);
                const lines: ExtractedLine[] = [];

                for (const chunk of chunks) {
                    if (!chunk.str.trim()) continue;

                    let line = lines.find(l => Math.abs(l.y - chunk.y) <= 4);
                    if (!line) {
                        line = {
                            y: chunk.y,
                            x: chunk.x,
                            width: chunk.width,
                            height: chunk.height,
                            items: [chunk],
                            text: chunk.str,
                            isBold: chunk.isBold,
                        };
                        lines.push(line);
                    } else {
                        line.items.push(chunk);
                        line.items.sort((a, b) => a.x - b.x);
                        line.x = Math.min(line.x, chunk.x);
                        line.height = Math.max(line.height, chunk.height);
                        const first = line.items[0];
                        const last = line.items[line.items.length - 1];
                        line.width = (last.x + last.width) - first.x;
                    }
                }

                lines.sort((a, b) => b.y - a.y);

                // 3. Assemble full text per line with spacing
                for (const line of lines) {
                    let fullText = "";
                    for (let i = 0; i < line.items.length; i++) {
                        const cur = line.items[i];
                        if (i > 0) {
                            const prev = line.items[i - 1];
                            const gap = cur.x - (prev.x + prev.width);
                            if (gap > 1.5 && !fullText.endsWith(" ") && !cur.str.startsWith(" ")) {
                                fullText += " ";
                            }
                        }
                        fullText += cur.str;
                    }
                    line.text = fullText.trim();
                    line.isBold = line.items.filter(it => it.isBold).length >= Math.ceil(line.items.length / 2);
                }

                const validLines = lines.filter(l => l.text.length > 0);

                // 4. Group lines into semantic blocks
                const blocks: ExtractedBlock[] = [];
                let currentBlock: ExtractedBlock | null = null;

                for (let i = 0; i < validLines.length; i++) {
                    const curLine = validLines[i];
                    const prevLine = i > 0 ? validLines[i - 1] : null;

                    const leftMargin: number = curLine.x;
                    const rightMargin: number = pageWidth - (curLine.x + curLine.width);
                    const isBalanced: boolean = Math.abs(leftMargin - rightMargin) <= 35;

                    const isNumberedItem: boolean = /^\d+[\.\)]\s+/.test(curLine.text) || /^[a-zA-Z][\.\)]\s+/.test(curLine.text);
                    const isBulletMarker: boolean = curLine.text.startsWith("•") || curLine.text.startsWith("-") || curLine.text.startsWith("*");
                    const isMetadata: boolean = /^(Nama|NIM|Prodi|Soal|Dosen|Tanggal|Mata Kuliah)\s*:/i.test(curLine.text);

                    const isHeading: boolean = curLine.isBold && (isNumberedItem || curLine.text.length < 80);
                    const isNumberedList: boolean = !curLine.isBold && isNumberedItem;

                    // Centered title: balanced margins, top of page 1, not list/metadata/URL
                    const isCentered: boolean = isBalanced && leftMargin > 75 && !isNumberedItem && !isBulletMarker && !isMetadata && !curLine.text.startsWith("http") && (pageNum === 1 && curLine.y > 680);

                    const isBulletContinuation: boolean = Boolean(
                        currentBlock &&
                        currentBlock.isBullet &&
                        !isBulletMarker &&
                        !isNumberedItem &&
                        !isHeading &&
                        !isMetadata &&
                        curLine.x >= 95 &&
                        prevLine &&
                        (prevLine.y - curLine.y) <= 28
                    );

                    const isNumberedContinuation: boolean = Boolean(
                        currentBlock &&
                        currentBlock.isNumberedList &&
                        !isNumberedItem &&
                        !isBulletMarker &&
                        !isHeading &&
                        !isMetadata &&
                        curLine.x >= 95 &&
                        prevLine &&
                        (prevLine.y - curLine.y) <= 28
                    );

                    let startNewBlock: boolean = false;
                    if (!currentBlock) {
                        startNewBlock = true;
                    } else if (isBulletContinuation || isNumberedContinuation) {
                        startNewBlock = false;
                    } else if (isNumberedList || isBulletMarker || isHeading || isMetadata || isCentered) {
                        startNewBlock = true;
                    } else if (currentBlock.isNumberedList || currentBlock.isBullet || currentBlock.isHeading || currentBlock.isMetadata || currentBlock.isCentered) {
                        startNewBlock = true;
                    } else {
                        const vGap: number = prevLine ? (prevLine.y - curLine.y) : 0;
                        if (vGap > 24) startNewBlock = true;
                    }

                    if (startNewBlock || !currentBlock) {
                        currentBlock = {
                            lines: [curLine],
                            isCentered,
                            isBullet: isBulletMarker || isBulletContinuation,
                            isNumberedList: isNumberedList || isNumberedContinuation,
                            isHeading,
                            isMetadata,
                        };
                        blocks.push(currentBlock);
                    } else {
                        currentBlock.lines.push(curLine);
                    }
                }

                extractedPages.push({
                    pageNumber: pageNum,
                    blocks,
                });

                const pct = Math.round(((idx + 1) / targetPageNums.length) * 100);
                setConvertProgress(pct);
            }

            const docx = await convertToDocx(extractedPages);
            setDocxBlob(docx);
            setConvertedPageCount(targetPageNums.length);
        } catch (err: any) {
            console.error("Gagal konversi ke DOCX:", err);
            setErrorMessage("Terjadi kesalahan saat mengekstrak teks dari PDF. Silakan coba kembali.");
        } finally {
            setIsConverting(false);
            setConvertProgress(0);
        }
    };

    const handleDownloadDocx = () => {
        if (!docxBlob || !pdfFile) return;
        const url = URL.createObjectURL(docxBlob);
        const a = document.createElement("a");
        a.href = url;
        const baseName = pdfFile.name.replace(/\.[^/.]+$/, "");
        a.download = `${baseName}-converted.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Prepare Lightbox items
    const lightboxItems: LightboxItem[] = pages.map(p => ({
        title: `Halaman ${p.pageNumber}`,
        url: p.dataUrl,
        width: p.width,
        height: p.height,
        aspectRatio: p.aspectRatio
    }));

    return (
        <div className="space-y-8 w-full">
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                        handleFiles(Array.from(e.target.files));
                    }
                }}
            />

            {/* In-App Error Banner */}
            {errorMessage && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start justify-between gap-3 animate-fade-in">
                    <div className="flex items-center gap-2.5">
                        <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                        <span className="text-sm font-medium">{errorMessage}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setErrorMessage(null)}
                        className="text-rose-400 hover:text-rose-200 transition-colors p-1"
                        aria-label="Tutup pesan"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {!pdfFile ? (
                <div className="animate-fade-in">
                    <Dropzone
                        onFilesAccepted={handleFiles}
                        accept="application/pdf"
                        title="Tarik & Letakkan Dokumen PDF ke Sini"
                        description="Mendukung konversi PDF ke dokumen Word (.docx) yang dapat diedit secara instan dan 100% offline."
                        icons={
                            <div className="flex items-center gap-1.5 font-bold text-blue-400">
                                <FileText className="w-5 h-5" />
                                <span>Dokumen PDF (.pdf)</span>
                            </div>
                        }
                    />
                </div>
            ) : (
                <div className="space-y-6 animate-fade-in">
                    {/* Header Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-surface/60 border border-border/60 backdrop-blur-md shadow-sm">
                        <div className="flex items-center gap-3.5 min-w-0">
                            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-base sm:text-lg text-foreground truncate max-w-sm sm:max-w-md">
                                    {pdfFile.name}
                                </span>
                                <div className="flex items-center gap-2 text-xs text-foreground/60 mt-0.5">
                                    <span>{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</span>
                                    <span>•</span>
                                    <span className="text-blue-400 font-semibold">{pages.length} Halaman Terdeteksi</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                            <button
                                type="button"
                                onClick={handleClearAll}
                                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-foreground/80 hover:text-rose-400 bg-surface hover:bg-rose-500/10 border border-border/80 hover:border-rose-500/30 rounded-xl transition-all active:scale-95 cursor-pointer"
                                title="Hapus berkas dan reset pilihan"
                            >
                                <RotateCcw className="w-4 h-4" />
                                <span>Clear Semua</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                                title="Ganti dengan berkas PDF lain"
                            >
                                <FolderOpen className="w-4 h-4" />
                                <span>Ganti Berkas</span>
                            </button>
                        </div>
                    </div>

                    {/* Loading Pages Progress */}
                    {isLoadingPages && (
                        <div className="flex flex-col items-center justify-center p-12 glass-panel rounded-2xl border border-border/80 space-y-4">
                            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                            <p className="text-sm font-medium text-foreground/80 animate-pulse">{loadingProgress}</p>
                        </div>
                    )}

                    {/* Result Card if Already Converted */}
                    {docxBlob && !isConverting && (
                        <div className="p-8 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-6 max-w-2xl mx-auto shadow-2xl shadow-emerald-500/10 animate-fade-in">
                            <div className="w-16 h-16 mx-auto bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30">
                                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-emerald-400">Konversi ke Word Selesai!</h3>
                                <p className="text-foreground/80 text-sm max-w-md mx-auto">
                                    Sebanyak <strong className="text-foreground">{convertedPageCount} halaman</strong> dari dokumen PDF Anda berhasil diekstrak dan ditata rapi ke dalam format Word (.docx).
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={handleDownloadDocx}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all shadow-lg shadow-emerald-500/25 hover:scale-105 active:scale-95 cursor-pointer"
                                >
                                    <Download className="w-5 h-5" />
                                    <span>Unduh Dokumen Word ({(docxBlob.size / 1024).toFixed(1)} KB)</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDocxBlob(null)}
                                    className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-surface hover:bg-surface/80 text-foreground font-semibold border border-border transition-all hover:scale-105 active:scale-95 cursor-pointer text-sm"
                                >
                                    Pilih Halaman Lain
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Page Selection & Conversion Controls */}
                    {!isLoadingPages && pages.length > 0 && (
                        <div className="space-y-6">
                            {/* Controls Card */}
                            <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-border/80 shadow-md space-y-4">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-base text-foreground">
                                                Pilih Halaman yang Ingin Dikonversi
                                            </h3>
                                            <span className="text-xs bg-blue-500/10 text-blue-400 font-bold px-2.5 py-0.5 rounded-full border border-blue-500/20">
                                                {selectedPages.size} dari {pages.length} dipilih
                                            </span>
                                        </div>
                                        <p className="text-xs text-foreground/60">
                                            Centang halaman secara manual pada kartu atau ketik rentang halaman di bawah.
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleSelectAll}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs font-semibold text-foreground/80 hover:text-blue-400 hover:border-blue-500/40 transition-colors cursor-pointer"
                                        >
                                            <CheckSquare className="w-3.5 h-3.5" />
                                            <span>Pilih Semua</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleDeselectAll}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs font-semibold text-foreground/80 hover:text-rose-400 hover:border-rose-500/40 transition-colors cursor-pointer"
                                        >
                                            <Square className="w-3.5 h-3.5" />
                                            <span>Hapus Pilihan</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleConvert}
                                            disabled={isConverting || selectedPages.size === 0}
                                            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white transition-all shadow-md cursor-pointer ${
                                                isConverting || selectedPages.size === 0
                                                    ? "bg-blue-600/40 cursor-not-allowed text-white/60"
                                                    : "bg-blue-600 hover:bg-blue-500 hover:scale-105 active:scale-95 shadow-blue-500/25"
                                            }`}
                                        >
                                            {isConverting ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span>Mengekstrak {convertProgress}%...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>Konversi ke Word</span>
                                                    <ArrowRight className="w-4 h-4" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Range Input */}
                                <div className="pt-3 border-t border-border/40 flex flex-col sm:flex-row sm:items-center gap-3">
                                    <label htmlFor="range-input" className="text-xs font-bold uppercase tracking-wider text-foreground/70 shrink-0">
                                        Rentang Halaman:
                                    </label>
                                    <div className="flex-1 relative">
                                        <input
                                            id="range-input"
                                            type="text"
                                            value={pageRange}
                                            onChange={handleRangeInputChange}
                                            placeholder="Contoh: 1-3, 5, 8-10"
                                            className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border/80 text-foreground text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        />
                                    </div>
                                    <span className="text-[11px] text-foreground/50">
                                        Ketik angka halaman dipisah koma (contoh: 1-5, 7)
                                    </span>
                                </div>
                            </div>

                            {/* Visual Grid of Pages */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {pages.map((p, idx) => {
                                    const isSelected = selectedPages.has(p.pageNumber);
                                    return (
                                        <div
                                            key={p.pageNumber}
                                            onClick={() => handleTogglePage(p.pageNumber)}
                                            className={`relative group rounded-xl border transition-all cursor-pointer overflow-hidden flex flex-col ${
                                                isSelected
                                                    ? "bg-blue-500/10 border-blue-500 ring-2 ring-blue-500/20 shadow-md shadow-blue-500/10"
                                                    : "bg-surface/50 border-border/60 hover:border-border hover:bg-surface opacity-60 hover:opacity-100"
                                            }`}
                                        >
                                            {/* Top selection bar */}
                                            <div className="p-2 flex items-center justify-between bg-surface/70 border-b border-border/40 text-xs font-medium">
                                                <span className="font-bold text-foreground">
                                                    Hal {p.pageNumber}
                                                </span>
                                                <div
                                                    className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                                                        isSelected ? "bg-blue-600 text-white" : "border border-border/80"
                                                    }`}
                                                >
                                                    {isSelected && <CheckSquare className="w-3 h-3" />}
                                                </div>
                                            </div>

                                            {/* Thumbnail Container (rounded-none for sharp corners) */}
                                            <div className="relative aspect-3/4 bg-neutral-900/40 flex items-center justify-center overflow-hidden">
                                                {p.dataUrl ? (
                                                    <img
                                                        src={p.dataUrl}
                                                        alt={`Halaman ${p.pageNumber}`}
                                                        className="w-full h-full object-contain rounded-none select-none transition-transform group-hover:scale-102"
                                                    />
                                                ) : (
                                                    <FileText className="w-8 h-8 text-foreground/30" />
                                                )}

                                                {/* Hover Eye Overlay to open Lightbox */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setLightboxIndex(idx);
                                                    }}
                                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white cursor-pointer"
                                                    title="Pratinjau detail halaman (Zoom & Pan)"
                                                >
                                                    <div className="p-2 rounded-full bg-white/20 backdrop-blur-md">
                                                        <Eye className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-[10px] font-semibold tracking-wider uppercase">
                                                        Perbesar
                                                    </span>
                                                </button>
                                            </div>

                                            {/* Bottom metadata */}
                                            <div className="p-1.5 text-center text-[10px] text-foreground/50 border-t border-border/30 bg-surface/40">
                                                {p.aspectRatio}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Media Lightbox Modal with Zoom & Pan */}
            <MediaLightboxModal
                isOpen={lightboxIndex !== null}
                item={lightboxIndex !== null ? lightboxItems[lightboxIndex] : null}
                onClose={() => setLightboxIndex(null)}
                onNavigatePrev={() => lightboxIndex !== null && setLightboxIndex(Math.max(0, lightboxIndex - 1))}
                onNavigateNext={() => lightboxIndex !== null && setLightboxIndex(Math.min(lightboxItems.length - 1, lightboxIndex + 1))}
                hasPrev={lightboxIndex !== null && lightboxIndex > 0}
                hasNext={lightboxIndex !== null && lightboxIndex < lightboxItems.length - 1}
                accentColor="blue"
            />
        </div>
    );
}
