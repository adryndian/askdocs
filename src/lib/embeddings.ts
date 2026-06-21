// OpenAI embeddings wrapper
import OpenAI from "openai";

let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }
    _openai = new OpenAI({ apiKey });
  }
  return _openai;
}

const EMBEDDING_MODEL = "text-embedding-3-small";
const CHAT_MODEL = "gpt-4o-mini";

export async function createEmbedding(text: string): Promise<number[]> {
  const response = await getOpenAI().embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.trim(),
  });
  return response.data[0].embedding;
}

export async function createEmbeddings(
  texts: string[]
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const response = await getOpenAI().embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts.map((t) => t.trim()),
  });

  return response.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

export async function generateAnswer(
  question: string,
  context: string,
  sources: string[]
): Promise<string> {
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

  const response = await getOpenAI().chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 1000,
  });

  return response.choices[0]?.message?.content || "No response generated.";
}
