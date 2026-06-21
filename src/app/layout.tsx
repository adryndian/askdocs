import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AskDocs — AI-Powered Document Q&A",
  description:
    "Upload your documents and ask questions. Get accurate answers grounded in your data with source citations.",
  openGraph: {
    title: "AskDocs — AI-Powered Document Q&A",
    description:
      "RAG-powered knowledge base. Upload docs, ask questions, get cited answers.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--bg-primary)]">
        {children}
      </body>
    </html>
  );
}
