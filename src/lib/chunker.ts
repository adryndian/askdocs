// Text chunking with overlap for RAG processing

export interface Chunk {
  content: string;
  index: number;
  metadata: Record<string, string | number>;
}

interface ChunkOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  separator?: string;
}

export function chunkText(
  text: string,
  options: ChunkOptions = {}
): Chunk[] {
  const {
    chunkSize = 500,
    chunkOverlap = 50,
    separator = "\n",
  } = options;

  // Split into sentences/paragraphs
  const sentences = text.split(/(?<=[.!?])\s+|\n\n+/).filter((s) => s.trim());

  const chunks: Chunk[] = [];
  let currentChunk: string[] = [];
  let currentLength = 0;
  let chunkIndex = 0;

  for (const sentence of sentences) {
    const sentenceLength = sentence.length;

    if (currentLength + sentenceLength > chunkSize && currentChunk.length > 0) {
      // Save current chunk
      chunks.push({
        content: currentChunk.join(" "),
        index: chunkIndex,
        metadata: {},
      });
      chunkIndex++;

      // Keep overlap
      const overlapSentences: string[] = [];
      let overlapLength = 0;
      for (let i = currentChunk.length - 1; i >= 0; i--) {
        if (overlapLength + currentChunk[i].length > chunkOverlap) break;
        overlapSentences.unshift(currentChunk[i]);
        overlapLength += currentChunk[i].length;
      }

      currentChunk = overlapSentences;
      currentLength = overlapLength;
    }

    currentChunk.push(sentence);
    currentLength += sentenceLength;
  }

  // Don't forget the last chunk
  if (currentChunk.length > 0) {
    chunks.push({
      content: currentChunk.join(" "),
      index: chunkIndex,
      metadata: {},
    });
  }

  return chunks;
}

export function estimateTokens(text: string): number {
  // Rough estimate: ~4 chars per token for English
  return Math.ceil(text.length / 4);
}
