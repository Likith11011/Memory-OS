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
    { label: "Total", value: memories.length, color: "#064E3B", bg: "#ECFDF5" },
    { label: "Notes", value: memories.filter(m => m.file_type === "text").length, color: "#059669", bg: "#ECFDF5" },
    { label: "PDFs", value: memories.filter(m => m.file_type === "pdf").length, color: "#D97706", bg: "#FEF3C7" },
    { label: "Code", value: memories.filter(m => m.file_type === "code").length, color: "#059669", bg: "#ECFDF5" },
    { label: "Docs", value: memories.filter(m => m.file_type === "docx").length, color: "#2563EB", bg: "#EFF6FF" },
    { label: "Slides", value: memories.filter(m => m.file_type === "pptx").length, color: "#7C3AED", bg: "#F5F3FF" },
    { label: "Images", value: memories.filter(m => m.file_type === "image").length, color: "#DB2777", bg: "#FDF2F8" },
    { label: "URLs", value: memories.filter(m => m.file_type === "url").length, color: "#0891B2", bg: "#ECFEFF" },
  ];

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: "#F8FAF9",
      color: "#10231D",
      fontFamily: "'Inter', sans-serif",
    }}>
      <Sidebar />

      <main style={{
        marginLeft: "240px",
        flex: 1,
        padding: "32px",
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
          gap: "14px",
        }}>
          <div>
            <h2 style={{
              fontSize: "26px", fontWeight: 800, color: "#064E3B",
              marginBottom: "4px", letterSpacing: "-0.02em",
            }}>
              Your Knowledge Base
            </h2>
            <p style={{ color: "#52635C", fontSize: "13.5px" }}>
              {filteredMemories.length} of {memories.length} memories stored
              {activeTag && <span style={{ color: "#059669", fontWeight: 600 }}> • tagged "#{activeTag}"</span>}
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: "12px", top: "50%",
                transform: "translateY(-50%)", color: "#7A8A84", fontSize: "14px",
              }}>⌕</span>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Filter notes..."
                className="input-field"
                style={{
                  padding: "8px 14px 8px 34px",
                  fontSize: "13px", width: "160px",
                }}
              />
            </div>

            <div style={{
              display: "flex",
              background: "#F1F5F3",
              border: "1px solid #DDE7E2",
              borderRadius: "10px", padding: "3px",
            }}>
              {(["grid", "timeline"] as ViewMode[]).map((mode) => {
                const active = viewMode === mode;
                return (
                  <button key={mode} onClick={() => setViewMode(mode)} style={{
                    padding: "6px 12px", borderRadius: "7px", border: "none",
                    background: active ? "#FFFFFF" : "transparent",
                    color: active ? "#064E3B" : "#52635C",
                    fontSize: "12px", fontWeight: active ? 700 : 500, cursor: "pointer",
                    transition: "all 0.15s",
                    boxShadow: active ? "0 1px 3px rgba(16,35,29,0.06)" : "none",
                  }}>
                    {mode === "grid" ? "⊞ Grid" : "☰ Timeline"}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="btn-primary"
              style={{ padding: "9px 18px", fontSize: "13.5px" }}
            >
              + Add Memory
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px",
          marginBottom: "24px",
          width: "100%",
          boxSizing: "border-box",
        }}>
          {loading
            ? Array(8).fill(0).map((_, i) => <StatSkeleton key={i} />)
            : stats.map((stat) => (
              <div key={stat.label} style={{
                background: "#FFFFFF",
                border: "1px solid #DDE7E2",
                borderRadius: "14px",
                padding: "14px 10px",
                textAlign: "center",
                transition: "all 0.2s ease",
                cursor: "default",
                boxSizing: "border-box",
                boxShadow: "0 1px 3px rgba(16, 35, 29, 0.02)",
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "#B5D1C5";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 6px 16px rgba(6,78,59,0.05)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "#DDE7E2";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 3px rgba(16, 35, 29, 0.02)";
                }}
              >
                <p style={{
                  color: "#7A8A84", fontSize: "11px", marginBottom: "4px",
                  textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600,
                }}>
                  {stat.label}
                </p>
                <p style={{
                  color: stat.color, fontSize: "22px", fontWeight: 800,
                  lineHeight: 1.1,
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
            flexWrap: "wrap", marginBottom: "22px", alignItems: "center",
          }}>
            <span style={{ color: "#7A8A84", fontSize: "12px", fontWeight: 600 }}>Filter by tag:</span>
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
            gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
            gap: "16px",
          }}>
            {Array(6).fill(0).map((_, i) => (
              <MemoryCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredMemories.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "70px 20px",
            background: "#FFFFFF",
            border: "1px dashed #DDE7E2",
            borderRadius: "20px",
            boxShadow: "0 1px 3px rgba(16, 35, 29, 0.02)",
          }}>
            <div style={{ fontSize: "48px", marginBottom: "14px" }} className="animate-float">
              🌲
            </div>
            <p style={{ fontSize: "18px", fontWeight: 700, color: "#064E3B", marginBottom: "6px" }}>
              {activeTag ? `No memories tagged "${activeTag}"` : searchQuery ? `No results for "${searchQuery}"` : "Your digital knowledge forest is empty"}
            </p>
            <p style={{ fontSize: "13.5px", color: "#52635C", marginBottom: "22px", maxWidth: "460px", margin: "0 auto 22px" }}>
              {activeTag || searchQuery ? "Try adjusting your search query or tag filter" : "Upload notes, PDFs, code snippets, research articles, or links to get started."}
            </p>
            {!activeTag && !searchQuery && (
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary"
                style={{ padding: "12px 28px", fontSize: "14px" }}
              >
                + Add your first memory
              </button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
            gap: "16px",
          }}>
            {filteredMemories.map((memory, i) => (
              <MemoryCard
                key={memory.id}
                memory={memory}
                onDelete={handleDelete}
                animationDelay={i * 0.04}
              />
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            {Object.entries(groupedMemories).map(([group, groupMemories]) => (
              <div key={group}>
                <div style={{
                  display: "flex", alignItems: "center",
                  gap: "12px", marginBottom: "14px",
                }}>
                  <div style={{
                    width: "8px", height: "8px", borderRadius: "50%",
                    background: "#059669",
                    boxShadow: "0 0 6px rgba(5,150,105,0.6)",
                    flexShrink: 0,
                  }} />
                  <h3 style={{
                    color: "#064E3B", fontSize: "12px", fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.08em", margin: 0,
                  }}>
                    {group}
                  </h3>
                  <div style={{ flex: 1, height: "1px", background: "#DDE7E2" }} />
                  <span style={{ color: "#7A8A84", fontSize: "12px", fontWeight: 500 }}>
                    {groupMemories.length} {groupMemories.length === 1 ? "memory" : "memories"}
                  </span>
                </div>
                <div style={{
                  display: "flex", flexDirection: "column", gap: "12px",
                  paddingLeft: "18px",
                  borderLeft: "2px solid #D1FAE5",
                }}>
                  {groupMemories.map((memory, i) => (
                    <div key={memory.id} style={{ position: "relative" }}>
                      <div style={{
                        position: "absolute", left: "-23px", top: "24px",
                        width: "8px", height: "8px", borderRadius: "50%",
                        background: "#FFFFFF",
                        border: "2px solid #059669",
                      }} />
                      <MemoryCard
                        memory={memory}
                        onDelete={handleDelete}
                        animationDelay={i * 0.03}
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