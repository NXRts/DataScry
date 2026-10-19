/**
 * DataScry - Pure Client-side Image Rotation & Flip Engine
 * 100% Offline via HTML5 Canvas 2D Transformation Matrix
 */

export interface RotateOptions {
    rotation: number; // 0, 90, 180, 270 degrees
    flipHorizontal?: boolean;
    flipVertical?: boolean;
    format?: "original" | "image/jpeg" | "image/png" | "image/webp";
    quality?: number; // 10 - 100
    backgroundColor?: string; // Fallback for JPEG conversion with transparency
}

export interface RotateResult {
    blob: Blob;
    url: string;
    width: number;
    height: number;
    size: number;
    durationMs: number;
}

/**
 * Loads an image from a File, Blob, or URL into an HTMLImageElement
 */
export function loadImageElement(source: File | Blob | string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        let objectUrl: string | null = null;

        img.onload = () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            resolve(img);
        };

        img.onerror = (err) => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            reject(new Error("Gagal membaca berkas gambar."));
        };

        if (typeof source === "string") {
            img.src = source;
        } else {
            objectUrl = URL.createObjectURL(source);
            img.src = objectUrl;
        }
    });
}

/**
 * Normalize rotation degree to 0, 90, 180, 270
 */
export function normalizeRotation(deg: number): number {
    const mod = deg % 360;
    return mod < 0 ? mod + 360 : mod;
}

/**
 * Rotates and flips an image using HTML5 Canvas 2D Transformation Matrix
 */
export async function rotateImage(
    source: File | Blob | HTMLImageElement | string,
    options: RotateOptions
): Promise<RotateResult> {
    const startTime = performance.now();

    // 1. Ensure image is loaded
    const img: HTMLImageElement =
        source instanceof HTMLImageElement ? source : await loadImageElement(source);

    const normRotation = normalizeRotation(options.rotation);
    const flipH = !!options.flipHorizontal;
    const flipV = !!options.flipVertical;

    // 2. Determine target canvas dimensions
    const isSideways = normRotation === 90 || normRotation === 270;
    const targetWidth = isSideways ? img.naturalHeight : img.naturalWidth;
    const targetHeight = isSideways ? img.naturalWidth : img.naturalHeight;

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d", { willReadFrequently: false });
    if (!ctx) {
        throw new Error("Gagal menginisialisasi Canvas 2D rendering context.");
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // 3. Resolve output format
    let targetMime = "image/jpeg";
    if (options.format && options.format !== "original") {
        targetMime = options.format;
    } else if (source instanceof File) {
        targetMime = source.type || "image/jpeg";
    }

    // If JPEG, fill white background to prevent transparent alpha from becoming black
    if (targetMime === "image/jpeg") {
        ctx.fillStyle = options.backgroundColor || "#FFFFFF";
        ctx.fillRect(0, 0, targetWidth, targetHeight);
    }

    // 4. Apply Transformation Matrix
    ctx.save();
    // Translate origin to center of canvas
    ctx.translate(targetWidth / 2, targetHeight / 2);

    // Rotate
    ctx.rotate((normRotation * Math.PI) / 180);

    // Flip
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

    // Draw image centered
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();

    // 5. Convert to Blob
    const quality = options.quality !== undefined ? options.quality / 100 : 0.92;

    const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
            (b) => {
                if (b) resolve(b);
                else reject(new Error("Gagal mengonversi canvas ke berkas gambar."));
            },
            targetMime,
            quality
        );
    });

    const url = URL.createObjectURL(blob);
    const durationMs = Math.round(performance.now() - startTime);

    return {
        blob,
        url,
        width: targetWidth,
        height: targetHeight,
        size: blob.size,
        durationMs,
    };
}
