"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getProjects, updateProjectStatus } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import UploadModal from "@/components/UploadModal";
import Toast from "@/components/Toast";

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
  { id: "idea", label: "💡 Ideas & Backlog", color: "#34D399", badgeBg: "rgba(16, 185, 129, 0.15)", badgeBorder: "rgba(16, 185, 129, 0.3)" },
  { id: "in-progress", label: "🔨 In Progress", color: "#FBBF24", badgeBg: "rgba(245, 158, 11, 0.15)", badgeBorder: "rgba(245, 158, 11, 0.3)" },
  { id: "done", label: "✅ Completed", color: "#10B981", badgeBg: "rgba(16, 185, 129, 0.15)", badgeBorder: "rgba(16, 185, 129, 0.3)" },
  { id: "abandoned", label: "🚫 Archived", color: "#9CA3AF", badgeBg: "rgba(156, 163, 175, 0.15)", badgeBorder: "rgba(156, 163, 175, 0.3)" },
];

export default function ProjectsPage() {
  const router = useRouter();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetchProjects();
  }, [router]);

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
      setToast({ message: "Project status updated", type: "success" });
    } catch (err) {
      console.error(err);
      setToast({ message: "Failed to update project status", type: "error" });
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
    <div style={{ display: "flex", minHeight: "100vh", background: "#09110E", color: "#F0FDF4", fontFamily: "'Inter', sans-serif" }}>
      <Sidebar />
      <main style={{ marginLeft: "250px", flex: 1, padding: "32px 40px", overflowX: "auto", width: "calc(100% - 250px)", boxSizing: "border-box" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "14px", color: "#10B981", fontWeight: 600 }}>🚀 Agile Project Workspace</span>
            </div>
            <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#F0FDF4", margin: 0, letterSpacing: "-0.02em" }}>
              Projects Kanban
            </h2>
            <p style={{ color: "#9EB3A8", fontSize: "14px", marginTop: "4px" }}>
              {memories.length} projects tracked • Drag and drop cards between status columns
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
            style={{ padding: "9px 20px", fontSize: "13.5px" }}
          >
            + New Project Idea
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", color: "#9EB3A8", padding: "80px" }}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }} className="animate-spin">🌲</div>
            <p style={{ fontSize: "15px", color: "#F0FDF4", fontWeight: 600 }}>Loading project board...</p>
          </div>
        ) : (
          /* Kanban board */
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", minWidth: "960px" }}>
            {columns.map((col) => {
              const colMemories = getColumnMemories(col.id);
              const isOver = dragOver === col.id;
              return (
                <div
                  key={col.id}
                  onDragOver={(e) => handleDragOver(e, col.id)}
                  onDrop={(e) => handleDrop(e, col.id)}
                  style={{
                    background: isOver ? "rgba(16, 185, 129, 0.1)" : "#0E1915",
                    border: `1px solid ${isOver ? "#10B981" : "#1F3830"}`,
                    borderRadius: "16px",
                    padding: "16px",
                    minHeight: "560px",
                    transition: "all 0.2s ease",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Column header */}
                  <div style={{
                    marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center",
                    paddingBottom: "12px", borderBottom: "1px solid #1F3830",
                  }}>
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

                  {/* Cards container */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                    {colMemories.length === 0 && !isOver && (
                      <div style={{
                        border: "1px dashed rgba(255,255,255,0.08)",
                        borderRadius: "12px",
                        padding: "32px 14px",
                        textAlign: "center",
                        color: "#5D756C",
                        fontSize: "12px",
                      }}>
                        No items in this column
                      </div>
                    )}

                    {colMemories.map((memory) => (
                      <div
                        key={memory.id}
                        draggable
                        onDragStart={() => handleDragStart(memory.id)}
                        onDragEnd={handleDragEnd}
                        style={{
                          background: "#111E1A",
                          border: `1px solid ${dragging === memory.id ? "#10B981" : "#1F3830"}`,
                          borderTopColor: "rgba(255, 255, 255, 0.08)",
                          borderRadius: "14px",
                          padding: "14px",
                          cursor: "grab",
                          transition: "all 0.2s ease",
                          opacity: dragging === memory.id ? 0.4 : 1,
                          position: "relative",
                          overflow: "hidden",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
                        }}
                        onMouseEnter={e => {
                          if (dragging !== memory.id) {
                            (e.currentTarget as HTMLDivElement).style.borderColor = col.color;
                            (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                            (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 20px rgba(0,0,0,0.5)`;
                          }
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLDivElement).style.borderColor = "#1F3830";
                          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.35)";
                        }}
                      >
                        {/* Top accent line */}
                        <div style={{
                          position: "absolute", top: 0, left: 0, right: 0, height: "3px",
                          background: col.color,
                        }} />

                        <h4 style={{ color: "#F0FDF4", fontSize: "13.5px", fontWeight: 700, marginBottom: "6px", lineHeight: 1.35 }}>
                          {memory.title}
                        </h4>
                        <p style={{
                          color: "#9EB3A8", fontSize: "12px", lineHeight: 1.5,
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
                              <span key={t} className="tag-pill" style={{ fontSize: "10px", padding: "1px 7px" }}>
                                #{t.trim()}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Status selector */}
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", borderTop: "1px solid #1F3830", paddingTop: "8px" }}>
                          {columns.map(c => (
                            <button
                              key={c.id}
                              onClick={() => handleStatusChange(memory.id, c.id)}
                              style={{
                                background: memory.project_status === c.id ? c.badgeBg : "#172923",
                                border: `1px solid ${memory.project_status === c.id ? c.color : "#1F3830"}`,
                                color: memory.project_status === c.id ? c.color : "#9EB3A8",
                                padding: "2px 6px", borderRadius: "6px",
                                fontSize: "10px", cursor: "pointer",
                                fontWeight: memory.project_status === c.id ? 700 : 400,
                                transition: "all 0.15s",
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
                        borderRadius: "14px", padding: "24px",
                        textAlign: "center", color: col.color,
                        fontSize: "12px", fontWeight: 700,
                        background: "rgba(16, 185, 129, 0.08)",
                      }}>
                        Release to move to {col.label}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showModal && (
        <UploadModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { fetchProjects(); setShowModal(false); }}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}