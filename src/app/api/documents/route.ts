import { NextResponse } from "next/server";
import { vectorStore } from "@/lib/vectorstore";

const fileStore = globalThis as unknown as {
  __files?: Map<string, { content: string; uploadedAt: string; chunks: number }>;
};

export async function GET() {
  const stats = vectorStore.getStats();
  const files: Record<string, { content: string; uploadedAt: string; chunks: number }> = {};

  if (fileStore.__files) {
    fileStore.__files.forEach((value, key) => {
      files[key] = value;
    });
  }

  return NextResponse.json({
    totalChunks: stats.totalChunks,
    sources: stats.sources,
    sourceCount: stats.sourceCount,
    files,
  });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const source = searchParams.get("source");

  if (!source) {
    return NextResponse.json(
      { error: "Source parameter required" },
      { status: 400 }
    );
  }

  const removed = vectorStore.removeBySource(source);
  fileStore.__files?.delete(source);

  return NextResponse.json({
    success: true,
    removed,
    source,
  });
}
