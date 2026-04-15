import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getAuthenticatedUser } from '@/lib/api-auth'

// Allowed file types
const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp']
const ALLOWED_MIMES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(req: NextRequest) {
    try {
        // Auth: Must be logged in to upload
        const user = await getAuthenticatedUser(req)
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: "File too large. Maximum 5MB allowed." }, { status: 400 });
        }

        // Validate file type by MIME
        if (!ALLOWED_MIMES.includes(file.type)) {
            return NextResponse.json({ error: "Invalid file type. Only PNG, JPG, GIF, WEBP allowed." }, { status: 400 });
        }

        // Validate file extension
        const originalExt = path.extname(file.name).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(originalExt)) {
            return NextResponse.json({ error: "Invalid file extension." }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        
        // Sanitize filename: only allow alphanumeric, hyphens, underscores
        const baseName = file.name
            .replace(/\.[^/.]+$/, '') // remove extension
            .replace(/[^a-zA-Z0-9_-]/g, '_') // sanitize
            .slice(0, 50) // limit length
        const filename = `${Date.now()}_${baseName}${originalExt}`;

        // Ensure upload directory exists
        const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "public/uploads");

        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (mkdirError) {
            console.error("Failed to create upload directory:", mkdirError);
            return NextResponse.json({ error: "Failed to create upload directory" }, { status: 500 });
        }

        const filePath = path.join(uploadDir, filename);

        // Prevent path traversal (extra safety)
        if (!filePath.startsWith(uploadDir)) {
            return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
        }

        try {
            await writeFile(filePath, buffer);
            console.log(`File uploaded successfully: ${filePath}`);
        } catch (writeError) {
            console.error("Failed to write file:", writeError);
            return NextResponse.json({ error: "Failed to write file. Check directory permissions." }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            url: `/api/uploads/${filename}`
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
