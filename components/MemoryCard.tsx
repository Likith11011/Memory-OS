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
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!memory) return null;

  const typeConfig: Record<string, { color: string; icon: string; label: string }> = {
    text: { color: "#6366f1", icon: "📝", label: "Note" },
    pdf: { color: "#f59e0b", icon: "📄", label: "PDF" },
    docx: { color: "#3b82f6", icon: "📘", label: "Word" },
    pptx: { color: "#8b5cf6", icon: "📊", label: "Slides" },
    image: { color: "#ec4899", icon: "🖼️", label: "Image" },
    url: { color: "#06b6d4", icon: "🌐", label: "URL" },
    youtube: { color: "#ef4444", icon: "▶️", label: "YouTube" },
    code: { color: "#10b981", icon: "💻", label: "Code" },
  };

  const categoryConfig: Record<string, { color: string; icon: string }> = {
    general: { color: "#6366f1", icon: "📌" },
    code: { color: "#10b981", icon: "💻" },
    research: { color: "#3b82f6", icon: "🔬" },
    exam: { color: "#f59e0b", icon: "📚" },
    project: { color: "#8b5cf6", icon: "🚀" },
  };

  const difficultyColors: Record<string, string> = {
    easy: "#10b981", medium: "#f59e0b", hard: "#ef4444",
  };

  const projectStatusConfig: Record<string, { color: string; label: string }> = {
    "idea": { color: "#6366f1", label: "💡 Idea" },
    "in-progress": { color: "#f59e0b", label: "🔨 In Progress" },
    "done": { color: "#10b981", label: "✅ Done" },
    "abandoned": { color: "#64748b", label: "🚫 Abandoned" },
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
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "18px",
        padding: "20px",
        position: "relative",
        overflow: "hidden",
        opacity: deleting ? 0 : 1,
        transform: deleting ? "scale(0.95)" : "scale(1)",
        transition: "opacity 0.3s ease, transform 0.3s ease, border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease",
        animationDelay: `${animationDelay}s`,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = `${config.color}44`;
        (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.055)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px ${config.color}22`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)";
        (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* Top gradient accent */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "2px",
        background: `linear-gradient(90deg, ${config.color}, ${catConfig.color}66, transparent)`,
      }} />

      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", marginBottom: "12px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "7px", flexWrap: "wrap", flex: 1 }}>
          {/* File type icon */}
          <span style={{
            background: `${config.color}18`,
            border: `1px solid ${config.color}33`,
            borderRadius: "8px", padding: "4px 8px",
            fontSize: "14px", lineHeight: 1,
          }}>
            {config.icon}
          </span>

          {/* File type label */}
          <span style={{
            color: config.color, fontSize: "10px",
            fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}>
            {config.label}
          </span>

          {/* Category badge */}
          {category !== "general" && (
            <span style={{
              background: `${catConfig.color}12`,
              border: `1px solid ${catConfig.color}28`,
              color: catConfig.color,
              fontSize: "10px", fontWeight: 600,
              padding: "2px 7px", borderRadius: "999px",
            }}>
              {catConfig.icon} {category}
            </span>
          )}

          {/* Language badge */}
          {memory.language && (
            <span style={{
              background: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.2)",
              color: "#10b981", fontSize: "10px", fontWeight: 600,
              padding: "2px 7px", borderRadius: "999px",
            }}>
              {memory.language}
            </span>
          )}

          {/* Similarity */}
          {typeof memory.similarity === "number" && (
            <span style={{
              background: "rgba(37,99,235,0.1)",
              border: "1px solid rgba(37,99,235,0.2)",
              color: "#60A5FA", fontSize: "10px", fontWeight: 600,
              padding: "2px 7px", borderRadius: "999px",
            }}>
              {memory.similarity.toFixed(1)}% match
            </span>
          )}
        </div>

        {/* Delete button */}
        {onDelete && (
          <button
            onClick={handleDelete}
            style={{
              background: confirmDelete ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.08)",
              border: `1px solid ${confirmDelete ? "rgba(239,68,68,0.5)" : "rgba(239,68,68,0.15)"}`,
              color: "#ef4444", borderRadius: "8px",
              padding: "4px 10px", fontSize: "11px",
              cursor: "pointer", flexShrink: 0,
              marginLeft: "8px",
              transition: "all 0.2s",
              fontWeight: confirmDelete ? 700 : 400,
            }}
          >
            {confirmDelete ? "Confirm?" : "Delete"}
          </button>
        )}
      </div>

      {/* Title */}
      <h3 style={{
        color: "#F8FAFC", fontSize: "14px", fontWeight: 600,
        marginBottom: "8px", lineHeight: 1.4, wordBreak: "break-word",
      }}>
        {memory.title || "Untitled"}
      </h3>

      {/* Exam specific */}
      {category === "exam" && (memory.subject || memory.difficulty) && (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
          {memory.subject && (
            <span style={{
              background: "rgba(245,158,11,0.1)",
              border: "1px solid rgba(245,158,11,0.2)",
              color: "#f59e0b", fontSize: "10px",
              padding: "2px 8px", borderRadius: "999px",
            }}>
              📖 {memory.subject}
            </span>
          )}
          {memory.difficulty && (
            <span style={{
              background: `${difficultyColors[memory.difficulty] || "#64748b"}15`,
              border: `1px solid ${difficultyColors[memory.difficulty] || "#64748b"}30`,
              color: difficultyColors[memory.difficulty] || "#64748b",
              fontSize: "10px", padding: "2px 8px", borderRadius: "999px",
              textTransform: "capitalize",
            }}>
              {memory.difficulty === "easy" ? "🟢" : memory.difficulty === "medium" ? "🟡" : "🔴"} {memory.difficulty}
            </span>
          )}
          {(memory.review_count || 0) > 0 && (
            <span style={{
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.2)",
              color: "#818cf8", fontSize: "10px",
              padding: "2px 8px", borderRadius: "999px",
            }}>
              reviewed {memory.review_count}×
            </span>
          )}
        </div>
      )}

      {/* Project specific */}
      {category === "project" && memory.project_status && (
        <div style={{ marginBottom: "8px" }}>
          <span style={{
            background: `${projectStatusConfig[memory.project_status]?.color || "#64748b"}15`,
            border: `1px solid ${projectStatusConfig[memory.project_status]?.color || "#64748b"}30`,
            color: projectStatusConfig[memory.project_status]?.color || "#64748b",
            fontSize: "10px", fontWeight: 600,
            padding: "2px 10px", borderRadius: "999px",
          }}>
            {projectStatusConfig[memory.project_status]?.label || memory.project_status}
          </span>
        </div>
      )}

      {/* Content preview */}
      <p style={{
        color: "#64748b", fontSize: "12px", lineHeight: 1.65,
        marginBottom: "14px",
        display: "-webkit-box",
        WebkitLineClamp: category === "code" ? 4 : 3,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
        wordBreak: "break-word",
        fontFamily: category === "code" ? "'Fira Code', 'Courier New', monospace" : "inherit",
      }}>
        {memory.content || "No content"}
      </p>

      {/* AI Explanation for exam */}
      {category === "exam" && (memory as any).explanation && (
        <div style={{
          background: "rgba(37,99,235,0.05)",
          border: "1px solid rgba(37,99,235,0.12)",
          borderRadius: "10px", padding: "10px 12px",
          marginBottom: "12px",
        }}>
          <p style={{
            color: "#334155", fontSize: "10px", fontWeight: 600,
            marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em",
          }}>
            🤖 AI Explanation
          </p>
          <p style={{ color: "#94A3B8", fontSize: "12px", lineHeight: 1.6, margin: 0 }}>
            {(memory as any).explanation}
          </p>
        </div>
      )}

      {/* Footer */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", flexWrap: "wrap", gap: "8px",
      }}>
        <span style={{ color: "#334155", fontSize: "11px" }}>
          {formatDate(memory.created_at)}
        </span>

        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", alignItems: "center" }}>
          {tags.slice(0, 2).map((tag) => (
            <span key={tag} className="tag-pill" style={{ cursor: "default" }}>
              #{tag}
            </span>
          ))}
          {tags.length > 2 && (
            <span style={{ color: "#334155", fontSize: "10px" }}>
              +{tags.length - 2}
            </span>
          )}

          {/* Review button for exam */}
          {category === "exam" && onReview && (
            <button
              onClick={(e) => { e.stopPropagation(); onReview(memory.id); }}
              style={{
                background: "rgba(245,158,11,0.1)",
                border: "1px solid rgba(245,158,11,0.2)",
                color: "#f59e0b", borderRadius: "6px",
                padding: "3px 8px", fontSize: "10px",
                cursor: "pointer", fontWeight: 600,
                transition: "all 0.2s",
              }}
            >
              ✓ Reviewed
            </button>
          )}
        </div>
      </div>
    </div>
  );
}