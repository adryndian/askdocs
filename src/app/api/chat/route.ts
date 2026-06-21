import { NextRequest, NextResponse } from "next/server";
import { queryDocuments } from "@/lib/rag";
import { AVAILABLE_MODELS, DEFAULT_MODEL } from "@/lib/embeddings";

export async function POST(req: NextRequest) {
  try {
    const { question, model } = await req.json();

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    if (question.trim().length < 3) {
      return NextResponse.json(
        { error: "Question is too short" },
        { status: 400 }
      );
    }

    // Validate model
    const selectedModel =
      model && AVAILABLE_MODELS.some((m) => m.id === model)
        ? model
        : DEFAULT_MODEL;

    const result = await queryDocuments(question.trim(), 5, selectedModel);

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Chat error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Chat failed: ${message}` },
      { status: 500 }
    );
  }
}
