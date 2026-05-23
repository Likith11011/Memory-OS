"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMemories } from "@/lib/api";
import MemoryCard from "@/components/MemoryCard";
import Sidebar from "@/components/Sidebar";
import UploadModal from "@/components/UploadModal";
import Toast from "@/components/Toast";
import { MemoryCardSkeleton, StatSkeleton } from "@/components/Skeleton";
import api from "@/lib/api";

interface Memory {
  id: number; title: string; content: string;
  file_type: string; tags: string; created_at: string;
  memory_category?: string; language?: string;
  project_status?: string; difficulty?: string;
  subject?: string; explanation?: string; review_count?: number;
}

interface ToastState {
  message: string;
  type: "success" | "error" | "info";
}

type ViewMode = "grid" | "timeline";

function groupByDate(memories: Memory[]): Record<string, Memory[]> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const thisWeek = new Date(today); thisWeek.setDate(thisWeek.getDate() - 7);
  const thisMonth = new Date(today); thisMonth.setDate(thisMonth.getDate() - 30);
  const groups: Record<string, Memory[]> = {
    "Today": [], "Yesterday": [], "This Week": [], "This Month": [], "Earlier": [],
  };
  memories.forEach((memory) => {
    const date = new Date(memory.created_at);
    const memDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (memDate >= today) groups["Today"].push(memory);
    else if (memDate >= yesterday) groups["Yesterday"].push(memory);
    else if (date >= thisWeek) groups["This Week"].push(memory);
    else if (date >= thisMonth) groups["This Month"].push(memory);
    else groups["Earlier"].push(memory);
  });
  return Object.fromEntries(Object.entries(groups).filter(([_, v]) => v.length > 0));
}

