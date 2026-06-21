// In-memory vector store with TF-IDF cosine similarity search
// For production, replace with pgvector, Pinecone, or ChromaDB

import { SparseVector, cosineSimilarity } from "./embeddings";

export interface VectorDocument {
  id: string;
  content: string;
  embedding: SparseVector;
  metadata: {
    source: string;
    chunkIndex: number;
    totalChunks: number;
  };
}

export interface SearchResult {
  document: VectorDocument;
  score: number;
}

class VectorStore {
  private documents: VectorDocument[] = [];

  add(doc: VectorDocument): void {
    this.documents.push(doc);
  }

  addMany(docs: VectorDocument[]): void {
    this.documents.push(...docs);
  }

  search(queryEmbedding: SparseVector, topK: number = 5): SearchResult[] {
    if (this.documents.length === 0) return [];

    const scored = this.documents.map((doc) => ({
      document: doc,
      score: cosineSimilarity(queryEmbedding, doc.embedding),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  getBySource(source: string): VectorDocument[] {
    return this.documents.filter((d) => d.metadata.source === source);
  }

  removeBySource(source: string): number {
    const before = this.documents.length;
    this.documents = this.documents.filter(
      (d) => d.metadata.source !== source
    );
    return before - this.documents.length;
  }

  getSources(): string[] {
    const sources = new Set<string>();
    this.documents.forEach((d) => sources.add(d.metadata.source));
    return Array.from(sources);
  }

  getStats() {
    return {
      totalChunks: this.documents.length,
      sources: this.getSources(),
      sourceCount: this.getSources().length,
    };
  }

  clear(): void {
    this.documents = [];
  }
}

// Singleton instance for the server
const globalStore = globalThis as unknown as { __vectorStore?: VectorStore };
if (!globalStore.__vectorStore) {
  globalStore.__vectorStore = new VectorStore();
}

export const vectorStore = globalStore.__vectorStore;
export default VectorStore;
