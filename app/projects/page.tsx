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
  { id: "idea", label: "💡 Ideas", color: "#065F46", badgeBg: "#ECFDF5", badgeBorder: "#A7F3D0" },
  { id: "in-progress", label: "🔨 In Progress", color: "#D97706", badgeBg: "#FEF3C7", badgeBorder: "#FDE68A" },
  { id: "done", label: "✅ Done", color: "#059669", badgeBg: "#ECFDF5", badgeBorder: "#A7F3D0" },
  { id: "abandoned", label: "🚫 Abandoned", color: "#6B7280", badgeBg: "#F3F4F6", badgeBorder: "#E5E7EB" },
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
    } catch (err: any) {
      if (err.code === "ERR_NETWORK" || err.message?.includes("Network")) {
        console.warn("Server waking up, retrying in 10s...");
        setTimeout(() => fetchProjects(), 10000);
      } else {
        console.error(err);
      }
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

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAF9", fontFamily: "'Inter', sans-serif" }}>
      <Sidebar />
      <main style={{ marginLeft: "240px", flex: 1, padding: "32px 40px", overflowX: "auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: 700, color: "#10231D", marginBottom: "4px", letterSpacing: "-0.02em" }}>
            🚀 Project Ideas
          </h2>
          <p style={{ color: "#52635C", fontSize: "14px" }}>
            {memories.length} projects tracked — drag cards between columns to update status
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", color: "#52635C", padding: "80px" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div>
            Loading projects...
          </div>
        ) : memories.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "80px",
            background: "#FFFFFF", border: "1.5px dashed #DDE7E2", borderRadius: "20px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
          }}>
            <div style={{ fontSize: "52px", marginBottom: "16px" }}>🚀</div>
            <p style={{ fontSize: "18px", fontWeight: 600, color: "#10231D", marginBottom: "8px" }}>
              No project ideas yet
            </p>
            <p style={{ fontSize: "14px", color: "#52635C" }}>
              Upload memories with "Project Idea" category to track them here
            </p>
          </div>
        ) : (
          // Kanban board
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", minWidth: "920px" }}>
            {columns.map((col) => {
              const colMemories = getColumnMemories(col.id);
              const isOver = dragOver === col.id;
              return (
                <div
                  key={col.id}
                  onDragOver={(e) => handleDragOver(e, col.id)}
                  onDrop={(e) => handleDrop(e, col.id)}
                  style={{
                    background: isOver ? "#ECFDF5" : "#F1F5F3",
                    border: `1.5px solid ${isOver ? "#059669" : "#DDE7E2"}`,
                    borderRadius: "16px",
                    padding: "16px",
                    minHeight: "520px",
                    transition: "all 0.2s",
                  }}
                >
                  {/* Column header */}
                  <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ color: col.color, fontSize: "13px", fontWeight: 700, margin: 0 }}>
                      {col.label}
                    </h3>
                    <span style={{
                      background: col.badgeBg,
                      border: `1px solid ${col.badgeBorder}`,
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
                          background: "#FFFFFF",
                          border: `1px solid ${dragging === memory.id ? "#059669" : "#DDE7E2"}`,
                          borderRadius: "12px",
                          padding: "14px",
                          cursor: "grab",
                          transition: "all 0.2s",
                          opacity: dragging === memory.id ? 0.5 : 1,
                          position: "relative",
                          overflow: "hidden",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                        }}
                        onMouseEnter={e => {
                          if (dragging !== memory.id) {
                            (e.currentTarget as HTMLDivElement).style.borderColor = col.color;
                            (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
                            (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 12px rgba(0,0,0,0.05)`;
                          }
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLDivElement).style.borderColor = "#DDE7E2";
                          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.03)";
                        }}
                      >
                        {/* Top accent line */}
                        <div style={{
                          position: "absolute", top: 0, left: 0, right: 0, height: "2.5px",
                          background: col.color,
                        }} />

                        <h4 style={{ color: "#10231D", fontSize: "13px", fontWeight: 600, marginBottom: "6px", lineHeight: 1.3 }}>
                          {memory.title}
                        </h4>
                        <p style={{
                          color: "#52635C", fontSize: "12px", lineHeight: 1.5,
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
                                background: "#ECFDF5",
                                border: "1px solid #A7F3D0",
                                color: "#065F46",
                                padding: "1px 6px", borderRadius: "999px", fontSize: "10px",
                                fontWeight: 500,
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
                                background: memory.project_status === c.id ? c.badgeBg : "#F8FAF9",
                                border: `1px solid ${memory.project_status === c.id ? c.color : "#DDE7E2"}`,
                                color: memory.project_status === c.id ? c.color : "#7A8A84",
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
                        border: `2px dashed ${col.color}`,
                        borderRadius: "12px", padding: "20px",
                        textAlign: "center", color: col.color,
                        fontSize: "12px", fontWeight: 600,
                        background: "#FFFFFF",
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