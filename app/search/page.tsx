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

  const searchTypeBadge: Record<string, { label: string; color: string; bg: string; border: string }> = {
    semantic: { label: "✦ Semantic", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" },
    keyword: { label: "# Keyword", color: "#D97706", bg: "#FEF3C7", border: "#FDE68A" },
    hybrid: { label: "⚡ Hybrid", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
  };

  const badge = searchTypeBadge[searchType] || null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAF9", fontFamily: "'Inter', sans-serif" }}>
      <Sidebar />
      <main style={{ marginLeft: "240px", flex: 1, padding: "32px 40px" }}>

        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: 700, color: "#10231D", marginBottom: "4px", letterSpacing: "-0.02em" }}>
            Semantic Search
          </h2>
          <p style={{ color: "#52635C", fontSize: "14px" }}>
            Search by meaning — AI understands context, concepts, and relationships across your knowledge base
          </p>
        </div>

        {/* Search bar */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <span style={{
              position: "absolute", left: "16px", top: "50%",
              transform: "translateY(-50%)", color: "#7A8A84", fontSize: "16px",
            }}>⌕</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="What do you want to remember? (e.g. system design principles, lecture notes)..."
              style={{
                width: "100%",
                background: "#FFFFFF",
                border: "1.5px solid #DDE7E2",
                borderRadius: "14px", padding: "14px 20px 14px 44px",
                color: "#10231D", fontSize: "15px", outline: "none",
                boxSizing: "border-box", transition: "all 0.2s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}
              onFocus={e => { e.target.style.borderColor = "#059669"; e.target.style.boxShadow = "0 0 0 3px rgba(5,150,105,0.12)"; }}
              onBlur={e => { e.target.style.borderColor = "#DDE7E2"; e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.03)"; }}
            />
          </div>
          <button
            onClick={() => handleSearch()} disabled={loading}
            style={{
              background: loading ? "#9CA3AF" : "#059669",
              border: "none", borderRadius: "14px",
              padding: "14px 28px", color: "white",
              fontSize: "15px", fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
              boxShadow: !loading ? "0 2px 8px rgba(5,150,105,0.25)" : "none",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#047857"; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "#059669"; }}
          >
            {loading ? "Searching..." : "Search →"}
          </button>
        </div>

        {/* Example queries */}
        {!searched && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "40px", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "#7A8A84", fontWeight: 500, marginRight: "4px" }}>Suggestions:</span>
            {EXAMPLE_QUERIES.map((q) => (
              <button key={q} onClick={() => handleSearch(q)} style={{
                background: "#ECFDF5",
                border: "1px solid #A7F3D0",
                borderRadius: "999px", color: "#065F46",
                padding: "6px 14px", fontSize: "12px", cursor: "pointer",
                fontWeight: 500,
                transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "#D1FAE5"; e.currentTarget.style.borderColor = "#059669"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#ECFDF5"; e.currentTarget.style.borderColor = "#A7F3D0"; }}
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
                background: badge.bg,
                border: `1px solid ${badge.border}`,
                color: badge.color,
                padding: "4px 12px", borderRadius: "999px",
                fontSize: "12px", fontWeight: 600,
              }}>
                {badge.label}
              </span>
            )}
            <span style={{ color: "#52635C", fontSize: "13px" }}>
              {results.length} result{results.length !== 1 ? "s" : ""} for "<strong style={{ color: "#10231D" }}>{query}</strong>"
            </span>
          </div>
        )}

        {/* Results */}
        {!searched ? (
          <div style={{
            textAlign: "center", padding: "80px 20px",
            background: "#FFFFFF",
            border: "1.5px dashed #DDE7E2",
            borderRadius: "20px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
            <p style={{ fontSize: "16px", fontWeight: 600, color: "#10231D", marginBottom: "8px" }}>
              Search your knowledge forest
            </p>
            <p style={{ fontSize: "13px", color: "#52635C" }}>
              Try natural language: "machine learning notes" or "system architecture overview"
            </p>
          </div>
        ) : loading ? (
          <div style={{ textAlign: "center", color: "#52635C", padding: "80px" }}>
            <div style={{ fontSize: "32px", marginBottom: "16px" }}>🌲</div>
            Searching through your knowledge forest...
          </div>
        ) : results.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "80px",
            background: "#FFFFFF",
            border: "1.5px dashed #DDE7E2",
            borderRadius: "20px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🍃</div>
            <p style={{ fontSize: "16px", fontWeight: 600, color: "#10231D" }}>
              No matching memories found
            </p>
            <p style={{ fontSize: "13px", color: "#52635C", marginTop: "8px" }}>
              Try different keywords or upload new documents to your knowledge base
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