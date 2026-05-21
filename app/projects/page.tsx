"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getProjects, updateProjectStatus } from "@/lib/api";
import Sidebar from "@/components/Sidebar";

interface Memory {
  id: number;
  title: string;
  content: string;
  file_type: string;
  tags: string;
  project_status?: string;
  created_at: string;
  memory_category?: string;
}

const columns = [
  { id: "idea", label: "💡 Ideas", color: "#6366f1", glow: "rgba(99,102,241,0.3)" },
  { id: "in-progress", label: "🔨 In Progress", color: "#f59e0b", glow: "rgba(245,158,11,0.3)" },
  { id: "done", label: "✅ Done", color: "#10b981", glow: "rgba(16,185,129,0.3)" },
  { id: "abandoned", label: "🚫 Abandoned", color: "#64748b", glow: "rgba(100,116,139,0.3)" },
];

export default function ProjectsPage() {
  const router = useRouter();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await getProjects();
      setMemories(data.memories || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await updateProjectStatus(id, status);
      setMemories(prev => prev.map(m => m.id === id ? { ...m, project_status: status } : m));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDragStart = (id: number) => setDragging(id);
  const handleDragEnd = () => { setDragging(null); setDragOver(null); };
  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    setDragOver(status);
  };
  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (dragging !== null) {
      await handleStatusChange(dragging, status);
    }
    setDragging(null);
    setDragOver(null);
  };

  const getColumnMemories = (status: string) =>
    memories.filter(m => (m.project_status || "idea") === status);

  const glass = {
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "linear-gradient(135deg, #0A1224 0%, #0d1530 100%)", fontFamily: "'Inter', sans-serif" }}>
      <Sidebar />
      <main style={{ marginLeft: "240px", flex: 1, padding: "32px", overflowX: "auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: 700, color: "#F8FAFC", marginBottom: "4px", letterSpacing: "-0.02em" }}>
            🚀 Project Ideas
          </h2>
          <p style={{ color: "#475569", fontSize: "14px" }}>
            {memories.length} projects tracked — drag cards between columns to update status
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", color: "#475569", padding: "80px" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div>
            Loading projects...
          </div>
        ) : memories.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px", ...glass }}>
            <div style={{ fontSize: "52px", marginBottom: "16px" }}>🚀</div>
            <p style={{ fontSize: "18px", fontWeight: 600, color: "#64748b", marginBottom: "8px" }}>
              No project ideas yet
            </p>
            <p style={{ fontSize: "14px", color: "#334155" }}>
              Upload memories with "Project Idea" category to track them here
            </p>
          </div>
        ) : (
          // Kanban board
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", minWidth: "900px" }}>
            {columns.map((col) => {
              const colMemories = getColumnMemories(col.id);
              const isOver = dragOver === col.id;
              return (
                <div
                  key={col.id}
                  onDragOver={(e) => handleDragOver(e, col.id)}
                  onDrop={(e) => handleDrop(e, col.id)}
                  style={{
                    background: isOver ? `${col.color}08` : "rgba(255,255,255,0.02)",
                    border: `1px solid ${isOver ? col.color + "44" : "rgba(255,255,255,0.06)"}`,
                    borderRadius: "20px",
                    padding: "16px",
                    minHeight: "500px",
                    transition: "all 0.2s",
                  }}
                >
                  {/* Column header */}
                  <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ color: col.color, fontSize: "13px", fontWeight: 700, margin: 0, textShadow: `0 0 10px ${col.glow}` }}>
                      {col.label}
                    </h3>
                    <span style={{
                      background: `${col.color}15`,
                      border: `1px solid ${col.color}33`,
                      color: col.color,
                      fontSize: "11px", fontWeight: 700,
                      padding: "2px 8px", borderRadius: "999px",
                    }}>
                      {colMemories.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {colMemories.map((memory) => (
                      <div
                        key={memory.id}
                        draggable
                        onDragStart={() => handleDragStart(memory.id)}
                        onDragEnd={handleDragEnd}
                        style={{
                          background: dragging === memory.id ? "rgba(37,99,235,0.15)" : "rgba(255,255,255,0.04)",
                          backdropFilter: "blur(10px)",
                          border: `1px solid ${dragging === memory.id ? "rgba(37,99,235,0.4)" : "rgba(255,255,255,0.08)"}`,
                          borderRadius: "12px",
                          padding: "14px",
                          cursor: "grab",
                          transition: "all 0.2s",
                          opacity: dragging === memory.id ? 0.6 : 1,
                          position: "relative",
                          overflow: "hidden",
                        }}
                        onMouseEnter={e => {
                          if (dragging !== memory.id) {
                            (e.currentTarget as HTMLDivElement).style.borderColor = `${col.color}44`;
                            (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
                            (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 15px rgba(0,0,0,0.2)`;
                          }
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.08)";
                          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                          (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                        }}
                      >
                        {/* Top accent */}
                        <div style={{
                          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
                          background: `linear-gradient(90deg, ${col.color}, transparent)`,
                        }} />

                        <h4 style={{ color: "#F8FAFC", fontSize: "13px", fontWeight: 600, marginBottom: "6px", lineHeight: 1.3 }}>
                          {memory.title}
                        </h4>
                        <p style={{
                          color: "#475569", fontSize: "12px", lineHeight: 1.5,
                          marginBottom: "10px",
                          display: "-webkit-box", WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical", overflow: "hidden",
                        }}>
                          {memory.content}
                        </p>

                        {/* Tags */}
                        {memory.tags && (
                          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "10px" }}>
                            {memory.tags.split(",").slice(0, 2).map(t => (
                              <span key={t} style={{
                                background: "rgba(37,99,235,0.1)",
                                border: "1px solid rgba(37,99,235,0.2)",
                                color: "#60A5FA",
                                padding: "1px 6px", borderRadius: "999px", fontSize: "10px",
                              }}>#{t.trim()}</span>
                            ))}
                          </div>
                        )}

                        {/* Status selector */}
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          {columns.map(c => (
                            <button
                              key={c.id}
                              onClick={() => handleStatusChange(memory.id, c.id)}
                              style={{
                                background: memory.project_status === c.id ? `${c.color}20` : "transparent",
                                border: `1px solid ${memory.project_status === c.id ? c.color + "44" : "rgba(255,255,255,0.06)"}`,
                                color: memory.project_status === c.id ? c.color : "#334155",
                                padding: "2px 6px", borderRadius: "6px",
                                fontSize: "10px", cursor: "pointer",
                                fontWeight: memory.project_status === c.id ? 600 : 400,
                                transition: "all 0.2s",
                              }}
                            >
                              {c.id === "idea" ? "💡" : c.id === "in-progress" ? "🔨" : c.id === "done" ? "✅" : "🚫"}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* Drop zone hint */}
                    {isOver && (
                      <div style={{
                        border: `2px dashed ${col.color}44`,
                        borderRadius: "12px", padding: "20px",
                        textAlign: "center", color: col.color,
                        fontSize: "12px", fontWeight: 500,
                      }}>
                        Drop here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}