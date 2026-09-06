"use client";
import { useState } from "react";

interface Memory {
  id: number;
  title: string;
  content: string;
  file_type: string;
  tags?: string;
  similarity?: number | null;
  created_at: string;
  memory_category?: string;
  language?: string;
  project_status?: string;
  difficulty?: string;
  subject?: string;
  explanation?: string;
  review_count?: number;
}

interface Props {
  memory: Memory;
  onDelete?: (id: number) => void;
  onReview?: (id: number) => void;
  animationDelay?: number;
}

export default function MemoryCard({ memory, onDelete, onReview, animationDelay = 0 }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!memory) return null;

  const typeConfig: Record<string, { color: string; bg: string; icon: string; label: string }> = {
    text: { color: "#059669", bg: "#ECFDF5", icon: "📝", label: "Note" },
    pdf: { color: "#D97706", bg: "#FEF3C7", icon: "📄", label: "PDF" },
    docx: { color: "#2563EB", bg: "#EFF6FF", icon: "📘", label: "Word" },
    pptx: { color: "#7C3AED", bg: "#F5F3FF", icon: "📊", label: "Slides" },
    image: { color: "#DB2777", bg: "#FDF2F8", icon: "🖼️", label: "Image" },
    url: { color: "#0891B2", bg: "#ECFEFF", icon: "🌐", label: "URL" },
    code: { color: "#059669", bg: "#ECFDF5", icon: "💻", label: "Code" },
  };

  const categoryConfig: Record<string, { color: string; bg: string; icon: string }> = {
    general: { color: "#059669", bg: "#ECFDF5", icon: "📌" },
    code: { color: "#059669", bg: "#ECFDF5", icon: "💻" },
    research: { color: "#2563EB", bg: "#EFF6FF", icon: "🔬" },
    exam: { color: "#D97706", bg: "#FEF3C7", icon: "📚" },
    project: { color: "#7C3AED", bg: "#F5F3FF", icon: "🚀" },
  };

  const difficultyColors: Record<string, { color: string; bg: string; border: string }> = {
    easy: { color: "#059669", bg: "#ECFDF5", border: "#D1FAE5" },
    medium: { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
    hard: { color: "#DC2626", bg: "#FEF2F2", border: "#FEE2E2" },
  };

  const projectStatusConfig: Record<string, { color: string; bg: string; label: string }> = {
    "idea": { color: "#2563EB", bg: "#EFF6FF", label: "💡 Idea" },
    "in-progress": { color: "#D97706", bg: "#FFFBEB", label: "🔨 In Progress" },
    "done": { color: "#059669", bg: "#ECFDF5", label: "✅ Done" },
    "abandoned": { color: "#7A8A84", bg: "#F1F5F3", label: "🚫 Abandoned" },
  };

  const fileType = memory.file_type?.toLowerCase() || "text";
  const config = typeConfig[fileType] || typeConfig.text;
  const category = memory.memory_category || "general";
  const catConfig = categoryConfig[category] || categoryConfig.general;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (days === 0) return "Today";
      if (days === 1) return "Yesterday";
      if (days < 7) return `${days} days ago`;
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch { return ""; }
  };

  const tags = memory.tags
    ? memory.tags.split(",").map(t => t.trim()).filter(Boolean)
    : [];

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    setDeleting(true);
    onDelete?.(memory.id);
  };

  return (
    <div
      className="memory-card animate-fadeInUp"
      style={{
        background: "#FFFFFF",
        border: "1px solid #DDE7E2",
        borderRadius: "16px",
        padding: "20px",
        position: "relative",
        overflow: "hidden",
        opacity: deleting ? 0 : 1,
        transition: "opacity 0.25s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",
        animationDelay: `${animationDelay}s`,
      }}
    >
      {/* Top subtle emerald border accent */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "3px",
        background: `linear-gradient(90deg, ${config.color}99, #10B981 40%, transparent)`,
      }} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", flex: 1 }}>
          <span style={{
            background: config.bg,
            border: `1px solid ${config.color}22`,
            borderRadius: "7px", padding: "3px 7px", fontSize: "13px",
          }}>
            {config.icon}
          </span>
          <span style={{ color: config.color, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {config.label}
          </span>
          {category !== "general" && (
            <span style={{
              background: catConfig.bg,
              border: `1px solid ${catConfig.color}22`,
              color: catConfig.color, fontSize: "11px", fontWeight: 600,
              padding: "2px 8px", borderRadius: "999px",
            }}>
              {catConfig.icon} {category}
            </span>
          )}
          {memory.language && (
            <span style={{
              background: "#ECFDF5", border: "1px solid #D1FAE5",
              color: "#065F46", fontSize: "11px", fontWeight: 600,
              padding: "2px 8px", borderRadius: "999px",
            }}>
              {memory.language}
            </span>
          )}
          {typeof memory.similarity === "number" && (
            <span style={{
              background: "#ECFDF5", border: "1px solid #A7F3D0",
              color: "#059669", fontSize: "11px", fontWeight: 700,
              padding: "2px 8px", borderRadius: "999px",
            }}>
              {memory.similarity.toFixed(1)}% match
            </span>
          )}
        </div>

        {onDelete && (
          <button
            onClick={handleDelete}
            style={{
              background: confirmDelete ? "#FEE2E2" : "transparent",
              border: `1px solid ${confirmDelete ? "#FCA5A5" : "transparent"}`,
              color: "#DC2626", borderRadius: "8px",
              padding: "3px 8px", fontSize: "11px",
              cursor: "pointer", flexShrink: 0, marginLeft: "8px",
              transition: "all 0.15s", fontWeight: confirmDelete ? 700 : 500,
            }}
            onMouseEnter={e => {
              if (!confirmDelete) {
                e.currentTarget.style.background = "#FEF2F2";
                e.currentTarget.style.borderColor = "#FEE2E2";
              }
            }}
            onMouseLeave={e => {
              if (!confirmDelete) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "transparent";
              }
            }}
          >
            {confirmDelete ? "Confirm?" : "Delete"}
          </button>
        )}
      </div>

      {/* Title */}
      <h3 style={{
        color: "#064E3B", fontSize: "15px", fontWeight: 700,
        marginBottom: "8px", lineHeight: 1.35, wordBreak: "break-word",
      }}>
        {memory.title || "Untitled"}
      </h3>

      {/* Exam info */}
      {category === "exam" && (memory.subject || memory.difficulty) && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "10px" }}>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {memory.subject && (
              <span style={{
                background: "#FEF3C7", border: "1px solid #FDE68A",
                color: "#92400E", fontSize: "11px", padding: "2px 8px", borderRadius: "999px",
                fontWeight: 500,
              }}>
                📖 {memory.subject}
              </span>
            )}
            {memory.difficulty && (
              <span style={{
                background: difficultyColors[memory.difficulty]?.bg || "#F1F5F3",
                border: `1px solid ${difficultyColors[memory.difficulty]?.border || "#DDE7E2"}`,
                color: difficultyColors[memory.difficulty]?.color || "#52635C",
                fontSize: "11px", padding: "2px 8px", borderRadius: "999px", textTransform: "capitalize",
                fontWeight: 600,
              }}>
                {memory.difficulty === "easy" ? "🟢" : memory.difficulty === "medium" ? "🟡" : "🔴"} {memory.difficulty}
              </span>
            )}
            {(memory.review_count || 0) > 0 && (
              <span style={{
                background: "#ECFDF5", border: "1px solid #D1FAE5",
                color: "#059669", fontSize: "11px", padding: "2px 8px", borderRadius: "999px",
                fontWeight: 500,
              }}>
                reviewed {memory.review_count}×
              </span>
            )}
          </div>
          {memory.explanation && (
            <div style={{
              background: "#F8FAF9", border: "1px solid #DDE7E2",
              borderRadius: "10px", padding: "10px 12px",
            }}>
              <p style={{ color: "#064E3B", fontSize: "11px", fontWeight: 700, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                🤖 AI Explanation
              </p>
              <p style={{ color: "#52635C", fontSize: "12px", lineHeight: 1.55, margin: 0 }}>
                {memory.explanation}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Project status */}
      {category === "project" && memory.project_status && (
        <div style={{ marginBottom: "8px" }}>
          <span style={{
            background: projectStatusConfig[memory.project_status]?.bg || "#F1F5F3",
            border: `1px solid #DDE7E2`,
            color: projectStatusConfig[memory.project_status]?.color || "#52635C",
            fontSize: "11px", fontWeight: 600, padding: "2px 10px", borderRadius: "999px",
          }}>
            {projectStatusConfig[memory.project_status]?.label || memory.project_status}
          </span>
        </div>
      )}

      {/* Content */}
      <p style={{
        color: "#52635C", fontSize: "13px", lineHeight: 1.6, marginBottom: "14px",
        display: "-webkit-box", WebkitLineClamp: category === "code" ? 4 : 3,
        WebkitBoxOrient: "vertical", overflow: "hidden", wordBreak: "break-word",
        fontFamily: category === "code" ? "'Fira Code', 'Courier New', monospace" : "inherit",
        background: category === "code" ? "#F8FAF9" : "transparent",
        padding: category === "code" ? "8px 10px" : 0,
        borderRadius: category === "code" ? "8px" : 0,
        border: category === "code" ? "1px solid #DDE7E2" : "none",
      }}>
        {memory.content || "No content"}
      </p>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
        <span style={{ color: "#7A8A84", fontSize: "11px", fontWeight: 500 }}>
          {formatDate(memory.created_at)}
        </span>
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", alignItems: "center" }}>
          {tags.slice(0, 2).map((tag) => (
            <span key={tag} className="tag-pill" style={{ cursor: "default" }}>
              #{tag}
            </span>
          ))}
          {tags.length > 2 && (
            <span style={{ color: "#7A8A84", fontSize: "11px", fontWeight: 500 }}>+{tags.length - 2}</span>
          )}
          {category === "exam" && onReview && (
            <button
              onClick={(e) => { e.stopPropagation(); onReview(memory.id); }}
              style={{
                background: "#ECFDF5", border: "1px solid #D1FAE5",
                color: "#059669", borderRadius: "6px", padding: "3px 8px",
                fontSize: "11px", cursor: "pointer", fontWeight: 600,
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#D1FAE5"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#ECFDF5"; }}
            >
              ✓ Reviewed
            </button>
          )}
        </div>
      </div>
    </div>
  );
}