# AskDocs — AI-Powered Document Q&A

> Upload your documents. Ask questions. Get answers grounded in your data with source citations.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-green)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8)

## 🎯 What This Demonstrates

A production-ready **RAG (Retrieval-Augmented Generation)** pipeline that:

1. **Ingests** documents (PDF, TXT, MD, JSON) — chunks text intelligently with overlap
2. **Embeds** chunks into vectors using OpenAI's `text-embedding-3-small`
3. **Stores** vectors in an in-memory store (swap for pgvector/Pinecone in production)
4. **Retrieves** relevant chunks via cosine similarity search
5. **Generates** grounded answers with GPT-4o-mini + source citations

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│   Upload     │────▶│  Chunker     │────▶│  Embeddings    │
│  (PDF/TXT)   │     │  (500 chars  │     │  (OpenAI       │
│              │     │   + overlap) │     │   ada-3-small) │
└─────────────┘     └──────────────┘     └───────┬────────┘
                                                  │
                                                  ▼
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│   Answer     │◀────│  LLM         │◀────│  Vector Store  │
│  + Sources   │     │  (GPT-4o-m)  │     │  (Cosine Sim)  │
└─────────────┘     └──────────────┘     └────────────────┘
```

## 🚀 Quick Start

```bash
# Install
npm install

# Set your API key
cp .env.example .env.local
# Edit .env.local with your OPENAI_API_KEY

# Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
askdocs/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── upload/route.ts    # Document upload & ingestion
│   │   │   ├── chat/route.ts      # RAG-powered Q&A
│   │   │   └── documents/route.ts # List & delete documents
│   │   ├── layout.tsx             # Root layout + metadata
│   │   ├── page.tsx               # Main UI (sidebar + chat)
│   │   └── globals.css            # Dark theme + animations
│   ├── lib/
│   │   ├── rag.ts                 # RAG pipeline orchestrator
│   │   ├── embeddings.ts          # OpenAI embeddings + chat
│   │   ├── chunker.ts             # Text chunking with overlap
│   │   └── vectorstore.ts         # In-memory vector DB
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS |
| Backend | Next.js API Routes (Node.js) |
| AI | OpenAI GPT-4o-mini, text-embedding-3-small |
| Vector DB | In-memory (production: pgvector / Pinecone) |
| Language | TypeScript (strict mode) |
| Deploy | Vercel / Cloudflare Pages |

## 🔑 Key Technical Decisions

- **Anti-hallucination by design**: LLM only answers from provided context
- **Chunk overlap**: 50-char overlap prevents information loss at boundaries
- **Cosine similarity**: Most reliable metric for embedding comparison
- **Source citations**: Every answer links back to the exact document chunks
- **Singleton vector store**: Survives across API calls in the same process

## 📈 Production Upgrades

For real-world deployment, swap:
- In-memory store → **pgvector** (Supabase) or **Pinecone**
- `pdf-parse` → **Unstructured.io** for better PDF extraction
- Add **auth** (NextAuth / Clerk)
- Add **rate limiting** (Upstash Redis)
- Add **streaming** responses (Vercel AI SDK)

## 📄 License

MIT — use freely for portfolio or commercial projects.
