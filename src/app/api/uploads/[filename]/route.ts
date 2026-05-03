import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

const MIME_TYPES: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
};

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ filename: string }> }
) {
    try {
        const { filename } = await params;

        // Sanitize filename to prevent path traversal
        const sanitized = path.basename(filename);
        const uploadDirPrimary = process.env.UPLOAD_DIR || path.join(process.cwd(), "public/uploads");
        const uploadDirFallback = path.join(process.cwd(), "upload");
        const candidatePaths = [
            path.join(uploadDirPrimary, sanitized),
            path.join(uploadDirFallback, sanitized),
            path.join(process.cwd(), "public/uploads", sanitized),
        ];
        const filePath = candidatePaths.find((candidate) => existsSync(candidate));

        if (!filePath) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        const buffer = await readFile(filePath);
        const ext = path.extname(sanitized).toLowerCase();
        const contentType = MIME_TYPES[ext] || "application/octet-stream";

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=31536000, immutable",
                "Access-Control-Allow-Origin": "*",
            },
        });
    } catch (error) {
        console.error("Serve upload error:", error);
        return NextResponse.json({ error: "Failed to serve file" }, { status: 500 });
    }
}
