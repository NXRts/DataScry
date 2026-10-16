/**
 * Client-Side Image Super-Resolution & Enhancement Engine
 * 100% Local Browser-Based Processing (HTML5 Canvas 2D + Pixel Convolution)
 * Zero server uploads - Maximum Privacy
 */

export type UpscaleMode = "photo" | "anime" | "document" | "vintage";

export interface UpscaleOptions {
    scale: number; // e.g. 2, 4, or custom (1.5 - 8)
    mode: UpscaleMode;
    sharpness: number; // 0 - 100
    denoise: number; // 0 - 100
    clarity: number; // 0 - 100
    targetWidth?: number;
    targetHeight?: number;
    onProgress?: (progress: number, stage: string) => void;
}

export interface UpscaleResult {
    blob: Blob;
    url: string;
    width: number;
    height: number;
    durationMs: number;
}

/**
 * Helper to load an image element from an Object URL or data URL
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(new Error("Gagal memuat gambar: " + err));
        img.src = src;
    });
}

/**
 * Progressive multi-step scaling to avoid aliasing artifacts
 */
function progressiveScale(
    sourceCanvas: HTMLCanvasElement,
    targetWidth: number,
    targetHeight: number
): HTMLCanvasElement {
    let currentWidth = sourceCanvas.width;
    let currentHeight = sourceCanvas.height;
    let currentCanvas = sourceCanvas;

    // If downscaling (not typical here), step by half
    // If upscaling, step by 2x progressively until near target
    while (currentWidth * 2 < targetWidth && currentHeight * 2 < targetHeight) {
        const nextWidth = Math.round(currentWidth * 2);
        const nextHeight = Math.round(currentHeight * 2);

        const stepCanvas = document.createElement("canvas");
        stepCanvas.width = nextWidth;
        stepCanvas.height = nextHeight;
        const stepCtx = stepCanvas.getContext("2d", { willReadFrequently: true });
        if (!stepCtx) break;

        stepCtx.imageSmoothingEnabled = true;
        stepCtx.imageSmoothingQuality = "high";
        stepCtx.drawImage(currentCanvas, 0, 0, nextWidth, nextHeight);

        currentCanvas = stepCanvas;
        currentWidth = nextWidth;
        currentHeight = nextHeight;
    }

    // Final step to exact target resolution
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = targetWidth;
    finalCanvas.height = targetHeight;
    const finalCtx = finalCanvas.getContext("2d", { willReadFrequently: true });
    if (finalCtx) {
        finalCtx.imageSmoothingEnabled = true;
        finalCtx.imageSmoothingQuality = "high";
        finalCtx.drawImage(currentCanvas, 0, 0, targetWidth, targetHeight);
    }

    return finalCanvas;
}

/**
 * Applies Edge-Preserving Denoising & JPEG Artifact Removal
 */
function applyDenoise(imageData: ImageData, strength: number): void {
    if (strength <= 0) return;
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // Normalizing strength factor: 0 - 100 -> 0.0 - 0.7
    const factor = (strength / 100) * 0.7;
    const original = new Uint8ClampedArray(data);

    // Fast 3x3 bilateral / selective neighborhood averaging
    // Only smooth pixels whose intensity difference is below edge threshold
    const edgeThreshold = 35 * (1 - factor * 0.4);

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = (y * width + x) * 4;
            const centerR = original[idx];
            const centerG = original[idx + 1];
            const centerB = original[idx + 2];

            let sumR = centerR;
            let sumG = centerG;
            let sumB = centerB;
            let weightSum = 1;

            // Check 4 direct orthogonal neighbors
            const neighbors = [
                (y * width + (x - 1)) * 4,
                (y * width + (x + 1)) * 4,
                ((y - 1) * width + x) * 4,
                ((y + 1) * width + x) * 4
            ];

            for (let i = 0; i < 4; i++) {
                const nIdx = neighbors[i];
                const nR = original[nIdx];
                const nG = original[nIdx + 1];
                const nB = original[nIdx + 2];

                const diff = Math.abs(centerR - nR) + Math.abs(centerG - nG) + Math.abs(centerB - nB);
                if (diff < edgeThreshold * 3) {
                    const weight = 1 - diff / (edgeThreshold * 3);
                    sumR += nR * weight;
                    sumG += nG * weight;
                    sumB += nB * weight;
                    weightSum += weight;
                }
            }

            const blend = factor;
            data[idx] = Math.round(centerR * (1 - blend) + (sumR / weightSum) * blend);
            data[idx + 1] = Math.round(centerG * (1 - blend) + (sumG / weightSum) * blend);
            data[idx + 2] = Math.round(centerB * (1 - blend) + (sumB / weightSum) * blend);
        }
    }
}

/**
 * Adaptive Unsharp Masking & Edge Contrast Sharpening
 */
function applySharpen(imageData: ImageData, strength: number, mode: UpscaleMode): void {
    if (strength <= 0) return;
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // Normalizing strength factor: 0 - 100 -> 0.0 - 1.5
    let amount = (strength / 100) * 1.4;
    if (mode === "document") amount *= 1.3;
    if (mode === "anime") amount *= 1.2;

    const original = new Uint8ClampedArray(data);

    // Unsharp mask kernel approximation
    // Center: 1 + 4*a, Neighbors: -a
    const a = amount * 0.25;
    const centerWeight = 1 + 4 * a;

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = (y * width + x) * 4;

            const topIdx = ((y - 1) * width + x) * 4;
            const bottomIdx = ((y + 1) * width + x) * 4;
            const leftIdx = (y * width + (x - 1)) * 4;
            const rightIdx = (y * width + (x + 1)) * 4;

            for (let c = 0; c < 3; c++) {
                const val =
                    original[idx + c] * centerWeight -
                    (original[topIdx + c] +
                        original[bottomIdx + c] +
                        original[leftIdx + c] +
                        original[rightIdx + c]) *
                        a;

                // Thresholding to prevent harsh halo clipping
                data[idx + c] = Math.min(255, Math.max(0, Math.round(val)));
            }
        }
    }
}

