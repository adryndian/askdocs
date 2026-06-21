import { NextRequest, NextResponse } from "next/server";
import { ingestDocument } from "@/lib/rag";

// Simple in-memory file store for demo
const fileStore = globalThis as unknown as {
  __files?: Map<string, { content: string; uploadedAt: string; chunks: number }>;
};
if (!fileStore.__files) {
  fileStore.__files = new Map();
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "text/plain",
      "text/markdown",
      "application/pdf",
      "application/json",
    ];
    const allowedExtensions = [".txt", ".md", ".pdf", ".json"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();

    if (
      !allowedTypes.includes(file.type) &&
      !allowedExtensions.includes(ext)
    ) {
      return NextResponse.json(
        {
          error: `Unsupported file type. Allowed: ${allowedExtensions.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Read file content
    let content: string;

    if (ext === ".pdf") {
      try {
        const pdfParse = require("pdf-parse");
        const buffer = Buffer.from(await file.arrayBuffer());
        const data = await pdfParse(buffer);
        content = data.text;
      } catch {
        return NextResponse.json(
          { error: "Failed to parse PDF. The file may be corrupted." },
          { status: 400 }
        );
      }
    } else {
      content = await file.text();
    }

    if (!content || content.trim().length < 50) {
      return NextResponse.json(
        { error: "Document content is too short (minimum 50 characters)." },
        { status: 400 }
      );
    }

    // Process and ingest
    const { chunks } = await ingestDocument(file.name, content);

    // Store file info
    fileStore.__files!.set(file.name, {
      content: content.substring(0, 200) + "...",
      uploadedAt: new Date().toISOString(),
      chunks,
    });

    return NextResponse.json({
      success: true,
      filename: file.name,
      chunks,
      contentLength: content.length,
    });
  } catch (error: unknown) {
    console.error("Upload error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Upload failed: ${message}` },
      { status: 500 }
    );
  }
}
