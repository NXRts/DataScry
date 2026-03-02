import { PDFDocument } from 'pdf-lib';

export type PdfWorkerMessage =
    | { type: 'compress'; id: string; file: File }

export type PdfWorkerResponse =
    | { type: 'progress'; id: string; progress: number }
    | { type: 'success'; id: string; result: Blob; metadata?: any }
    | { type: 'error'; id: string; error: string };

self.onmessage = async (e: MessageEvent<PdfWorkerMessage>) => {
    const { type, id, file } = e.data;

    try {
        if (type === 'compress') {
            self.postMessage({ type: 'progress', id, progress: 10 });

            const arrayBuffer = await file.arrayBuffer();
            self.postMessage({ type: 'progress', id, progress: 30 });

            // In pdf-lib, true compression requires complex stream manipulation.
            // A common simple optimisation is to load and just resave, stripping some implicit unneeded metadata.
            // Another approach is to explicitly iterate objects, but pdf-lib provides limited automatic compression out-of-the-box.
            const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            self.postMessage({ type: 'progress', id, progress: 60 });

            // Basic optimization: resave metadata stripped and with useObjectStreams
            pdfDoc.setTitle('');
            pdfDoc.setAuthor('');
            pdfDoc.setSubject('');
            pdfDoc.setKeywords([]);
            pdfDoc.setProducer('');
            pdfDoc.setCreator('');

            self.postMessage({ type: 'progress', id, progress: 80 });

            const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
            self.postMessage({ type: 'progress', id, progress: 95 });

            const optimizedBlob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });

            self.postMessage({
                type: 'success',
                id,
                result: optimizedBlob,
                metadata: { originalSize: file.size, newSize: optimizedBlob.size }
            });
        }
    } catch (error: any) {
        self.postMessage({ type: 'error', id, error: error.message || "Unknown error parsing PDF" });
    }
};
