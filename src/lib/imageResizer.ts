/**
 * Client-Side Image Resizing Engine
 * 100% Local Browser-Based Processing (HTML5 Canvas 2D)
 * High-quality multi-step downsampling & upsampling with zero server upload
 */

export type ResizeMode = "percentage" | "dimensions" | "fit-max";

export interface ResizeOptions {
    mode: ResizeMode;
    percentage?: number; // e.g. 50 (50%)
    width?: number; // target width in px
    height?: number; // target height in px
    lockAspectRatio?: boolean;
    maxDimension?: number; // for fit-max mode
    outputFormat?: "original" | "image/jpeg" | "image/png" | "image/webp";
    outputQuality?: number; // 0.1 - 1.0 (for jpg/webp)
    backgroundColor?: string; // background color when converting transparent PNG to JPG
}

export interface ResizeResult {
    blob: Blob;
    url: string;
    width: number;
    height: number;
    originalWidth: number;
    originalHeight: number;
    durationMs: number;
}

/**
 * Calculate target width and height based on resize options
 */
export function calculateTargetDimensions(
    originalWidth: number,
    originalHeight: number,
    options: ResizeOptions
): { width: number; height: number } {
    const { mode } = options;

    if (mode === "percentage") {
        const pct = (options.percentage || 100) / 100;
        return {
            width: Math.max(1, Math.round(originalWidth * pct)),
            height: Math.max(1, Math.round(originalHeight * pct))
        };
    }

    if (mode === "fit-max") {
        const max = options.maxDimension || 1200;
        const ratio = Math.min(max / originalWidth, max / originalHeight, 1);
        return {
            width: Math.max(1, Math.round(originalWidth * ratio)),
            height: Math.max(1, Math.round(originalHeight * ratio))
        };
    }

    // mode === "dimensions"
    let targetWidth = options.width || originalWidth;
    let targetHeight = options.height || originalHeight;

    if (options.lockAspectRatio) {
        const aspect = originalWidth / originalHeight;
        if (options.width && !options.height) {
            targetHeight = Math.round(options.width / aspect);
        } else if (options.height && !options.width) {
            targetWidth = Math.round(options.height * aspect);
        }
    }

    return {
        width: Math.max(1, Math.round(targetWidth)),
        height: Math.max(1, Math.round(targetHeight))
    };
}

/**
 * Multi-step stepped downscaling for maximum quality without aliasing
 */
function steppedResize(
    sourceCanvas: HTMLCanvasElement,
    targetWidth: number,
    targetHeight: number
): HTMLCanvasElement {
    let currentWidth = sourceCanvas.width;
    let currentHeight = sourceCanvas.height;
    let currentCanvas = sourceCanvas;

    // If downscaling by more than 2x, step down in halves for smoother anti-aliasing
    while (currentWidth * 0.5 > targetWidth && currentHeight * 0.5 > targetHeight) {
        const nextWidth = Math.round(currentWidth * 0.5);
        const nextHeight = Math.round(currentHeight * 0.5);

        const stepCanvas = document.createElement("canvas");
        stepCanvas.width = nextWidth;
        stepCanvas.height = nextHeight;
        const stepCtx = stepCanvas.getContext("2d");
        if (!stepCtx) break;

        stepCtx.imageSmoothingEnabled = true;
        stepCtx.imageSmoothingQuality = "high";
        stepCtx.drawImage(currentCanvas, 0, 0, nextWidth, nextHeight);

        currentCanvas = stepCanvas;
        currentWidth = nextWidth;
        currentHeight = nextHeight;
    }

    // Final scaling step
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = targetWidth;
    finalCanvas.height = targetHeight;
    const finalCtx = finalCanvas.getContext("2d");
    if (finalCtx) {
        finalCtx.imageSmoothingEnabled = true;
        finalCtx.imageSmoothingQuality = "high";
        finalCtx.drawImage(currentCanvas, 0, 0, targetWidth, targetHeight);
    }

    return finalCanvas;
}

/**
 * Execute image resizing on HTMLImageElement
 */
export async function resizeImage(
    sourceImage: HTMLImageElement,
    originalMimeType: string,
    options: ResizeOptions
): Promise<ResizeResult> {
    const startTime = performance.now();

    const originalWidth = sourceImage.naturalWidth || sourceImage.width;
    const originalHeight = sourceImage.naturalHeight || sourceImage.height;

    const { width: targetWidth, height: targetHeight } = calculateTargetDimensions(
        originalWidth,
        originalHeight,
        options
    );

    // Initial canvas setup
    const initialCanvas = document.createElement("canvas");
    initialCanvas.width = originalWidth;
    initialCanvas.height = originalHeight;
    const initCtx = initialCanvas.getContext("2d");
    if (!initCtx) {
        throw new Error("Gagal menginisialisasi konteks Canvas 2D");
    }
    initCtx.drawImage(sourceImage, 0, 0, originalWidth, originalHeight);

    // Stepped resize
    const resizedCanvas = steppedResize(initialCanvas, targetWidth, targetHeight);

    // Determine target format
    let targetFormat: string = originalMimeType;
    if (options.outputFormat && options.outputFormat !== "original") {
        targetFormat = options.outputFormat;
    }

    // If exporting to JPEG and source has transparency, fill with background color
    if (targetFormat === "image/jpeg") {
        const flattenedCanvas = document.createElement("canvas");
        flattenedCanvas.width = targetWidth;
        flattenedCanvas.height = targetHeight;
        const flatCtx = flattenedCanvas.getContext("2d");
        if (flatCtx) {
            flatCtx.fillStyle = options.backgroundColor || "#FFFFFF";
            flatCtx.fillRect(0, 0, targetWidth, targetHeight);
            flatCtx.drawImage(resizedCanvas, 0, 0);
        }

        const quality = options.outputQuality !== undefined ? options.outputQuality : 0.92;
        const blob = await new Promise<Blob>((resolve, reject) => {
            flattenedCanvas.toBlob(
                (b) => {
                    if (b) resolve(b);
                    else reject(new Error("Gagal mengekspor kanvas ke JPEG"));
                },
                "image/jpeg",
                quality
            );
        });

        const url = URL.createObjectURL(blob);
        return {
            blob,
            url,
            width: targetWidth,
            height: targetHeight,
            originalWidth,
            originalHeight,
            durationMs: Math.round(performance.now() - startTime)
        };
    }

    // PNG or WebP
    const quality = options.outputQuality !== undefined ? options.outputQuality : 0.92;
    const blob = await new Promise<Blob>((resolve, reject) => {
        resizedCanvas.toBlob(
            (b) => {
                if (b) resolve(b);
                else reject(new Error("Gagal mengekspor kanvas ke format gambar"));
            },
            targetFormat,
            targetFormat === "image/png" ? undefined : quality
        );
    });

    const url = URL.createObjectURL(blob);
    return {
        blob,
        url,
        width: targetWidth,
        height: targetHeight,
        originalWidth,
        originalHeight,
        durationMs: Math.round(performance.now() - startTime)
    };
}
