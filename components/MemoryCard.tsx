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
    text: { color: "#10B981", bg: "rgba(16, 185, 129, 0.12)", icon: "📝", label: "Note" },
    pdf: { color: "#F59E0B", bg: "rgba(245, 158, 11, 0.12)", icon: "📄", label: "PDF" },
    docx: { color: "#38BDF8", bg: "rgba(56, 189, 248, 0.12)", icon: "📘", label: "Word" },
    pptx: { color: "#A78BFA", bg: "rgba(167, 139, 250, 0.12)", icon: "📊", label: "Slides" },
    image: { color: "#F472B6", bg: "rgba(244, 114, 182, 0.12)", icon: "🖼️", label: "Image" },
    url: { color: "#2DD4BF", bg: "rgba(45, 212, 191, 0.12)", icon: "🌐", label: "URL" },
    code: { color: "#34D399", bg: "rgba(52, 211, 153, 0.12)", icon: "💻", label: "Code" },
  };

  const categoryConfig: Record<string, { color: string; bg: string; icon: string }> = {
    general: { color: "#10B981", bg: "rgba(16, 185, 129, 0.12)", icon: "📌" },
    code: { color: "#34D399", bg: "rgba(52, 211, 153, 0.12)", icon: "💻" },
    research: { color: "#38BDF8", bg: "rgba(56, 189, 248, 0.12)", icon: "🔬" },
    exam: { color: "#F59E0B", bg: "rgba(245, 158, 11, 0.12)", icon: "📚" },
    project: { color: "#A78BFA", bg: "rgba(167, 139, 250, 0.12)", icon: "🚀" },
  };

  const difficultyColors: Record<string, { color: string; bg: string; border: string }> = {
    easy: { color: "#34D399", bg: "rgba(52, 211, 153, 0.12)", border: "rgba(52, 211, 153, 0.3)" },
    medium: { color: "#FBBF24", bg: "rgba(251, 191, 36, 0.12)", border: "rgba(251, 191, 36, 0.3)" },
    hard: { color: "#F87171", bg: "rgba(248, 113, 113, 0.12)", border: "rgba(248, 113, 113, 0.3)" },
  };

  const projectStatusConfig: Record<string, { color: string; bg: string; label: string }> = {
    "idea": { color: "#38BDF8", bg: "rgba(56, 189, 248, 0.12)", label: "💡 Idea" },
    "in-progress": { color: "#FBBF24", bg: "rgba(251, 191, 36, 0.12)", label: "🔨 In Progress" },
    "done": { color: "#34D399", bg: "rgba(52, 211, 153, 0.12)", label: "✅ Done" },
    "abandoned": { color: "#94A3B8", bg: "rgba(148, 163, 184, 0.12)", label: "🚫 Abandoned" },
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
        background: "#111E1A",
        border: "1px solid #1F3830",
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
        background: `linear-gradient(90deg, ${config.color}, #10B981 50%, transparent)`,
      }} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", flex: 1 }}>
          <span style={{
            background: config.bg,
            border: `1px solid ${config.color}33`,
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
              border: `1px solid ${catConfig.color}33`,
              color: catConfig.color, fontSize: "11px", fontWeight: 600,
              padding: "2px 8px", borderRadius: "999px",
            }}>
              {catConfig.icon} {category}
            </span>
          )}
          {memory.language && (
            <span style={{
              background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.25)",
              color: "#34D399", fontSize: "11px", fontWeight: 600,
              padding: "2px 8px", borderRadius: "999px",
            }}>
              {memory.language}
            </span>
          )}
          {typeof memory.similarity === "number" && (
            <span style={{
              background: "rgba(16, 185, 129, 0.15)", border: "1px solid #10B981",
              color: "#34D399", fontSize: "11px", fontWeight: 700,
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
              background: confirmDelete ? "rgba(239, 68, 68, 0.2)" : "transparent",
              border: `1px solid ${confirmDelete ? "#EF4444" : "transparent"}`,
              color: "#F87171", borderRadius: "8px",
              padding: "3px 8px", fontSize: "11px",
              cursor: "pointer", flexShrink: 0, marginLeft: "8px",
              transition: "all 0.15s", fontWeight: confirmDelete ? 700 : 500,
            }}
            onMouseEnter={e => {
              if (!confirmDelete) {
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.12)";
                e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.25)";
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
        color: "#F0FDF4", fontSize: "15px", fontWeight: 700,
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
                background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.3)",
                color: "#FBBF24", fontSize: "11px", padding: "2px 8px", borderRadius: "999px",
                fontWeight: 500,
              }}>
                📖 {memory.subject}
              </span>
            )}
            {memory.difficulty && (
              <span style={{
                background: difficultyColors[memory.difficulty]?.bg || "#172923",
                border: `1px solid ${difficultyColors[memory.difficulty]?.border || "#1F3830"}`,
                color: difficultyColors[memory.difficulty]?.color || "#9EB3A8",
                fontSize: "11px", padding: "2px 8px", borderRadius: "999px", textTransform: "capitalize",
                fontWeight: 600,
              }}>
                {memory.difficulty === "easy" ? "🟢" : memory.difficulty === "medium" ? "🟡" : "🔴"} {memory.difficulty}
              </span>
            )}
            {(memory.review_count || 0) > 0 && (
              <span style={{
                background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.25)",
                color: "#34D399", fontSize: "11px", padding: "2px 8px", borderRadius: "999px",
                fontWeight: 500,
              }}>
                reviewed {memory.review_count}×
              </span>
            )}
          </div>
          {memory.explanation && (
            <div style={{
              background: "#0E1915", border: "1px solid #1F3830",
              borderRadius: "10px", padding: "10px 12px",
            }}>
              <p style={{ color: "#34D399", fontSize: "11px", fontWeight: 700, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                🤖 AI Explanation
              </p>
              <p style={{ color: "#9EB3A8", fontSize: "12px", lineHeight: 1.55, margin: 0 }}>
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
            background: projectStatusConfig[memory.project_status]?.bg || "#172923",
            border: `1px solid #1F3830`,
            color: projectStatusConfig[memory.project_status]?.color || "#9EB3A8",
            fontSize: "11px", fontWeight: 600, padding: "2px 10px", borderRadius: "999px",
          }}>
            {projectStatusConfig[memory.project_status]?.label || memory.project_status}
          </span>
        </div>
      )}

      {/* Content */}
      <p style={{
        color: "#9EB3A8", fontSize: "13px", lineHeight: 1.6, marginBottom: "14px",
        display: "-webkit-box", WebkitLineClamp: category === "code" ? 4 : 3,
        WebkitBoxOrient: "vertical", overflow: "hidden", wordBreak: "break-word",
        fontFamily: category === "code" ? "'Fira Code', 'Courier New', monospace" : "inherit",
        background: category === "code" ? "#09110E" : "transparent",
        padding: category === "code" ? "8px 10px" : 0,
        borderRadius: category === "code" ? "8px" : 0,
        border: category === "code" ? "1px solid #1F3830" : "none",
      }}>
        {memory.content || "No content"}
      </p>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
        <span style={{ color: "#5D756C", fontSize: "11px", fontWeight: 500 }}>
          {formatDate(memory.created_at)}
        </span>
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", alignItems: "center" }}>
          {tags.slice(0, 2).map((tag) => (
            <span key={tag} className="tag-pill" style={{ cursor: "default" }}>
              #{tag}
            </span>
          ))}
          {tags.length > 2 && (
            <span style={{ color: "#5D756C", fontSize: "11px", fontWeight: 500 }}>+{tags.length - 2}</span>
          )}
          {category === "exam" && onReview && (
            <button
              onClick={(e) => { e.stopPropagation(); onReview(memory.id); }}
              style={{
                background: "rgba(16, 185, 129, 0.14)", border: "1px solid rgba(16, 185, 129, 0.3)",
                color: "#34D399", borderRadius: "6px", padding: "3px 8px",
                fontSize: "11px", cursor: "pointer", fontWeight: 600,
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(16, 185, 129, 0.25)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(16, 185, 129, 0.14)"; }}
            >
              ✓ Reviewed
            </button>
          )}
        </div>
      </div>
    </div>
  );
}