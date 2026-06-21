// AI Provider: Groq (free tier, OpenAI-compatible API)
// Embeddings: Local TF-IDF (no external API needed)

// ============================================================
// GROQ MODEL OPTIONS (Free Tier)
// ============================================================
export interface ModelOption {
  id: string;
  name: string;
  description: string;
  contextLength: number;
}

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B",
    description: "Best quality, multilingual",
    contextLength: 128000,
  },
  {
    id: "llama-3.1-8b-instant",
    name: "Llama 3.1 8B",
    description: "Fastest, lightweight",
    contextLength: 128000,
  },
  {
    id: "gemma2-9b-it",
    name: "Gemma 2 9B",
    description: "Google, instruction-tuned",
    contextLength: 8192,
  },
  {
    id: "llama3-8b-8192",
    name: "Llama 3 8B",
    description: "Meta, general purpose",
    contextLength: 8192,
  },
  {
    id: "llama3-70b-8192",
    name: "Llama 3 70B",
    description: "Meta, high quality",
    contextLength: 8192,
  },
];

export const DEFAULT_MODEL = "llama-3.3-70b-versatile";

// ============================================================
// GROQ CLIENT (lazy init, OpenAI-compatible)
// ============================================================
let _client: ReturnType<typeof createClient> | null = null;

function createClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY environment variable is required");
  }
  return {
    apiKey,
    baseUrl: "https://api.groq.com/openai/v1",
  };
}

function getClient() {
  if (!_client) {
    _client = createClient();
  }
  return _client;
}

// ============================================================
// CHAT COMPLETION (Groq API)
// ============================================================
export async function generateAnswer(
  question: string,
  context: string,
  sources: string[],
  model: string = DEFAULT_MODEL
): Promise<string> {
  const client = getClient();

  const systemPrompt = `You are AskDocs, an AI assistant that answers questions based on provided document context. 

Rules:
- ONLY answer based on the provided context. If the answer isn't in the context, say "I couldn't find that information in the uploaded documents."
- Be concise but thorough.
- Reference specific parts of the documents when relevant.
- Use markdown formatting for clarity.
- If multiple documents contain relevant info, synthesize them.

Available sources: ${sources.join(", ")}`;

  const userPrompt = `Context from documents:
---
${context}
---

Question: ${question}

Provide a detailed answer grounded in the context above.`;

  const response = await fetch(`${client.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${client.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  return (
    data.choices?.[0]?.message?.content || "No response generated."
  );
}

// ============================================================
// LOCAL TF-IDF EMBEDDINGS (no external API)
// ============================================================

// Simple tokenizer: lowercase, split on non-alphanumeric, filter stopwords
const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "can", "shall", "to", "of", "in", "for",
  "on", "with", "at", "by", "from", "as", "into", "through", "during",
  "before", "after", "above", "below", "between", "out", "off", "over",
  "under", "again", "further", "then", "once", "here", "there", "when",
  "where", "why", "how", "all", "each", "every", "both", "few", "more",
  "most", "other", "some", "such", "no", "nor", "not", "only", "own",
  "same", "so", "than", "too", "very", "just", "because", "but", "and",
  "or", "if", "while", "about", "this", "that", "these", "those", "it",
  "its", "i", "me", "my", "we", "our", "you", "your", "he", "him", "his",
  "she", "her", "they", "them", "their", "what", "which", "who", "whom",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

// TF-IDF embedding as a sparse vector (Map of term -> score)
export interface SparseVector {
  terms: Map<string, number>;
  magnitude: number;
}

// Global IDF cache (built from all documents)
let globalDocFreq = new Map<string, number>();
let totalDocs = 0;

export function resetEmbeddingCache(): void {
  globalDocFreq = new Map<string, number>();
  totalDocs = 0;
}

export function updateIDF(texts: string[]): void {
  totalDocs += texts.length;
  for (const text of texts) {
    const uniqueTerms = new Set(tokenize(text));
    for (const term of uniqueTerms) {
      globalDocFreq.set(term, (globalDocFreq.get(term) || 0) + 1);
    }
  }
}

export function createEmbedding(text: string): SparseVector {
  const tokens = tokenize(text);
  const termFreq = new Map<string, number>();

  // Term frequency
  for (const token of tokens) {
    termFreq.set(token, (termFreq.get(token) || 0) + 1);
  }

  // TF-IDF
  const tfidf = new Map<string, number>();
  for (const [term, freq] of termFreq) {
    const tf = freq / Math.max(tokens.length, 1);
    const df = globalDocFreq.get(term) || 1;
    const idf = Math.log(Math.max(totalDocs, 1) / df) + 1;
    tfidf.set(term, tf * idf);
  }

  // Magnitude
  let mag = 0;
  for (const score of tfidf.values()) {
    mag += score * score;
  }
  mag = Math.sqrt(mag);

  return { terms: tfidf, magnitude: mag };
}

export function createEmbeddings(texts: string[]): SparseVector[] {
  if (texts.length === 0) return [];
  updateIDF(texts);
  return texts.map((text) => createEmbedding(text));
}

// Cosine similarity between two sparse vectors
export function cosineSimilarity(a: SparseVector, b: SparseVector): number {
  if (a.magnitude === 0 || b.magnitude === 0) return 0;

  let dotProduct = 0;
  // Iterate over the smaller map
  const [small, large] =
    a.terms.size < b.terms.size ? [a, b] : [b, a];

  for (const [term, score] of small.terms) {
    const otherScore = large.terms.get(term);
    if (otherScore !== undefined) {
      dotProduct += score * otherScore;
    }
  }

  return dotProduct / (a.magnitude * b.magnitude);
}
