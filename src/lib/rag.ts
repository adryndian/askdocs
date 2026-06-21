// RAG pipeline orchestrator
import { chunkText, Chunk } from "./chunker";
import {
  createEmbeddings,
  generateAnswer,
  resetEmbeddingCache,
  DEFAULT_MODEL,
} from "./embeddings";
import { vectorStore, VectorDocument, SearchResult } from "./vectorstore";

export interface RAGResult {
  answer: string;
  model: string;
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

  // Reset and rebuild TF-IDF index
  resetEmbeddingCache();

  // Create TF-IDF embeddings for all chunks
  const texts = chunks.map((c) => c.content);
  const embeddings = createEmbeddings(texts);

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
  topK: number = 5,
  model: string = DEFAULT_MODEL
): Promise<RAGResult> {
  // Embed the question using TF-IDF
  const [queryEmbedding] = createEmbeddings([question]);

  // Search for relevant chunks
  const results: SearchResult[] = vectorStore.search(queryEmbedding, topK);

  if (results.length === 0) {
    return {
      answer:
        "No relevant documents found. Please upload documents first, then ask your question.",
      model,
      sources: [],
    };
  }

  // Build context from top results
  const contextParts = results.map(
    (r) =>
      `[Source: ${r.document.metadata.source}, Chunk ${r.document.metadata.chunkIndex + 1}]\n${r.document.content}`
  );
  const context = contextParts.join("\n\n---\n\n");

  // Get unique sources
  const sourceSet: string[] = [];
  results.forEach((r) => {
    const src = r.document.metadata.source;
    if (!sourceSet.includes(src)) {
      sourceSet.push(src);
    }
  });

  // Generate answer using Groq
  const answer = await generateAnswer(question, context, sourceSet, model);

  return {
    answer,
    model,
    sources: results.map((r) => ({
      source: r.document.metadata.source,
      content: r.document.content,
      score: Math.round(r.score * 100) / 100,
      chunkIndex: r.document.metadata.chunkIndex,
    })),
  };
}
