import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files allowed" }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split(".").pop() || "jpg";
    const filename = `avatar-${user.id}-${timestamp}.${extension}`;

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Save file
    const filePath = path.join(uploadDir, filename);
    const bytes = await file.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(bytes));

    // Return URL
    const url = `/uploads/${filename}`;

    return NextResponse.json({ url });
  } catch (e: any) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: e?.message || "Upload failed" }, { status: 500 });
  }
}
