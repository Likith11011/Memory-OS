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
  "What do I know about Neural Networks?",
  "Show my architecture diagrams & notes",
  "Find software project ideas",
  "Summarize key algorithms and data structures",
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
  }, [router]);

  const handleSearch = async (q?: string) => {
    const searchQuery = q !== undefined ? q : query;
    if (!searchQuery.trim()) return;
    if (q !== undefined) setQuery(q);
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchMemories(searchQuery);
      setResults(data.results || []);
      setSearchType(data.search_type || "semantic");
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const searchTypeBadge: Record<string, { label: string; color: string; bg: string; border: string }> = {
    semantic: { label: "✦ Neural Semantic Search", color: "#34D399", bg: "rgba(16, 185, 129, 0.15)", border: "rgba(16, 185, 129, 0.3)" },
    keyword: { label: "# Exact Keyword Match", color: "#FBBF24", bg: "rgba(245, 158, 11, 0.15)", border: "rgba(245, 158, 11, 0.3)" },
    hybrid: { label: "⚡ Hybrid Neural+Keyword", color: "#38BDF8", bg: "rgba(56, 189, 248, 0.15)", border: "rgba(56, 189, 248, 0.3)" },
  };

  const badge = searchTypeBadge[searchType] || searchTypeBadge.semantic;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#09110E", color: "#F0FDF4", fontFamily: "'Inter', sans-serif" }}>
      <Sidebar />
      <main style={{ marginLeft: "250px", flex: 1, padding: "32px 40px", width: "calc(100% - 250px)", boxSizing: "border-box" }}>

        {/* Page Title */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ fontSize: "14px", color: "#10B981", fontWeight: 600 }}>⌕ Instant Vector Retrieval</span>
          </div>
          <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#F0FDF4", margin: 0, letterSpacing: "-0.02em" }}>
            Semantic Knowledge Search
          </h2>
          <p style={{ color: "#9EB3A8", fontSize: "14px", marginTop: "4px" }}>
            Query by meaning, intuition, or vague recollections — high-dimensional embeddings calculate topological relevance.
          </p>
        </div>

        {/* Search Bar Container */}
        <div className="glass-card" style={{
          display: "flex", gap: "12px", marginBottom: "16px",
          padding: "8px 12px", borderRadius: "16px",
          alignItems: "center",
          background: "#0E1915",
          border: "1px solid #1F3830",
        }}>
          <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center" }}>
            <span style={{
              position: "absolute", left: "14px",
              color: "#10B981", fontSize: "18px",
            }}>⌕</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
                if (e.key === "Escape") { setQuery(""); setSearched(false); }
              }}
              placeholder="What would you like to retrieve? (e.g. 'Raft consensus algorithm', 'React hooks best practices')..."
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                borderRadius: "10px", padding: "12px 20px 12px 46px",
                color: "#F0FDF4", fontSize: "15px", outline: "none",
                boxSizing: "border-box",
              }}
            />
            {query && (
              <button
                onClick={() => { setQuery(""); setSearched(false); }}
                style={{
                  background: "transparent", border: "none", color: "#5D756C",
                  cursor: "pointer", fontSize: "14px", padding: "4px 8px",
                }}
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={() => handleSearch()} disabled={loading}
            className="btn-primary"
            style={{
              padding: "11px 26px", fontSize: "14px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Searching..." : "Search Knowledge →"}
          </button>
        </div>

        {/* Example queries */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "32px", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "#5D756C", fontWeight: 600 }}>TRY SEARCHING:</span>
          {EXAMPLE_QUERIES.map((q) => (
            <button
              key={q}
              onClick={() => handleSearch(q)}
              style={{
                background: "#111E1A",
                border: "1px solid #1F3830",
                borderRadius: "999px", color: "#34D399",
                padding: "5px 14px", fontSize: "12px", cursor: "pointer",
                fontWeight: 500,
                transition: "all 0.18s ease",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(16, 185, 129, 0.15)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#10B981";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "#111E1A";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#1F3830";
              }}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Result Meta */}
        {searched && !loading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{
                background: badge.bg,
                border: `1px solid ${badge.border}`,
                color: badge.color,
                padding: "4px 12px", borderRadius: "999px",
                fontSize: "11px", fontWeight: 700,
              }}>
                {badge.label}
              </span>
              <span style={{ color: "#9EB3A8", fontSize: "13px" }}>
                Found {results.length} relevant {results.length === 1 ? "memory" : "memories"} for "<strong style={{ color: "#F0FDF4" }}>{query}</strong>"
              </span>
            </div>
          </div>
        )}

        {/* Results Area */}
        {!searched ? (
          <div style={{
            textAlign: "center", padding: "80px 20px",
            background: "#111E1A",
            border: "1px dashed #1F3830",
            borderRadius: "20px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }} className="animate-float">🔍</div>
            <p style={{ fontSize: "18px", fontWeight: 700, color: "#F0FDF4", marginBottom: "8px" }}>
              Ready to explore your second brain
            </p>
            <p style={{ fontSize: "13.5px", color: "#9EB3A8", maxWidth: "420px", margin: "0 auto" }}>
              Type any thought, concept, or technical term above to calculate cosine similarity across all stored vectors.
            </p>
          </div>
        ) : loading ? (
          <div style={{ textAlign: "center", color: "#9EB3A8", padding: "80px" }}>
            <div style={{ fontSize: "36px", marginBottom: "16px" }} className="animate-spin">🌲</div>
            <p style={{ fontSize: "15px", color: "#F0FDF4", fontWeight: 600 }}>Calculating high-dimensional embeddings...</p>
            <p style={{ fontSize: "12px", color: "#5D756C" }}>Searching ChromaDB collection</p>
          </div>
        ) : results.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "80px 20px",
            background: "#111E1A",
            border: "1px dashed #1F3830",
            borderRadius: "20px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🍃</div>
            <p style={{ fontSize: "18px", fontWeight: 700, color: "#F0FDF4" }}>
              No matching memories found
            </p>
            <p style={{ fontSize: "13.5px", color: "#9EB3A8", marginTop: "8px" }}>
              Try broadening your query or uploading new notes to enrich your vector space.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "18px" }}>
            {results.map((memory, i) => (
              <MemoryCard key={memory.id} memory={memory} animationDelay={i * 0.04} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}