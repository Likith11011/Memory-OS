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
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [greeting, setGreeting] = useState("Welcome back");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetchMemories();
  }, []);

  // Keyboard shortcut cmd+k
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        router.push("/search");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

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
    showToast("Memory indexed into knowledge base!", "success");
  };

  const allTags = Array.from(new Set(
    memories.flatMap(m => m.tags ? m.tags.split(",").map(t => t.trim()).filter(Boolean) : [])
  )).sort();

  const filteredMemories = memories.filter(m => {
    if (activeCategory && (m.memory_category || "general") !== activeCategory) return false;
    if (activeTag && !m.tags?.toLowerCase().includes(activeTag.toLowerCase())) return false;
    if (searchQuery && !m.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !m.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const groupedMemories = groupByDate(filteredMemories);

  const stats = [
    { label: "Total Knowledge", value: memories.length, color: "#34D399", icon: "🧠" },
    { label: "Notes & Docs", value: memories.filter(m => ["text", "docx"].includes(m.file_type)).length, color: "#10B981", icon: "📝" },
    { label: "Research PDFs", value: memories.filter(m => m.file_type === "pdf").length, color: "#FBBF24", icon: "📄" },
    { label: "Code Snippets", value: memories.filter(m => m.file_type === "code").length, color: "#38BDF8", icon: "💻" },
  ];

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: "#09110E",
      color: "#F0FDF4",
      fontFamily: "'Inter', sans-serif",
    }}>
      <Sidebar />

      <main style={{
        marginLeft: "250px",
        flex: 1,
        padding: "32px 40px",
        boxSizing: "border-box",
        width: "calc(100% - 250px)",
        overflowX: "hidden",
      }}>

        {/* Top Greeting & Action Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "28px",
          flexWrap: "wrap",
          gap: "16px",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "14px", color: "#10B981", fontWeight: 600 }}>🌲 {greeting}, Explorer</span>
            </div>
            <h2 style={{
              fontSize: "28px", fontWeight: 800, color: "#F0FDF4",
              margin: 0, letterSpacing: "-0.02em",
            }}>
              Knowledge Dashboard
            </h2>
            <p style={{ color: "#9EB3A8", fontSize: "13.5px", marginTop: "4px" }}>
              {filteredMemories.length} of {memories.length} total memories active in vector index
            </p>
          </div>

          {/* Quick Action Controls */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: "12px", top: "50%",
                transform: "translateY(-50%)", color: "#5D756C", fontSize: "14px",
              }}>⌕</span>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Filter memory titles..."
                className="input-field"
                style={{
                  padding: "8px 14px 8px 34px",
                  fontSize: "13px", width: "190px",
                }}
              />
            </div>

            <div style={{
              display: "flex",
              background: "#0E1915",
              border: "1px solid #1F3830",
              borderRadius: "10px", padding: "3px",
            }}>
              {(["grid", "timeline"] as ViewMode[]).map((mode) => {
                const active = viewMode === mode;
                return (
                  <button key={mode} onClick={() => setViewMode(mode)} style={{
                    padding: "6px 12px", borderRadius: "7px", border: "none",
                    background: active ? "#172923" : "transparent",
                    color: active ? "#34D399" : "#9EB3A8",
                    fontSize: "12px", fontWeight: active ? 700 : 500, cursor: "pointer",
                    transition: "all 0.15s",
                    boxShadow: active ? "0 1px 4px rgba(0,0,0,0.5)" : "none",
                  }}>
                    {mode === "grid" ? "⊞ Grid" : "☰ Timeline"}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="btn-primary"
              style={{ padding: "9px 20px", fontSize: "13.5px" }}
            >
              + Add Memory
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "14px",
          marginBottom: "28px",
          width: "100%",
          boxSizing: "border-box",
        }}>
          {loading
            ? Array(4).fill(0).map((_, i) => <StatSkeleton key={i} />)
            : stats.map((stat) => (
              <div key={stat.label} style={{
                background: "#111E1A",
                border: "1px solid #1F3830",
                borderTopColor: "rgba(255, 255, 255, 0.08)",
                borderRadius: "16px",
                padding: "18px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                cursor: "default",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.35)",
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "#10B981";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(16, 185, 129, 0.15)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "#1F3830";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.35)";
                }}
              >
                <div>
                  <p style={{
                    color: "#9EB3A8", fontSize: "11px", marginBottom: "6px",
                    textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600,
                  }}>
                    {stat.label}
                  </p>
                  <p style={{
                    color: stat.color, fontSize: "26px", fontWeight: 800,
                    lineHeight: 1, margin: 0,
                  }}>
                    {stat.value}
                  </p>
                </div>
                <div style={{
                  width: "42px", height: "42px", borderRadius: "12px",
                  background: "rgba(16, 185, 129, 0.08)",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "20px",
                }}>
                  {stat.icon}
                </div>
              </div>
            ))
          }
        </div>

        {/* Category & Tag Filter Bar */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: "12px", marginBottom: "22px",
        }}>
          {/* Category Tabs */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {[
              { id: null, label: "All Items", icon: "🌐" },
              { id: "general", label: "Notes", icon: "📌" },
              { id: "code", label: "Code", icon: "💻" },
              { id: "research", label: "Research", icon: "🔬" },
              { id: "exam", label: "Exam Cards", icon: "📚" },
              { id: "project", label: "Projects", icon: "🚀" },
            ].map((cat) => {
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.label}
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    padding: "6px 14px", borderRadius: "10px", fontSize: "12px", fontWeight: 600,
                    cursor: "pointer", border: "1px solid",
                    background: active ? "rgba(16, 185, 129, 0.16)" : "#111E1A",
                    borderColor: active ? "#10B981" : "#1F3830",
                    color: active ? "#34D399" : "#9EB3A8",
                    transition: "all 0.18s ease",
                    display: "inline-flex", alignItems: "center", gap: "6px",
                  }}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tags List */}
          {!loading && allTags.length > 0 && (
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ color: "#5D756C", fontSize: "11px", fontWeight: 600 }}>TAGS:</span>
              {allTags.slice(0, 6).map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className={`tag-pill ${activeTag === tag ? "active" : ""}`}
                >
                  #{tag}
                </button>
              ))}
              {allTags.length > 6 && (
                <span style={{ color: "#5D756C", fontSize: "11px" }}>+{allTags.length - 6} more</span>
              )}
            </div>
          )}
        </div>

        {/* Content Section */}
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
            background: "#111E1A",
            border: "1px dashed #1F3830",
            borderRadius: "20px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
          }}>
            <div style={{ fontSize: "48px", marginBottom: "14px" }} className="animate-float">
              🌲
            </div>
            <p style={{ fontSize: "18px", fontWeight: 700, color: "#F0FDF4", marginBottom: "6px" }}>
              {activeTag ? `No memories tagged "#${activeTag}"` : activeCategory ? `No memories in ${activeCategory} category` : searchQuery ? `No results for "${searchQuery}"` : "Your digital knowledge forest is empty"}
            </p>
            <p style={{ fontSize: "13.5px", color: "#9EB3A8", marginBottom: "22px", maxWidth: "460px", margin: "0 auto 22px" }}>
              {activeTag || searchQuery || activeCategory ? "Try clearing your filters or search keywords" : "Upload notes, PDFs, code snippets, research articles, or links to build your AI memory."}
            </p>
            {!activeTag && !searchQuery && !activeCategory ? (
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary"
                style={{ padding: "12px 28px", fontSize: "14px" }}
              >
                + Add your first memory
              </button>
            ) : (
              <button
                onClick={() => { setActiveTag(null); setActiveCategory(null); setSearchQuery(""); }}
                className="btn-secondary"
                style={{ padding: "8px 20px", fontSize: "13px" }}
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
            gap: "18px",
          }}>
            {filteredMemories.map((memory, i) => (
              <MemoryCard
                key={memory.id}
                memory={memory}
                onDelete={handleDelete}
                animationDelay={i * 0.03}
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
                    background: "#10B981",
                    boxShadow: "0 0 8px #10B981",
                    flexShrink: 0,
                  }} />
                  <h3 style={{
                    color: "#F0FDF4", fontSize: "12px", fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.08em", margin: 0,
                  }}>
                    {group}
                  </h3>
                  <div style={{ flex: 1, height: "1px", background: "#1F3830" }} />
                  <span style={{ color: "#9EB3A8", fontSize: "12px", fontWeight: 500 }}>
                    {groupMemories.length} {groupMemories.length === 1 ? "memory" : "memories"}
                  </span>
                </div>
                <div style={{
                  display: "flex", flexDirection: "column", gap: "12px",
                  paddingLeft: "18px",
                  borderLeft: "2px solid #1F3830",
                }}>
                  {groupMemories.map((memory, i) => (
                    <div key={memory.id} style={{ position: "relative" }}>
                      <div style={{
                        position: "absolute", left: "-23px", top: "24px",
                        width: "8px", height: "8px", borderRadius: "50%",
                        background: "#111E1A",
                        border: "2px solid #10B981",
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