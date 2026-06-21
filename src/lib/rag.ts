// RAG pipeline orchestrator
import { chunkText, Chunk } from "./chunker";
import { createEmbeddings, generateAnswer } from "./embeddings";
import { vectorStore, VectorDocument, SearchResult } from "./vectorstore";

export interface RAGResult {
  answer: string;
  sources: {
    source: string;
    content: string;
    score: number;
    chunkIndex: number;
  }[];
}

export async function ingestDocument(
  filename: string,
  content: string
): Promise<{ chunks: number }> {
  // Remove existing chunks for this file (re-upload support)
  vectorStore.removeBySource(filename);

  // Chunk the text
  const chunks: Chunk[] = chunkText(content, {
    chunkSize: 500,
    chunkOverlap: 50,
  });

  if (chunks.length === 0) {
    throw new Error("No content could be extracted from the document.");
  }

  // Create embeddings for all chunks
  const texts = chunks.map((c) => c.content);
  const embeddings = await createEmbeddings(texts);

  // Store in vector DB
  const vectorDocs: VectorDocument[] = chunks.map((chunk, i) => ({
    id: `${filename}_${chunk.index}`,
    content: chunk.content,
    embedding: embeddings[i],
    metadata: {
      source: filename,
      chunkIndex: chunk.index,
      totalChunks: chunks.length,
    },
  }));

  vectorStore.addMany(vectorDocs);

  return { chunks: chunks.length };
}

export async function queryDocuments(
  question: string,
  topK: number = 5
): Promise<RAGResult> {
  // Embed the question
  const [queryEmbedding] = await createEmbeddings([question]);

  // Search for relevant chunks
  const results: SearchResult[] = vectorStore.search(queryEmbedding, topK);

  if (results.length === 0) {
    return {
      answer:
        "No relevant documents found. Please upload documents first, then ask your question.",
      sources: [],
    };
  }

  // Build context from top results
  const contextParts = results.map(
    (r, i) =>
      `[Source: ${r.document.metadata.source}, Chunk ${r.document.metadata.chunkIndex + 1}]\n${r.document.content}`
  );
  const context = contextParts.join("\n\n---\n\n");

  // Get unique sources
  const uniqueSources = [
    ...new Set(results.map((r) => r.document.metadata.source as string)),
  ];

  // Generate answer
  const answer = await generateAnswer(question, context, uniqueSources);

  return {
    answer,
    sources: results.map((r) => ({
      source: r.document.metadata.source as string,
      content: r.document.content,
      score: Math.round(r.score * 100) / 100,
      chunkIndex: r.document.metadata.chunkIndex as number,
    })),
  };
}