/**
 * Micro-Contrast & Clarity enhancement for depth and texture
 */
function applyClarity(imageData: ImageData, strength: number, mode: UpscaleMode): void {
    if (strength <= 0) return;
    const data = imageData.data;
    const factor = (strength / 100) * 0.5;

    // Midtone contrast curve adjustment (S-curve)
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Perceived luminance
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        // Document mode: enhance dark text against bright paper
        if (mode === "document") {
            if (lum < 140) {
                const boost = (140 - lum) / 140 * factor * 0.6;
                data[i] = Math.max(0, Math.round(r * (1 - boost)));
                data[i + 1] = Math.max(0, Math.round(g * (1 - boost)));
                data[i + 2] = Math.max(0, Math.round(b * (1 - boost)));
            } else {
                const boost = (lum - 140) / 115 * factor * 0.4;
                data[i] = Math.min(255, Math.round(r + (255 - r) * boost));
                data[i + 1] = Math.min(255, Math.round(g + (255 - g) * boost));
                data[i + 2] = Math.min(255, Math.round(b + (255 - b) * boost));
            }
            continue;
        }

        // Standard S-curve contrast on midtones (128 center)
        const shift = Math.sin(((lum - 128) / 128) * (Math.PI / 2)) * 32 * factor;

        data[i] = Math.min(255, Math.max(0, Math.round(r + shift)));
        data[i + 1] = Math.min(255, Math.max(0, Math.round(g + shift)));
        data[i + 2] = Math.min(255, Math.max(0, Math.round(b + shift)));
    }
}

/**
 * Main Upscale Execution Pipeline
 */
export async function upscaleImage(
    source: HTMLImageElement | HTMLCanvasElement,
    options: UpscaleOptions,
    outputFormat: "image/png" | "image/jpeg" | "image/webp" = "image/png",
    outputQuality: number = 0.95
): Promise<UpscaleResult> {
    const startTime = performance.now();
    const { onProgress } = options;

    onProgress?.(10, "Mempersiapkan gambar...");

    // Determine initial & target dimensions
    const srcWidth = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
    const srcHeight = source instanceof HTMLImageElement ? source.naturalHeight : source.height;

    const targetWidth = options.targetWidth || Math.round(srcWidth * options.scale);
    const targetHeight = options.targetHeight || Math.round(srcHeight * options.scale);

    // Initial canvas setup
    const initialCanvas = document.createElement("canvas");
    initialCanvas.width = srcWidth;
    initialCanvas.height = srcHeight;
    const initCtx = initialCanvas.getContext("2d", { willReadFrequently: true });
    if (!initCtx) {
        throw new Error("Gagal menginisialisasi konteks Canvas 2D");
    }
    initCtx.drawImage(source, 0, 0, srcWidth, srcHeight);

    // Allow UI thread to breathe
    await new Promise((r) => setTimeout(r, 10));
    onProgress?.(30, `Interpolasi resolusi tinggi (${targetWidth}×${targetHeight})...`);

    // Progressive High-Resolution Resampling
    const upscaledCanvas = progressiveScale(initialCanvas, targetWidth, targetHeight);
    const ctx = upscaledCanvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
        throw new Error("Gagal menginisialisasi konteks Canvas Upscaled");
    }

    await new Promise((r) => setTimeout(r, 15));
    onProgress?.(55, "Menganalisis piksel & pembersihan noise...");

    // Get pixel buffer for custom super-resolution convolution
    const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);

    // Pass 1: Adaptive Denoise / De-JPEG artifact suppression
    if (options.denoise > 0) {
        applyDenoise(imgData, options.denoise);
    }

    await new Promise((r) => setTimeout(r, 15));
    onProgress?.(75, "Penajaman tepian AI & pemulihan tekstur...");

    // Pass 2: Edge-Preserving Sharpening
    if (options.sharpness > 0) {
        applySharpen(imgData, options.sharpness, options.mode);
    }

    // Pass 3: Clarity / Contrast boost
    if (options.clarity > 0) {
        applyClarity(imgData, options.clarity, options.mode);
    }

    // Write back processed pixels
    ctx.putImageData(imgData, 0, 0);

    await new Promise((r) => setTimeout(r, 15));
    onProgress?.(90, "Mengompresi & menyiapkan berkas hasil...");

    // Export to Blob
    const blob = await new Promise<Blob>((resolve, reject) => {
        upscaledCanvas.toBlob(
            (b) => {
                if (b) resolve(b);
                else reject(new Error("Gagal mengekspor kanvas ke format gambar"));
            },
            outputFormat,
            outputQuality
        );
    });

    const url = URL.createObjectURL(blob);
    const durationMs = Math.round(performance.now() - startTime);

    onProgress?.(100, "Selesai!");

    return {
        blob,
        url,
        width: targetWidth,
        height: targetHeight,
        durationMs
    };
}
