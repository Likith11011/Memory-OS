"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import api from "@/lib/api";

interface InsightStats {
  total: number;
  by_type: Record<string, number>;
  by_category: Record<string, number>;
  by_language: Record<string, number>;
  most_used_tags: { tag: string; count: number }[];
  review_stats: { total_reviewed: number; never_reviewed: number; avg_review_count: number };
  knowledge_growth: { week: string; total: number }[];
  uploads_per_day: Record<string, number>;
}

interface WeeklySummary {
  summary: string;
  insight: string;
  count: number;
  topics: string[];
  suggested_review: { id: number; title: string; subject: string }[];
}

const CATEGORY_COLORS: Record<string, string> = {
  general: "#6366f1", code: "#10b981",
  research: "#3b82f6", exam: "#f59e0b", project: "#8b5cf6",
};

const TYPE_ICONS: Record<string, string> = {
  text: "📝", pdf: "📄", docx: "📘", pptx: "📊",
  image: "🖼️", url: "🌐", code: "💻",
};

export default function InsightsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<InsightStats | null>(null);
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "summary" | "graph">("overview");
  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[] } | null>(null);
  const [graphLoading, setGraphLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, summaryRes] = await Promise.all([
        api.get("/memories/insights/stats"),
        api.get("/memories/insights/weekly-summary"),
      ]);
      setStats(statsRes.data);
      setSummary(summaryRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGraph = async () => {
    if (graphData) return;
    setGraphLoading(true);
    try {
      const res = await api.get("/memories/graph");
      setGraphData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setGraphLoading(false);
    }
  };

  const handleExport = async (format: "json" | "markdown") => {
    try {
      const res = await api.get(`/memories/export/${format}`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `memoryos-export.${format === "json" ? "json" : "md"}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  const glass = {
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "linear-gradient(135deg, #0A1224, #0d1530)", fontFamily: "'Inter', sans-serif" }}>
      <Sidebar />
      <main style={{ marginLeft: "240px", flex: 1, padding: "28px", boxSizing: "border-box", width: "calc(100% - 240px)", overflowX: "hidden" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2 style={{ fontSize: "26px", fontWeight: 700, color: "#F8FAFC", letterSpacing: "-0.02em" }}>
              📊 Insights
            </h2>
            <p style={{ color: "#475569", fontSize: "14px" }}>
              Your knowledge base at a glance
            </p>
          </div>

          {/* Export buttons */}
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => handleExport("json")} style={{
              background: "rgba(37,99,235,0.12)", border: "1px solid rgba(37,99,235,0.25)",
              borderRadius: "10px", padding: "8px 16px", color: "#60A5FA",
              fontSize: "13px", fontWeight: 600, cursor: "pointer",
            }}>
              ⬇ Export JSON
            </button>
            <button onClick={() => handleExport("markdown")} style={{
              background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)",
              borderRadius: "10px", padding: "8px 16px", color: "#10b981",
              fontSize: "13px", fontWeight: 600, cursor: "pointer",
            }}>
              ⬇ Export Markdown
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "4px", marginBottom: "24px", width: "fit-content" }}>
          {(["overview", "summary", "graph"] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); if (t === "graph") fetchGraph(); }} style={{
              padding: "8px 20px", borderRadius: "8px", border: "none",
              background: tab === t ? "rgba(37,99,235,0.25)" : "transparent",
              color: tab === t ? "#60A5FA" : "#475569",
              fontSize: "13px", fontWeight: 600, cursor: "pointer", textTransform: "capitalize",
            }}>
              {t === "overview" ? "⊞ Overview" : t === "summary" ? "📋 Weekly" : "🕸️ Graph"}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", color: "#475569", padding: "80px" }}>Loading insights...</div>
        ) : tab === "overview" && stats ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
              {[
                { label: "Total Memories", value: stats.total, color: "#2563EB", icon: "🧠" },
                { label: "Reviewed", value: stats.review_stats.total_reviewed, color: "#10b981", icon: "✓" },
                { label: "Never Reviewed", value: stats.review_stats.never_reviewed, color: "#f59e0b", icon: "⚠" },
                { label: "Avg Reviews", value: stats.review_stats.avg_review_count, color: "#8b5cf6", icon: "🔄" },
              ].map(s => (
                <div key={s.label} style={{ ...glass, padding: "20px", textAlign: "center" }}>
                  <div style={{ fontSize: "24px", marginBottom: "8px" }}>{s.icon}</div>
                  <p style={{ color: "#475569", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>{s.label}</p>
                  <p style={{ color: s.color, fontSize: "28px", fontWeight: 700 }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* By category + By type */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={{ ...glass, padding: "20px" }}>
                <h3 style={{ color: "#F8FAFC", fontSize: "14px", fontWeight: 600, marginBottom: "16px" }}>By Category</h3>
                {Object.entries(stats.by_category).map(([cat, count]) => {
                  const pct = Math.round((count / stats.total) * 100);
                  return (
                    <div key={cat} style={{ marginBottom: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ color: "#94A3B8", fontSize: "12px", textTransform: "capitalize" }}>{cat}</span>
                        <span style={{ color: CATEGORY_COLORS[cat] || "#6366f1", fontSize: "12px", fontWeight: 600 }}>{count}</span>
                      </div>
                      <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "999px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: CATEGORY_COLORS[cat] || "#6366f1", borderRadius: "999px", transition: "width 0.5s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ ...glass, padding: "20px" }}>
                <h3 style={{ color: "#F8FAFC", fontSize: "14px", fontWeight: 600, marginBottom: "16px" }}>By File Type</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {Object.entries(stats.by_type).map(([type, count]) => (
                    <div key={type} style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "10px", padding: "10px 14px",
                      display: "flex", alignItems: "center", gap: "8px",
                    }}>
                      <span style={{ fontSize: "18px" }}>{TYPE_ICONS[type] || "📄"}</span>
                      <div>
                        <p style={{ color: "#F8FAFC", fontSize: "16px", fontWeight: 700, margin: 0 }}>{count}</p>
                        <p style={{ color: "#475569", fontSize: "10px", textTransform: "uppercase", margin: 0 }}>{type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top tags */}
            {stats.most_used_tags.length > 0 && (
              <div style={{ ...glass, padding: "20px" }}>
                <h3 style={{ color: "#F8FAFC", fontSize: "14px", fontWeight: 600, marginBottom: "16px" }}>🏷️ Most Used Tags</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {stats.most_used_tags.map(({ tag, count }) => (
                    <span key={tag} style={{
                      background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)",
                      color: "#60A5FA", borderRadius: "999px",
                      padding: "4px 12px", fontSize: "12px",
                      display: "flex", alignItems: "center", gap: "6px",
                    }}>
                      #{tag}
                      <span style={{ background: "rgba(37,99,235,0.3)", borderRadius: "999px", padding: "0 5px", fontSize: "10px" }}>{count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Knowledge growth */}
            {stats.knowledge_growth.length > 1 && (
              <div style={{ ...glass, padding: "20px" }}>
                <h3 style={{ color: "#F8FAFC", fontSize: "14px", fontWeight: 600, marginBottom: "16px" }}>📈 Knowledge Growth</h3>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "80px" }}>
                  {stats.knowledge_growth.slice(-12).map((g, i, arr) => {
                    const max = Math.max(...arr.map(x => x.total));
                    const pct = max > 0 ? (g.total / max) * 100 : 0;
                    return (
                      <div key={g.week} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                        <div style={{
                          width: "100%", height: `${Math.max(pct, 8)}%`,
                          background: "linear-gradient(180deg, #2563EB, #1d4ed8)",
                          borderRadius: "4px 4px 0 0", minHeight: "6px",
                          boxShadow: "0 0 8px rgba(37,99,235,0.4)",
                        }} />
                        <span style={{ color: "#334155", fontSize: "8px", whiteSpace: "nowrap" }}>
                          {g.week.split("W")[1] ? `W${g.week.split("W")[1]}` : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        ) : tab === "summary" && summary ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Summary card */}
            <div style={{ ...glass, padding: "24px", background: "rgba(37,99,235,0.06)", borderColor: "rgba(37,99,235,0.2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <span style={{ fontSize: "24px" }}>📋</span>
                <div>
                  <h3 style={{ color: "#F8FAFC", fontSize: "16px", fontWeight: 700, margin: 0 }}>This Week's Summary</h3>
                  <p style={{ color: "#475569", fontSize: "12px", margin: 0 }}>{summary.count} memories uploaded</p>
                </div>
              </div>
              <p style={{ color: "#94A3B8", fontSize: "14px", lineHeight: 1.7, marginBottom: "16px" }}>
                {summary.summary}
              </p>
              {summary.insight && (
                <div style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: "10px", padding: "12px 16px" }}>
                  <p style={{ color: "#60A5FA", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>💡 Insight for next week</p>
                  <p style={{ color: "#94A3B8", fontSize: "13px", margin: 0 }}>{summary.insight}</p>
                </div>
              )}
            </div>

            {/* Topics covered */}
            {summary.topics.length > 0 && (
              <div style={{ ...glass, padding: "20px" }}>
                <h3 style={{ color: "#F8FAFC", fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>Topics Covered This Week</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {summary.topics.map(t => (
                    <span key={t} style={{
                      background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)",
                      color: "#10b981", borderRadius: "999px", padding: "4px 12px", fontSize: "12px",
                    }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested review */}
            {summary.suggested_review.length > 0 && (
              <div style={{ ...glass, padding: "20px" }}>
                <h3 style={{ color: "#F8FAFC", fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>⏰ Due for Review</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {summary.suggested_review.map(m => (
                    <div key={m.id} style={{
                      background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)",
                      borderRadius: "10px", padding: "12px 16px",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                      <div>
                        <p style={{ color: "#F8FAFC", fontSize: "13px", fontWeight: 600, margin: 0 }}>{m.title}</p>
                        {m.subject && <p style={{ color: "#475569", fontSize: "11px", margin: 0 }}>{m.subject}</p>}
                      </div>
                      <span style={{ color: "#f59e0b", fontSize: "11px", fontWeight: 600 }}>Review now →</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        ) : tab === "graph" ? (
          <div style={{ ...glass, padding: "20px", minHeight: "500px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ color: "#F8FAFC", fontSize: "14px", fontWeight: 600, margin: 0 }}>🕸️ Memory Knowledge Graph</h3>
              <p style={{ color: "#475569", fontSize: "12px", margin: 0 }}>Lines show semantic connections between memories</p>
            </div>

            {graphLoading ? (
              <div style={{ textAlign: "center", color: "#475569", padding: "80px" }}>Building your knowledge graph...</div>
            ) : graphData ? (
              <div style={{ position: "relative", height: "480px", overflow: "hidden" }}>
                <svg width="100%" height="100%" style={{ background: "rgba(255,255,255,0.02)", borderRadius: "12px" }}>
                  {/* Edges */}
                  {graphData.edges.map((edge, i) => {
                    const sourceNode = graphData.nodes.find(n => n.id === edge.source);
                    const targetNode = graphData.nodes.find(n => n.id === edge.target);
                    if (!sourceNode || !targetNode) return null;

                    const nodeCount = graphData.nodes.length;
                    const sourceIdx = graphData.nodes.indexOf(sourceNode);
                    const targetIdx = graphData.nodes.indexOf(targetNode);
                    const cols = Math.ceil(Math.sqrt(nodeCount));
                    const sx = ((sourceIdx % cols) + 0.5) / cols * 100;
                    const sy = (Math.floor(sourceIdx / cols) + 0.5) / Math.ceil(nodeCount / cols) * 100;
                    const tx = ((targetIdx % cols) + 0.5) / cols * 100;
                    const ty = (Math.floor(targetIdx / cols) + 0.5) / Math.ceil(nodeCount / cols) * 100;

                    return (
                      <line key={i}
                        x1={`${sx}%`} y1={`${sy}%`}
                        x2={`${tx}%`} y2={`${ty}%`}
                        stroke={sourceNode.color}
                        strokeOpacity={0.2 + edge.strength * 0.4}
                        strokeWidth={edge.strength * 2 + 0.5}
                      />
                    );
                  })}

                  {/* Nodes */}
                  {graphData.nodes.map((node, idx) => {
                    const cols = Math.ceil(Math.sqrt(graphData.nodes.length));
                    const x = ((idx % cols) + 0.5) / cols * 100;
                    const y = (Math.floor(idx / cols) + 0.5) / Math.ceil(graphData.nodes.length / cols) * 100;
                    const isSelected = selectedNode?.id === node.id;

                    return (
                      <g key={node.id} style={{ cursor: "pointer" }}
                        onClick={() => setSelectedNode(isSelected ? null : node)}>
                        <circle
                          cx={`${x}%`} cy={`${y}%`} r={isSelected ? 14 : 10}
                          fill={node.color}
                          fillOpacity={0.3}
                          stroke={node.color}
                          strokeWidth={isSelected ? 3 : 1.5}
                        />
                        <text
                          x={`${x}%`} y={`${y}%`}
                          textAnchor="middle" dominantBaseline="middle"
                          fill="#F8FAFC" fontSize="9"
                          style={{ pointerEvents: "none", userSelect: "none" }}
                        >
                          {node.title.length > 12 ? node.title.slice(0, 12) + "…" : node.title}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Selected node detail */}
                {selectedNode && (
                  <div style={{
                    position: "absolute", top: "16px", right: "16px",
                    ...glass, padding: "16px", maxWidth: "220px",
                    background: "rgba(15,26,46,0.95)",
                  }}>
                    <p style={{ color: selectedNode.color, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", marginBottom: "6px" }}>
                      {selectedNode.category}
                    </p>
                    <p style={{ color: "#F8FAFC", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                      {selectedNode.title}
                    </p>
                    {selectedNode.tags && (
                      <p style={{ color: "#475569", fontSize: "11px" }}>
                        Tags: {selectedNode.tags}
                      </p>
                    )}
                    <p style={{ color: "#334155", fontSize: "10px" }}>
                      {selectedNode.created_at?.slice(0, 10)}
                    </p>
                  </div>
                )}

                {/* Legend */}
                <div style={{ position: "absolute", bottom: "16px", left: "16px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                    <div key={cat} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: color }} />
                      <span style={{ color: "#475569", fontSize: "10px", textTransform: "capitalize" }}>{cat}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", color: "#475569", padding: "80px" }}>
                No graph data available
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}