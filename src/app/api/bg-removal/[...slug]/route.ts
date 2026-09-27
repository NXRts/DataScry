import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CACHE_DIR = path.join(process.cwd(), "node_modules", ".cache", "bg-removal");

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ slug: string[] }> }
) {
    const { slug } = await context.params;
    if (!slug || slug.length === 0) {
        return new NextResponse("Not Found", { status: 404 });
    }

    const filename = slug.join("/");
    // Basic path traversal prevention
    const safeFilename = path.normalize(filename).replace(/^(\.\.[\/\\])+/, "");
    const localFilePath = path.join(CACHE_DIR, safeFilename);

    let fileBuffer: Buffer | null = null;
    let contentType = "application/octet-stream";

    if (safeFilename.endsWith(".json")) {
        contentType = "application/json";
    } else if (safeFilename.endsWith(".wasm")) {
        contentType = "application/wasm";
    } else if (safeFilename.endsWith(".mjs")) {
        contentType = "application/javascript";
    }

    if (fs.existsSync(localFilePath)) {
        try {
            fileBuffer = fs.readFileSync(localFilePath);
        } catch (err) {
            console.error("Gagal membaca berkas cache lokal:", err);
        }
    }

    // Fallback: If not cached yet on server, fetch on-demand and cache it
    if (!fileBuffer) {
        try {
            const upstreamUrl = `https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/${safeFilename}`;
            const upstreamRes = await fetch(upstreamUrl);
            if (!upstreamRes.ok) {
                return new NextResponse(`Resource not found upstream: ${safeFilename}`, { status: 404 });
            }
            const arrayBuf = await upstreamRes.arrayBuffer();
            fileBuffer = Buffer.from(arrayBuf);

            // Save to server cache dir so next time it is instantaneous
            try {
                if (!fs.existsSync(CACHE_DIR)) {
                    fs.mkdirSync(CACHE_DIR, { recursive: true });
                }
                fs.writeFileSync(localFilePath, fileBuffer);
            } catch (writeErr) {
                console.warn("Gagal menyimpan ke cache server:", writeErr);
            }
        } catch (fetchErr) {
            console.error("Gagal mengunduh dari upstream:", fetchErr);
            return new NextResponse("Network Error fetching resource", { status: 502 });
        }
    }

    return new NextResponse(new Uint8Array(fileBuffer), {
        status: 200,
        headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=31536000, immutable",
            "Access-Control-Allow-Origin": "*",
            "Cross-Origin-Resource-Policy": "cross-origin",
        },
    });
}
