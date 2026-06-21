# AskDocs — AI-Powered RAG Document Q&A

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://typescriptlang.org)
[![Groq](https://img.shields.io/badge/LLM-Groq-orange)](https://groq.com)
[![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38bdf8)](https://tailwindcss.com)

Upload documents, ask questions, get grounded answers with source citations — powered by **Groq** (free-tier LLM) and local **TF-IDF** retrieval.

> **Live demo:** [askdocs-rose.vercel.app](https://askdocs-rose.vercel.app)

---

## ✨ Features

- **Document Upload** — PDF, TXT, Markdown, JSON with drag & drop
- **RAG Pipeline** — Chunk → TF-IDF Index → Sparse Vector Search → LLM Answer
- **Model Selector** — Choose from 5 Groq free-tier models (Llama 3.3 70B, Llama 3.1 8B, Gemma 2, etc.)
- **Source Citations** — Every answer shows which chunks it came from with relevance scores
- **Knowledge Base Management** — View, add, and delete indexed documents
- **Dark Modern UI** — Portfolio-ready responsive design
- **Zero External Embedding API** — Uses local TF-IDF sparse vectors (no OpenAI/Voyage needed)
- **Fast Inference** — Groq's LPU delivers sub-second response times

## 🧠 Architecture

```
User Question
    ↓
TF-IDF Sparse Vector (local, no API)
    ↓
Cosine Similarity Search (in-memory)
    ↓
Top-K Relevant Chunks
    ↓
Groq LLM (Llama 3.3 70B / Llama 3.1 / Gemma 2)
    ↓
Grounded Answer + Source Citations
```

### Available Models (Groq Free Tier)

| Model | Speed | Quality | Best For |
|-------|-------|---------|----------|
| **Llama 3.3 70B** | Fast | Best | Complex reasoning (default) |
| **Llama 3.1 8B** | Fastest | Good | Quick answers |
| **Gemma 2 9B** | Fast | Good | Google's alternative |
| **Llama 3 70B** | Fast | Good | Meta's flagship |
| **Llama 3 8B** | Fastest | Good | Lightweight tasks |

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/adryndian/askdocs.git
cd askdocs

# Install
npm install

# Set environment variables
cp .env.example .env.local
# Edit .env.local → add your GROQ_API_KEY

# Run
npm run dev
# Open http://localhost:3000
```

### Get a Free Groq API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up (free)
3. Create an API key
4. Paste into `.env.local` as `GROQ_API_KEY`

## ⚙️ Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | ✅ | Groq API key (free tier) |

## 🏗️ Tech Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **LLM:** Groq (Llama 3.3 70B, Llama 3.1 8B, Gemma 2 9B — all free tier)
- **Retrieval:** Local TF-IDF sparse vector search (no external embedding API)
- **UI:** Lucide icons, dark theme, glass cards, smooth animations

## 📁 Project Structure

```
askdocs/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main UI (chat + sidebar + model selector)
│   │   ├── layout.tsx            # Root layout + SEO
│   │   ├── globals.css           # Dark theme + animations
│   │   └── api/
│   │       ├── upload/route.ts   # Upload & ingest documents
│   │       ├── chat/route.ts     # RAG Q&A endpoint
│   │       └── documents/route.ts # List & delete documents
│   └── lib/
│       ├── rag.ts                # Pipeline orchestrator
│       ├── embeddings.ts         # Groq chat + TF-IDF embeddings
│       ├── chunker.ts            # Text chunking with overlap
│       └── vectorstore.ts        # Sparse vector store + cosine similarity
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── .env.local                    # GROQ_API_KEY (not committed)
```

## 🔄 Production Upgrades

For production, replace the in-memory store with:

- **pgvector** (PostgreSQL) — best for SQL-native setups
- **Pinecone** — managed, serverless vector DB
- **ChromaDB** — open-source, easy to self-host
- **Qdrant** — Rust-based, high performance

And replace TF-IDF with neural embeddings:
- **Voyage AI** — best retrieval quality, free tier available
- **Cohere Embed** — multilingual, free tier
- **sentence-transformers** — open-source, self-hosted

## 📄 License

MIT
