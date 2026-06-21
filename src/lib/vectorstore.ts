// In-memory vector store with cosine similarity search
// For production, replace with pgvector, Pinecone, or ChromaDB

export interface VectorDocument {
  id: string;
  content: string;
  embedding: number[];
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

  search(queryEmbedding: number[], topK: number = 5): SearchResult[] {
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
    return [...new Set(this.documents.map((d) => d.metadata.source))];
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

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}

// Singleton instance for the server
const globalStore = globalThis as unknown as { __vectorStore?: VectorStore };
if (!globalStore.__vectorStore) {
  globalStore.__vectorStore = new VectorStore();
}

export const vectorStore = globalStore.__vectorStore;
export default VectorStore;
