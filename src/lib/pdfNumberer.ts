/**
 * DataScry - Bates Page Numbering Engine for PDF
 * 100% Offline via pdf-lib
 */

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export type NumberFormat =
    | "number"
    | "page_of_total"
    | "page_slash_total"
    | "hal_number"
    | "dash_number"
    | "roman_lower"
    | "roman_upper"
    | "custom";

export type NumberPosition =
    | "bottom_center"
    | "bottom_right"
    | "bottom_left"
    | "top_center"
    | "top_right"
    | "top_left";

export type NumberFont = "helvetica" | "times" | "courier";

export interface NumberOptions {
    format: NumberFormat;
    customTemplate?: string; // e.g. "Dokumen Hal. {n} dari {total}"
    position: NumberPosition;
    startPage: number; // 1-indexed, e.g. 2 to skip cover
    endPage?: number; // 1-indexed, undefined = until last page
    startNumber: number; // The display number for the first numbered page
    fontSize: number; // in pt, e.g. 11
    fontFamily: NumberFont;
    color: string; // Hex color, e.g. "#1f2937"
    margin: number; // margin in pt from edge, e.g. 30
}

export interface NumberResult {
    blob: Blob;
    pdfBytes: Uint8Array;
    totalPages: number;
    numberedPagesCount: number;
}

/**
 * Convert number to Roman numerals
 */
export function toRoman(num: number, lowercase = false): string {
    if (num <= 0 || num > 3999) return String(num);
    const lookup: [number, string][] = [
        [1000, "M"],
        [900, "CM"],
        [500, "D"],
        [400, "CD"],
        [100, "C"],
        [90, "XC"],
        [50, "L"],
        [40, "XL"],
        [10, "X"],
        [9, "IX"],
        [5, "V"],
        [4, "IV"],
        [1, "I"],
    ];

    let roman = "";
    let n = num;
    for (const [val, sym] of lookup) {
        while (n >= val) {
            roman += sym;
            n -= val;
        }
    }
    return lowercase ? roman.toLowerCase() : roman;
}

/**
 * Format page number string based on user configuration
 */
export function formatPageText(
    pageIndex: number, // 0-indexed page in document
    totalDocPages: number,
    options: NumberOptions,
    totalNumberedPages: number
): string {
    const pageNum = pageIndex + 1; // 1-indexed page
    const offset = pageNum - options.startPage;
    const currentNum = options.startNumber + offset;

    switch (options.format) {
        case "number":
            return String(currentNum);
        case "page_of_total":
            return `Halaman ${currentNum} dari ${totalNumberedPages}`;
        case "page_slash_total":
            return `${currentNum} / ${totalNumberedPages}`;
        case "hal_number":
            return `Hal. ${currentNum}`;
        case "dash_number":
            return `- ${currentNum} -`;
        case "roman_lower":
            return toRoman(currentNum, true);
        case "roman_upper":
            return toRoman(currentNum, false);
        case "custom": {
            const template = options.customTemplate || "{n}";
            return template
                .replace(/{n}/g, String(currentNum))
                .replace(/{total}/g, String(totalNumberedPages))
                .replace(/{doctotal}/g, String(totalDocPages));
        }
        default:
            return String(currentNum);
    }
}

/**
 * Parse hex color into RGB (0-1) for pdf-lib
 */
function hexToPdfRgb(hex: string) {
    let clean = hex.replace("#", "");
    if (clean.length === 3) {
        clean = clean
            .split("")
            .map((c) => c + c)
            .join("");
    }
    const r = parseInt(clean.substring(0, 2), 16) / 255;
    const g = parseInt(clean.substring(2, 4), 16) / 255;
    const b = parseInt(clean.substring(4, 6), 16) / 255;
    return rgb(isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b);
}

/**
 * Embed font according to user selection
 */
async function getFont(pdfDoc: PDFDocument, fontFamily: NumberFont) {
    switch (fontFamily) {
        case "times":
            return await pdfDoc.embedFont(StandardFonts.TimesRoman);
        case "courier":
            return await pdfDoc.embedFont(StandardFonts.Courier);
        case "helvetica":
        default:
            return await pdfDoc.embedFont(StandardFonts.Helvetica);
    }
}

/**
 * Applies automated page numbering to a PDF document using pdf-lib
 */
export async function applyPageNumbers(
    source: ArrayBuffer | Uint8Array,
    options: NumberOptions
): Promise<NumberResult> {
    const pdfDoc = await PDFDocument.load(source, { ignoreEncryption: true });
    const font = await getFont(pdfDoc, options.fontFamily);
    const textColor = hexToPdfRgb(options.color);
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    const start = Math.max(1, options.startPage);
    const end = options.endPage ? Math.min(totalPages, options.endPage) : totalPages;
    const totalNumberedPages = Math.max(1, end - start + 1);

    let numberedPagesCount = 0;

    for (let i = 0; i < totalPages; i++) {
        const pageNum = i + 1; // 1-indexed

        // Skip pages outside user-defined range
        if (pageNum < start || pageNum > end) {
            continue;
        }

        const page = pages[i];
        const { width, height } = page.getSize();
        const text = formatPageText(i, totalPages, options, totalNumberedPages);

        const textWidth = font.widthOfTextAtSize(text, options.fontSize);
        const textHeight = font.heightAtSize(options.fontSize);
        const margin = options.margin;

        let x = 0;
        let y = 0;

        switch (options.position) {
            case "bottom_center":
                x = (width - textWidth) / 2;
                y = margin;
                break;
            case "bottom_right":
                x = width - margin - textWidth;
                y = margin;
                break;
            case "bottom_left":
                x = margin;
                y = margin;
                break;
            case "top_center":
                x = (width - textWidth) / 2;
                y = height - margin - textHeight;
                break;
            case "top_right":
                x = width - margin - textWidth;
                y = height - margin - textHeight;
                break;
            case "top_left":
                x = margin;
                y = height - margin - textHeight;
                break;
            default:
                x = (width - textWidth) / 2;
                y = margin;
        }

        page.drawText(text, {
            x,
            y,
            size: options.fontSize,
            font,
            color: textColor,
        });

        numberedPagesCount++;
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });

    return {
        blob,
        pdfBytes,
        totalPages,
        numberedPagesCount,
    };
}
