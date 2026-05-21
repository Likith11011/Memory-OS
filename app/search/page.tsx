"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { searchMemories } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import MemoryCard from "@/components/MemoryCard";

interface Memory {
  id: number; title: string; content: string;
  file_type: string; tags: string;
  similarity: number | null; created_at: string;
  memory_category?: string; language?: string;
}

const EXAMPLE_QUERIES = [
  "What do I know about AI?",
  "Show my project notes",
  "Find startup ideas",
  "Recent lecture notes",
];

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Memory[]>([]);
  const [searchType, setSearchType] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/login");
  }, []);

  const handleSearch = async (q?: string) => {
    const searchQuery = q || query;
    if (!searchQuery.trim()) return;
    if (q) setQuery(q);
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchMemories(searchQuery);
      setResults(data.results || []);
      setSearchType(data.search_type || "");
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const searchTypeBadge: Record<string, { label: string; color: string }> = {
    semantic: { label: "✦ Semantic", color: "#2563EB" },
    keyword: { label: "# Keyword", color: "#f59e0b" },
    hybrid: { label: "⚡ Hybrid", color: "#10b981" },
  };

  const badge = searchTypeBadge[searchType] || null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "linear-gradient(135deg, #0A1224 0%, #0d1530 100%)", fontFamily: "'Inter', sans-serif" }}>
      <Sidebar />
      <main style={{ marginLeft: "240px", flex: 1, padding: "32px" }}>

        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: 700, color: "#F8FAFC", marginBottom: "4px", letterSpacing: "-0.02em" }}>
            Semantic Search
          </h2>
          <p style={{ color: "#475569", fontSize: "14px" }}>
            Search by meaning — AI understands context, not just keywords
          </p>
        </div>

        {/* Search bar */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <span style={{
              position: "absolute", left: "16px", top: "50%",
              transform: "translateY(-50%)", color: "#334155", fontSize: "16px",
            }}>⌕</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="What do you want to remember?"
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "14px", padding: "14px 20px 14px 44px",
                color: "#F8FAFC", fontSize: "15px", outline: "none",
                boxSizing: "border-box", transition: "all 0.2s",
              }}
              onFocus={e => { e.target.style.borderColor = "rgba(37,99,235,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)"; }}
              onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
            />
          </div>
          <button
            onClick={() => handleSearch()} disabled={loading}
            style={{
              background: loading ? "rgba(37,99,235,0.4)" : "linear-gradient(135deg, #2563EB, #1d4ed8)",
              border: "none", borderRadius: "14px",
              padding: "14px 28px", color: "white",
              fontSize: "15px", fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
              boxShadow: !loading ? "0 0 20px rgba(37,99,235,0.4)" : "none",
              transition: "all 0.2s",
            }}
          >
            {loading ? "Searching..." : "Search →"}
          </button>
        </div>

        {/* Example queries */}
        {!searched && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "40px" }}>
            {EXAMPLE_QUERIES.map((q) => (
              <button key={q} onClick={() => handleSearch(q)} style={{
                background: "rgba(37,99,235,0.08)",
                border: "1px solid rgba(37,99,235,0.2)",
                borderRadius: "999px", color: "#60A5FA",
                padding: "6px 14px", fontSize: "12px", cursor: "pointer",
                transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(37,99,235,0.15)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(37,99,235,0.08)"; }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Result meta */}
        {searched && !loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            {badge && (
              <span style={{
                background: `${badge.color}15`,
                border: `1px solid ${badge.color}44`,
                color: badge.color,
                padding: "4px 12px", borderRadius: "999px",
                fontSize: "12px", fontWeight: 600,
              }}>
                {badge.label}
              </span>
            )}
            <span style={{ color: "#475569", fontSize: "13px" }}>
              {results.length} result{results.length !== 1 ? "s" : ""} for "{query}"
            </span>
          </div>
        )}

        {/* Results */}
        {!searched ? (
          <div style={{
            textAlign: "center", padding: "80px 20px",
            background: "rgba(255,255,255,0.02)",
            border: "1px dashed rgba(255,255,255,0.07)",
            borderRadius: "20px",
          }}>
            <div style={{ fontSize: "52px", marginBottom: "16px" }}>🔍</div>
            <p style={{ fontSize: "16px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>
              Search your memories
            </p>
            <p style={{ fontSize: "13px", color: "#334155" }}>
              Try natural language: "machine learning notes" or "startup ideas"
            </p>
          </div>
        ) : loading ? (
          <div style={{ textAlign: "center", color: "#475569", padding: "80px" }}>
            <div style={{ fontSize: "32px", marginBottom: "16px" }}>⏳</div>
            Searching through your memories...
          </div>
        ) : results.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "80px",
            background: "rgba(255,255,255,0.02)",
            border: "1px dashed rgba(255,255,255,0.07)",
            borderRadius: "20px",
          }}>
            <div style={{ fontSize: "52px", marginBottom: "16px" }}>🤔</div>
            <p style={{ fontSize: "16px", fontWeight: 600, color: "#475569" }}>
              No matching memories found
            </p>
            <p style={{ fontSize: "13px", color: "#334155", marginTop: "8px" }}>
              Try different keywords or upload more content
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
            {results.map((memory) => (
              <MemoryCard key={memory.id} memory={memory} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}