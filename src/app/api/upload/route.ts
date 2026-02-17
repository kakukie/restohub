import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = Date.now() + "_" + file.name.replaceAll(" ", "_");

        // Ensure upload directory exists
        const uploadDir = path.join(process.cwd(), "public/uploads");

        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (mkdirError) {
            console.error("Failed to create upload directory:", mkdirError);
            return NextResponse.json({ error: "Failed to create upload directory" }, { status: 500 });
        }

        const filePath = path.join(uploadDir, filename);

        try {
            await writeFile(filePath, buffer);
            console.log(`File uploaded successfully: ${filePath}`);
        } catch (writeError) {
            console.error("Failed to write file:", writeError);
            return NextResponse.json({ error: "Failed to write file. Check directory permissions." }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            url: `/uploads/${filename}`
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
