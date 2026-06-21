"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload,
  Send,
  FileText,
  Trash2,
  Database,
  MessageSquare,
  Loader2,
  CheckCircle2,
  XCircle,
  Sparkles,
  BookOpen,
  Zap,
  ChevronDown,
  Cpu,
} from "lucide-react";

// Model options (Groq free tier)
const MODEL_OPTIONS = [
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", badge: "Best" },
  { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B", badge: "Fast" },
  { id: "gemma2-9b-it", name: "Gemma 2 9B", badge: "Google" },
  { id: "llama3-70b-8192", name: "Llama 3 70B", badge: "Meta" },
  { id: "llama3-8b-8192", name: "Llama 3 8B", badge: "Meta" },
];

// Types
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: {
    source: string;
    content: string;
    score: number;
    chunkIndex: number;
  }[];
  timestamp: Date;
}

interface DocInfo {
  content: string;
  uploadedAt: string;
  chunks: number;
}

interface DocStats {
  totalChunks: number;
  sources: string[];
  sourceCount: number;
  files: Record<string, DocInfo>;
}

// ========================
// Document Upload Component
// ========================
function DocumentUpload({
  onUploadComplete,
}: {
  onUploadComplete: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setUploading(true);
      setResult(null);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (data.success) {
          setResult({
            success: true,
            message: `"${data.filename}" ingested — ${data.chunks} chunks indexed`,
          });
          onUploadComplete();
        } else {
          setResult({ success: false, message: data.error });
        }
      } catch {
        setResult({ success: false, message: "Upload failed. Try again." });
      } finally {
        setUploading(false);
        setTimeout(() => setResult(null), 5000);
      }
    },
    [onUploadComplete]
  );

  return (
    <div className="space-y-3">
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer
          ${dragOver ? "border-accent bg-accent/5" : "border-[var(--border)] hover:border-[var(--text-secondary)]"}
          ${uploading ? "opacity-50 pointer-events-none" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".txt,.md,.pdf,.json"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
            <p className="text-sm text-[var(--text-secondary)]">
              Processing & embedding...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-[var(--text-secondary)]" />
            <p className="text-sm font-medium">Drop documents here</p>
            <p className="text-xs text-[var(--text-secondary)]">
              PDF, TXT, MD, JSON — up to 10MB
            </p>
          </div>
        )}
      </div>

      {result && (
        <div
          className={`flex items-center gap-2 text-sm p-3 rounded-lg animate-fade-in ${
            result.success
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {result.success ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 shrink-0" />
          )}
          {result.message}
        </div>
      )}
    </div>
  );
}

// ========================
// Knowledge Base Sidebar
// ========================
function KnowledgeBase({
  stats,
  onDelete,
  onRefresh,
}: {
  stats: DocStats | null;
  onDelete: (source: string) => void;
  onRefresh: () => void;
}) {
  if (!stats || stats.sourceCount === 0) {
    return (
      <div className="text-center py-8">
        <Database className="w-10 h-10 text-[var(--text-secondary)] mx-auto mb-3 opacity-40" />
        <p className="text-sm text-[var(--text-secondary)]">
          No documents indexed yet
        </p>
        <p className="text-xs text-[var(--text-secondary)] mt-1 opacity-60">
          Upload files to build your knowledge base
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {stats.sources.map((source) => (
        <div
          key={source}
          className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] transition-colors group"
        >
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-accent shrink-0" />
            <div className="min-w-0">
              <p className="text-sm truncate">{source}</p>
              <p className="text-xs text-[var(--text-secondary)]">
                {stats.files[source]?.chunks || "?"} chunks
              </p>
            </div>
          </div>
          <button
            onClick={() => onDelete(source)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-red-400 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      <div className="pt-3 border-t border-[var(--border)]">
        <div className="flex justify-between text-xs text-[var(--text-secondary)]">
          <span>
            {stats.sourceCount} source{stats.sourceCount > 1 ? "s" : ""}
          </span>
          <span>{stats.totalChunks} chunks total</span>
        </div>
      </div>
    </div>
  );
}

// ========================
// Chat Message Component
// ========================
function ChatMessage({ message }: { message: Message }) {
  const [showSources, setShowSources] = useState(false);

  return (
    <div
      className={`animate-slide-up ${message.role === "user" ? "flex justify-end" : ""}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          message.role === "user"
            ? "bg-accent text-white"
            : "bg-[var(--bg-card)] border border-[var(--border)]"
        }`}
      >
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>

        {message.sources && message.sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[var(--border)]">
            <button
              onClick={() => setShowSources(!showSources)}
              className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-light transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              {showSources ? "Hide" : "Show"}{" "}
              {message.sources.length} source
              {message.sources.length > 1 ? "s" : ""}
            </button>

            {showSources && (
              <div className="mt-2 space-y-2">
                {message.sources.map((s, i) => (
                  <div
                    key={i}
                    className="source-highlight text-xs animate-fade-in"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-accent">
                        {s.source}
                      </span>
                      <span className="text-[var(--text-secondary)]">
                        {Math.round(s.score * 100)}% match
                      </span>
                    </div>
                    <p className="line-clamp-3 opacity-80">
                      {s.content.substring(0, 200)}...
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-1 text-[10px] text-[var(--text-secondary)] opacity-50">
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}

// ========================
// Typing Indicator
// ========================
function TypingIndicator() {
  return (
    <div className="animate-slide-up">
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl px-4 py-3 inline-flex items-center gap-2">
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-accent typing-dot" />
          <div className="w-2 h-2 rounded-full bg-accent typing-dot" />
          <div className="w-2 h-2 rounded-full bg-accent typing-dot" />
        </div>
        <span className="text-xs text-[var(--text-secondary)]">
          Searching documents...
        </span>
      </div>
    </div>
  );
}

// ========================
// Empty State
// ========================
function EmptyState({ hasDocs }: { hasDocs: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 animate-pulse-glow">
        <Sparkles className="w-8 h-8 text-accent" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Ask anything about your docs</h2>
      <p className="text-[var(--text-secondary)] max-w-md mb-6">
        {hasDocs
          ? "Your knowledge base is ready. Ask a question and I'll find the most relevant information from your documents."
          : "Upload documents first, then ask questions. Answers are grounded in your data with source citations."}
      </p>
      {!hasDocs && (
        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] bg-[var(--bg-card)] px-4 py-2 rounded-lg border border-[var(--border)]">
          <Zap className="w-4 h-4 text-accent" />
          Start by uploading a PDF or text file
        </div>
      )}
    </div>
  );
}

// ========================
// Main Page
// ========================
export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [docStats, setDocStats] = useState<DocStats | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedModel, setSelectedModel] = useState(MODEL_OPTIONS[0].id);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      setDocStats(data);
    } catch {
      // silent
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMsg.content, model: selectedModel }),
      });
      const data = await res.json();

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer || data.error || "Something went wrong.",
        sources: data.sources,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Connection error. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  const handleDelete = async (source: string) => {
    try {
      await fetch(`/api/documents?source=${encodeURIComponent(source)}`, {
        method: "DELETE",
      });
      fetchStats();
    } catch {
      // silent
    }
  };

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const hasDocs = docStats ? docStats.sourceCount > 0 : false;

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-80" : "w-0"} transition-all duration-300 overflow-hidden border-r border-[var(--border)] bg-[var(--bg-secondary)] flex flex-col`}
      >
        <div className="p-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center">
              <Database className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="font-semibold text-sm">AskDocs</h1>
              <p className="text-xs text-[var(--text-secondary)]">
                RAG Knowledge Base
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <section>
            <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
              Upload Documents
            </h3>
            <DocumentUpload onUploadComplete={fetchStats} />
          </section>

          <section>
            <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
              Knowledge Base
            </h3>
            <KnowledgeBase
              stats={docStats}
              onDelete={handleDelete}
              onRefresh={fetchStats}
            />
          </section>
        </div>

        {/* Tech stack footer */}
        <div className="p-4 border-t border-[var(--border)]">
          <div className="flex flex-wrap gap-1.5">
            {["Next.js", "Groq", "RAG", "TF-IDF"].map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border)]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </aside>

      {/* Main chat area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-[var(--border)] flex items-center justify-between px-5 bg-[var(--bg-secondary)]/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
            >
              <Database className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">Chat</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Model Selector */}
            <div className="relative">
              <div className="flex items-center gap-1.5 text-xs bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-3 py-1.5 cursor-pointer hover:border-accent/50 transition-colors">
                <Cpu className="w-3.5 h-3.5 text-accent" />
                <span className="font-medium">
                  {MODEL_OPTIONS.find((m) => m.id === selectedModel)?.name}
                </span>
                <ChevronDown className="w-3 h-3 text-[var(--text-secondary)]" />
              </div>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              >
                {MODEL_OPTIONS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.badge})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            {hasDocs ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {docStats?.sourceCount} doc
                {(docStats?.sourceCount || 0) > 1 ? "s" : ""} indexed
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                No documents
              </>
            )}
          </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 ? (
            <EmptyState hasDocs={hasDocs} />
          ) : (
            messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
          )}
          {loading && <TypingIndicator />}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="p-5 border-t border-[var(--border)] bg-[var(--bg-secondary)]/30">
          <div className="flex gap-3 max-w-3xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={
                hasDocs
                  ? "Ask a question about your documents..."
                  : "Upload documents first, then ask questions..."
              }
              disabled={!hasDocs || loading}
              className="flex-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm
                placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30
                disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading || !hasDocs}
              className="px-4 py-3 bg-accent hover:bg-accent-dark rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-center text-[10px] text-[var(--text-secondary)] mt-2 opacity-50">
            Powered by RAG • Answers grounded in your documents • Groq
            LLM + TF-IDF Retrieval
          </p>
        </div>
      </main>
    </div>
  );
}
