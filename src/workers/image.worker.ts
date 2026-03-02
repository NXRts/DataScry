import imageCompression from 'browser-image-compression';
import ExifReader from 'exifreader';

export type ImageWorkerMessage =
    | { type: 'compress'; id: string; file: File }
    | { type: 'scrub'; id: string; file: File };

export type ImageWorkerResponse =
    | { type: 'progress'; id: string; progress: number }
    | { type: 'success'; id: string; result: Blob; metadata?: any }
    | { type: 'error'; id: string; error: string };

self.onmessage = async (e: MessageEvent<ImageWorkerMessage>) => {
    const { type, id, file } = e.data;

    try {
        if (type === 'compress') {
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: false, // We are already in a worker
                onProgress: (p: number) => {
                    self.postMessage({ type: 'progress', id, progress: p });
                }
            };

            const compressedFile = await imageCompression(file, options);
            self.postMessage({
                type: 'success',
                id,
                result: compressedFile,
                metadata: { originalSize: file.size, newSize: compressedFile.size }
            });
        } else if (type === 'scrub') {
            self.postMessage({ type: 'progress', id, progress: 10 });

            // Load tags to verify they exist
            const tags = await ExifReader.load(file);
            self.postMessage({ type: 'progress', id, progress: 30 });

            // The most reliable way to strip EXIF in browser is drawing to an offscreen canvas
            // But workers only have OffscreenCanvas
            const bitmap = await self.createImageBitmap(file);
            self.postMessage({ type: 'progress', id, progress: 50 });

            const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Could not get 2d context");

            ctx.drawImage(bitmap, 0, 0);
            self.postMessage({ type: 'progress', id, progress: 80 });

            const scrubbedBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.95 });
            self.postMessage({
                type: 'success',
                id,
                result: scrubbedBlob,
                metadata: { scrubbed: true, tagsRemoved: Object.keys(tags).length }
            });
        }
    } catch (error: any) {
        self.postMessage({ type: 'error', id, error: error.message || "Unknown error" });
    }
};