export default function Dashboard() {
  const router = useRouter();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetchMemories();
  }, []);

  const fetchMemories = async () => {
    try {
      const data = await getMemories();
      setMemories(data.memories || []);
    } catch {
      showToast("Failed to load memories", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/memories/${id}`);
      setMemories(prev => prev.filter(m => m.id !== id));
      showToast("Memory deleted", "success");
    } catch {
      showToast("Failed to delete memory", "error");
    }
  };

  const handleUploadSuccess = () => {
    fetchMemories();
    showToast("Memory uploaded successfully!", "success");
  };

  const allTags = Array.from(new Set(
    memories.flatMap(m => m.tags ? m.tags.split(",").map(t => t.trim()).filter(Boolean) : [])
  )).sort();

  const filteredMemories = memories.filter(m => {
    if (activeTag && !m.tags?.toLowerCase().includes(activeTag.toLowerCase())) return false;
    if (searchQuery && !m.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !m.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const groupedMemories = groupByDate(filteredMemories);

  const stats = [
  { label: "Total", value: memories.length, color: "#2563EB", glow: "rgba(37,99,235,0.4)" },
  { label: "Notes", value: memories.filter(m => m.file_type === "text").length, color: "#10b981", glow: "rgba(16,185,129,0.3)" },
  { label: "PDFs", value: memories.filter(m => m.file_type === "pdf").length, color: "#f59e0b", glow: "rgba(245,158,11,0.3)" },
  { label: "Code", value: memories.filter(m => m.file_type === "code").length, color: "#10b981", glow: "rgba(16,185,129,0.3)" },
  { label: "Docs", value: memories.filter(m => m.file_type === "docx").length, color: "#60A5FA", glow: "rgba(96,165,250,0.3)" },
  { label: "Slides", value: memories.filter(m => m.file_type === "pptx").length, color: "#8b5cf6", glow: "rgba(139,92,246,0.3)" },
  { label: "Images", value: memories.filter(m => m.file_type === "image").length, color: "#ec4899", glow: "rgba(236,72,153,0.3)" },
  { label: "URLs", value: memories.filter(m => m.file_type === "url").length, color: "#06b6d4", glow: "rgba(6,182,212,0.3)" },
];

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0A1224 0%, #0d1530 100%)",
      fontFamily: "'Inter', sans-serif",
    }}>
      <Sidebar />

      <main style={{
        marginLeft: "240px",
        flex: 1,
        padding: "28px",
        boxSizing: "border-box",
        width: "calc(100% - 240px)",
        overflowX: "hidden",
      }}>

        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "12px",
        }}>
          <div>
            <h2 style={{
              fontSize: "26px", fontWeight: 700, color: "#F8FAFC",
              marginBottom: "4px", letterSpacing: "-0.02em",
            }}>
              Your Memories
            </h2>
            <p style={{ color: "#475569", fontSize: "14px" }}>
              {filteredMemories.length} of {memories.length} memories
              {activeTag && <span style={{ color: "#60A5FA" }}> tagged "{activeTag}"</span>}
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: "12px", top: "50%",
                transform: "translateY(-50%)", color: "#334155", fontSize: "14px",
              }}>⌕</span>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Quick filter..."
                className="input-glow"
                style={{
                  borderRadius: "10px", padding: "8px 14px 8px 34px",
                  fontSize: "13px", width: "160px",
                }}
              />
            </div>

            <div style={{
              display: "flex",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px", padding: "4px",
            }}>
              {(["grid", "timeline"] as ViewMode[]).map((mode) => (
                <button key={mode} onClick={() => setViewMode(mode)} style={{
                  padding: "6px 12px", borderRadius: "8px", border: "none",
                  background: viewMode === mode ? "rgba(37,99,235,0.25)" : "transparent",
                  color: viewMode === mode ? "#60A5FA" : "#475569",
                  fontSize: "12px", fontWeight: 600, cursor: "pointer",
                  transition: "all 0.2s",
                }}>
                  {mode === "grid" ? "⊞ Grid" : "☰ Timeline"}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="btn-primary"
              style={{ borderRadius: "12px", padding: "10px 20px", fontSize: "14px" }}
            >
              + Add Memory
            </button>
          </div>
        </div>

        {/* Stats - 4 columns x 2 rows */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "10px",
          marginBottom: "24px",
          width: "100%",
          boxSizing: "border-box",
        }}>
          {loading
            ? Array(8).fill(0).map((_, i) => <StatSkeleton key={i} />)
            : stats.map((stat) => (
              <div key={stat.label} style={{
                background: "rgba(255,255,255,0.04)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "14px",
                padding: "14px 8px",
                textAlign: "center",
                transition: "all 0.25s ease",
                cursor: "default",
                boxSizing: "border-box",
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.07)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = `${stat.color}33`;
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 25px rgba(0,0,0,0.25)`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                }}
              >
                <p style={{
                  color: "#475569", fontSize: "10px", marginBottom: "6px",
                  textTransform: "uppercase", letterSpacing: "0.06em",
                }}>
                  {stat.label}
                </p>
                <p style={{
                  color: stat.color, fontSize: "22px", fontWeight: 700,
                  textShadow: `0 0 20px ${stat.glow}`,
                }}>
                  {stat.value}
                </p>
              </div>
            ))
          }
        </div>

        {/* Tag filters */}
        {!loading && allTags.length > 0 && (
          <div style={{
            display: "flex", gap: "8px",
            flexWrap: "wrap", marginBottom: "20px", alignItems: "center",
          }}>
            <span style={{ color: "#334155", fontSize: "12px", fontWeight: 600 }}>Filter:</span>
            <button
              onClick={() => setActiveTag(null)}
              className={`tag-pill ${!activeTag ? "active" : ""}`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`tag-pill ${activeTag === tag ? "active" : ""}`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "16px",
          }}>
            {Array(6).fill(0).map((_, i) => (
              <MemoryCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredMemories.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "80px 20px",
            background: "rgba(255,255,255,0.02)",
            border: "1px dashed rgba(255,255,255,0.08)",
            borderRadius: "20px",
          }}>
            <div style={{ fontSize: "52px", marginBottom: "16px" }} className="animate-float">
              🧠
            </div>
            <p style={{ fontSize: "18px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>
              {activeTag ? `No memories tagged "${activeTag}"` : searchQuery ? `No results for "${searchQuery}"` : "No memories yet"}
            </p>
            <p style={{ fontSize: "14px", color: "#334155", marginBottom: "24px" }}>
              {activeTag || searchQuery ? "Try a different filter" : "Upload notes, PDFs, code, images, URLs or YouTube videos"}
            </p>
            {!activeTag && !searchQuery && (
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary"
                style={{ borderRadius: "12px", padding: "12px 28px", fontSize: "14px" }}
              >
                + Add your first memory
              </button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "16px",
          }}>
            {filteredMemories.map((memory, i) => (
              <MemoryCard
                key={memory.id}
                memory={memory}
                onDelete={handleDelete}
                animationDelay={i * 0.05}
              />
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            {Object.entries(groupedMemories).map(([group, groupMemories]) => (
              <div key={group}>
                <div style={{
                  display: "flex", alignItems: "center",
                  gap: "12px", marginBottom: "16px",
                }}>
                  <div style={{
                    width: "8px", height: "8px", borderRadius: "50%",
                    background: "#2563EB",
                    boxShadow: "0 0 10px rgba(37,99,235,0.7)",
                    flexShrink: 0,
                  }} />
                  <h3 style={{
                    color: "#60A5FA", fontSize: "12px", fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.1em", margin: 0,
                  }}>
                    {group}
                  </h3>
                  <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
                  <span style={{ color: "#334155", fontSize: "12px" }}>
                    {groupMemories.length} {groupMemories.length === 1 ? "memory" : "memories"}
                  </span>
                </div>
                <div style={{
                  display: "flex", flexDirection: "column", gap: "12px",
                  paddingLeft: "20px",
                  borderLeft: "1px solid rgba(37,99,235,0.2)",
                }}>
                  {groupMemories.map((memory, i) => (
                    <div key={memory.id} style={{ position: "relative" }}>
                      <div style={{
                        position: "absolute", left: "-25px", top: "22px",
                        width: "6px", height: "6px", borderRadius: "50%",
                        background: "rgba(37,99,235,0.6)",
                        border: "1px solid rgba(37,99,235,0.9)",
                      }} />
                      <MemoryCard
                        memory={memory}
                        onDelete={handleDelete}
                        animationDelay={i * 0.04}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <UploadModal
          onClose={() => setShowModal(false)}
          onSuccess={handleUploadSuccess}
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