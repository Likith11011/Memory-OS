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
  general: "#059669", code: "#065F46",
  research: "#0284C7", exam: "#D97706", project: "#7C3AED",
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

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAF9", fontFamily: "'Inter', sans-serif" }}>
      <Sidebar />
      <main style={{ marginLeft: "240px", flex: 1, padding: "32px 40px", boxSizing: "border-box", width: "calc(100% - 240px)", overflowX: "hidden" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2 style={{ fontSize: "28px", fontWeight: 700, color: "#10231D", letterSpacing: "-0.02em", marginBottom: "4px" }}>
              📊 Insights & Knowledge Analytics
            </h2>
            <p style={{ color: "#52635C", fontSize: "14px" }}>
              Your digital knowledge forest at a glance
            </p>
          </div>

          {/* Export buttons */}
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => handleExport("json")} style={{
              background: "#FFFFFF", border: "1px solid #DDE7E2",
              borderRadius: "10px", padding: "8px 16px", color: "#065F46",
              fontSize: "13px", fontWeight: 600, cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)", transition: "all 0.2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "#059669")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "#DDE7E2")}
            >
              ⬇ Export JSON
            </button>
            <button onClick={() => handleExport("markdown")} style={{
              background: "#ECFDF5", border: "1px solid #A7F3D0",
              borderRadius: "10px", padding: "8px 16px", color: "#059669",
              fontSize: "13px", fontWeight: 600, cursor: "pointer",
              boxShadow: "0 1px 3px rgba(5,150,105,0.1)", transition: "all 0.2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.background = "#D1FAE5")}
              onMouseLeave={e => (e.currentTarget.style.background = "#ECFDF5")}
            >
              ⬇ Export Markdown
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", background: "#F1F5F3", border: "1px solid #DDE7E2", borderRadius: "12px", padding: "4px", marginBottom: "24px", width: "fit-content" }}>
          {(["overview", "summary", "graph"] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); if (t === "graph") fetchGraph(); }} style={{
              padding: "8px 20px", borderRadius: "8px", border: "none",
              background: tab === t ? "#FFFFFF" : "transparent",
              color: tab === t ? "#064E3B" : "#52635C",
              fontSize: "13px", fontWeight: 600, cursor: "pointer", textTransform: "capitalize",
              boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.2s",
            }}>
              {t === "overview" ? "⊞ Overview" : t === "summary" ? "📋 Weekly Summary" : "🕸️ Knowledge Graph"}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", color: "#52635C", padding: "80px" }}>Loading insights...</div>
        ) : tab === "overview" && stats ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
              {[
                { label: "Total Memories", value: stats.total, color: "#059669", icon: "🧠" },
                { label: "Reviewed", value: stats.review_stats.total_reviewed, color: "#065F46", icon: "✓" },
                { label: "Never Reviewed", value: stats.review_stats.never_reviewed, color: "#D97706", icon: "⚠" },
                { label: "Avg Reviews", value: stats.review_stats.avg_review_count, color: "#7C3AED", icon: "🔄" },
              ].map(s => (
                <div key={s.label} style={{ background: "#FFFFFF", border: "1px solid #DDE7E2", borderRadius: "16px", padding: "20px", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                  <div style={{ fontSize: "24px", marginBottom: "8px" }}>{s.icon}</div>
                  <p style={{ color: "#7A8A84", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px", fontWeight: 600 }}>{s.label}</p>
                  <p style={{ color: s.color, fontSize: "28px", fontWeight: 700, margin: 0 }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* By category + By type */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={{ background: "#FFFFFF", border: "1px solid #DDE7E2", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                <h3 style={{ color: "#10231D", fontSize: "15px", fontWeight: 600, marginBottom: "16px" }}>By Category</h3>
                {Object.entries(stats.by_category).map(([cat, count]) => {
                  const pct = Math.round((count / stats.total) * 100);
                  const color = CATEGORY_COLORS[cat] || "#059669";
                  return (
                    <div key={cat} style={{ marginBottom: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ color: "#52635C", fontSize: "13px", textTransform: "capitalize", fontWeight: 500 }}>{cat}</span>
                        <span style={{ color: color, fontSize: "13px", fontWeight: 600 }}>{count} ({pct}%)</span>
                      </div>
                      <div style={{ height: "7px", background: "#F1F5F3", borderRadius: "999px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "999px", transition: "width 0.5s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ background: "#FFFFFF", border: "1px solid #DDE7E2", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                <h3 style={{ color: "#10231D", fontSize: "15px", fontWeight: 600, marginBottom: "16px" }}>By File Type</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  {Object.entries(stats.by_type).map(([type, count]) => (
                    <div key={type} style={{
                      background: "#F8FAF9",
                      border: "1px solid #DDE7E2",
                      borderRadius: "12px", padding: "12px 16px",
                      display: "flex", alignItems: "center", gap: "10px",
                      minWidth: "100px",
                    }}>
                      <span style={{ fontSize: "20px" }}>{TYPE_ICONS[type] || "📄"}</span>
                      <div>
                        <p style={{ color: "#10231D", fontSize: "16px", fontWeight: 700, margin: 0 }}>{count}</p>
                        <p style={{ color: "#7A8A84", fontSize: "10px", textTransform: "uppercase", margin: 0, fontWeight: 600 }}>{type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top tags */}
            {stats.most_used_tags.length > 0 && (
              <div style={{ background: "#FFFFFF", border: "1px solid #DDE7E2", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                <h3 style={{ color: "#10231D", fontSize: "15px", fontWeight: 600, marginBottom: "16px" }}>🏷️ Most Used Tags</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {stats.most_used_tags.map(({ tag, count }) => (
                    <span key={tag} style={{
                      background: "#ECFDF5", border: "1px solid #A7F3D0",
                      color: "#065F46", borderRadius: "999px",
                      padding: "5px 14px", fontSize: "12px",
                      display: "flex", alignItems: "center", gap: "6px",
                      fontWeight: 500,
                    }}>
                      #{tag}
                      <span style={{ background: "#059669", color: "white", borderRadius: "999px", padding: "0 6px", fontSize: "10px", fontWeight: 700 }}>{count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Knowledge growth */}
            {stats.knowledge_growth.length > 1 && (
              <div style={{ background: "#FFFFFF", border: "1px solid #DDE7E2", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                <h3 style={{ color: "#10231D", fontSize: "15px", fontWeight: 600, marginBottom: "16px" }}>📈 Knowledge Growth</h3>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "100px", paddingBottom: "10px" }}>
                  {stats.knowledge_growth.slice(-12).map((g, i, arr) => {
                    const max = Math.max(...arr.map(x => x.total));
                    const pct = max > 0 ? (g.total / max) * 100 : 0;
                    return (
                      <div key={g.week} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                        <div style={{
                          width: "100%", height: `${Math.max(pct, 10)}%`,
                          background: "linear-gradient(180deg, #10B981, #059669)",
                          borderRadius: "4px 4px 0 0", minHeight: "8px",
                        }} />
                        <span style={{ color: "#7A8A84", fontSize: "10px", whiteSpace: "nowrap", fontWeight: 500 }}>
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
            <div style={{ background: "#FFFFFF", border: "1px solid #DDE7E2", borderRadius: "16px", padding: "28px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <span style={{ fontSize: "28px" }}>📋</span>
                <div>
                  <h3 style={{ color: "#10231D", fontSize: "18px", fontWeight: 700, margin: 0 }}>This Week's Summary</h3>
                  <p style={{ color: "#52635C", fontSize: "13px", margin: 0 }}>{summary.count} memories uploaded</p>
                </div>
              </div>
              <p style={{ color: "#52635C", fontSize: "14px", lineHeight: 1.7, marginBottom: "20px" }}>
                {summary.summary}
              </p>
              {summary.insight && (
                <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: "12px", padding: "14px 18px" }}>
                  <p style={{ color: "#065F46", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>💡 Insight for next week</p>
                  <p style={{ color: "#064E3B", fontSize: "13px", margin: 0, lineHeight: 1.5 }}>{summary.insight}</p>
                </div>
              )}
            </div>

            {/* Topics covered */}
            {summary.topics.length > 0 && (
              <div style={{ background: "#FFFFFF", border: "1px solid #DDE7E2", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                <h3 style={{ color: "#10231D", fontSize: "15px", fontWeight: 600, marginBottom: "14px" }}>Topics Covered This Week</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {summary.topics.map(t => (
                    <span key={t} style={{
                      background: "#ECFDF5", border: "1px solid #A7F3D0",
                      color: "#065F46", borderRadius: "999px", padding: "5px 14px", fontSize: "12px",
                      fontWeight: 500,
                    }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested review */}
            {summary.suggested_review.length > 0 && (
              <div style={{ background: "#FFFFFF", border: "1px solid #DDE7E2", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                <h3 style={{ color: "#10231D", fontSize: "15px", fontWeight: 600, marginBottom: "14px" }}>⏰ Due for Review</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {summary.suggested_review.map(m => (
                    <div key={m.id} style={{
                      background: "#FEF3C7", border: "1px solid #FDE68A",
                      borderRadius: "10px", padding: "12px 16px",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                      <div>
                        <p style={{ color: "#92400E", fontSize: "13px", fontWeight: 600, margin: 0 }}>{m.title}</p>
                        {m.subject && <p style={{ color: "#B45309", fontSize: "11px", margin: 0 }}>{m.subject}</p>}
                      </div>
                      <button onClick={() => router.push(`/exam`)} style={{ background: "none", border: "none", color: "#B45309", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Review now →</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        ) : tab === "graph" ? (
          <div style={{ background: "#FFFFFF", border: "1px solid #DDE7E2", borderRadius: "16px", padding: "24px", minHeight: "520px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ color: "#10231D", fontSize: "15px", fontWeight: 600, margin: 0 }}>🕸️ Memory Knowledge Graph</h3>
              <p style={{ color: "#52635C", fontSize: "12px", margin: 0 }}>Lines show semantic connections between memories</p>
            </div>

            {graphLoading ? (
              <div style={{ textAlign: "center", color: "#52635C", padding: "80px" }}>Building your knowledge graph...</div>
            ) : graphData ? (
              <div style={{ position: "relative", height: "480px", overflow: "hidden" }}>
                <svg width="100%" height="100%" style={{ background: "#F8FAF9", borderRadius: "12px", border: "1px solid #DDE7E2" }}>
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
                        stroke="#059669"
                        strokeOpacity={0.25 + edge.strength * 0.4}
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
                    const nodeColor = CATEGORY_COLORS[node.category] || node.color || "#059669";

                    return (
                      <g key={node.id} style={{ cursor: "pointer" }}
                        onClick={() => setSelectedNode(isSelected ? null : node)}>
                        <circle
                          cx={`${x}%`} cy={`${y}%`} r={isSelected ? 14 : 10}
                          fill={nodeColor}
                          fillOpacity={0.2}
                          stroke={nodeColor}
                          strokeWidth={isSelected ? 3 : 1.5}
                        />
                        <text
                          x={`${x}%`} y={`${y}%`}
                          textAnchor="middle" dominantBaseline="middle"
                          fill="#10231D" fontSize="9" fontWeight="600"
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
                    padding: "16px", maxWidth: "240px",
                    background: "#FFFFFF",
                    border: "1.5px solid #DDE7E2",
                    borderRadius: "12px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  }}>
                    <p style={{ color: CATEGORY_COLORS[selectedNode.category] || "#059669", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>
                      {selectedNode.category}
                    </p>
                    <p style={{ color: "#10231D", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                      {selectedNode.title}
                    </p>
                    {selectedNode.tags && (
                      <p style={{ color: "#52635C", fontSize: "11px", marginBottom: "4px" }}>
                        Tags: {selectedNode.tags}
                      </p>
                    )}
                    <p style={{ color: "#7A8A84", fontSize: "10px", margin: 0 }}>
                      {selectedNode.created_at?.slice(0, 10)}
                    </p>
                  </div>
                )}

                {/* Legend */}
                <div style={{ position: "absolute", bottom: "16px", left: "16px", display: "flex", gap: "12px", flexWrap: "wrap", background: "rgba(255,255,255,0.9)", padding: "6px 12px", borderRadius: "8px", border: "1px solid #DDE7E2" }}>
                  {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                    <div key={cat} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: color }} />
                      <span style={{ color: "#52635C", fontSize: "11px", textTransform: "capitalize", fontWeight: 500 }}>{cat}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", color: "#52635C", padding: "80px" }}>
                No graph data available
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}