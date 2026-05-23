"use client";
import { useState } from "react";
import api from "@/lib/api";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

type TabType = "text" | "pdf" | "docx" | "pptx" | "image" | "url" | "code";
type CategoryType = "general" | "code" | "research" | "exam" | "project";

interface TabConfig {
  id: TabType;
  label: string;
  icon: string;
  accept?: string;
  placeholder?: string;
}

const TABS: TabConfig[] = [
  { id: "text", label: "Text", icon: "📝", placeholder: "Paste your note, idea, or text here..." },
  { id: "code", label: "Code", icon: "💻", placeholder: "Paste your code snippet here..." },
  { id: "pdf", label: "PDF", icon: "📄", accept: ".pdf,application/pdf" },
  { id: "docx", label: "Word", icon: "📘", accept: ".docx" },
  { id: "pptx", label: "PPT", icon: "📊", accept: ".pptx" },
  { id: "image", label: "Image", icon: "🖼️", accept: ".png,.jpg,.jpeg,.webp,.bmp,.tiff,image/*" },
  { id: "url", label: "URL", icon: "🌐", placeholder: "https://example.com/article..." },
];

const CATEGORIES: { id: CategoryType; label: string; icon: string; color: string }[] = [
  { id: "general", label: "General", icon: "📌", color: "#6366f1" },
  { id: "code", label: "Code Snippet", icon: "💻", color: "#10b981" },
  { id: "research", label: "Research", icon: "🔬", color: "#3b82f6" },
  { id: "exam", label: "Exam Revision", icon: "📚", color: "#f59e0b" },
  { id: "project", label: "Project Idea", icon: "🚀", color: "#8b5cf6" },
];

const LANGUAGES = [
  "python", "javascript", "typescript", "java", "cpp", "c",
  "csharp", "go", "rust", "ruby", "php", "swift", "kotlin",
  "sql", "bash", "html", "css", "r", "other"
];

const DIFFICULTIES = ["easy", "medium", "hard"];
const PROJECT_STATUSES = ["idea", "in-progress", "done", "abandoned"];

export default function UploadModal({ onClose, onSuccess }: Props) {
  const [tab, setTab] = useState<TabType>("text");
  const [category, setCategory] = useState<CategoryType>("general");
  const [title, setTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [urlContent, setUrlContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("");
  const [projectStatus, setProjectStatus] = useState("idea");
  const [difficulty, setDifficulty] = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentTab = TABS.find(t => t.id === tab)!;
  const isFileTab = ["pdf", "docx", "pptx", "image"].includes(tab);
  const isUrlTab = tab === "url";
  const isCodeTab = tab === "code";

  const validateFile = (f: File): string => {
    if (f.size > 20 * 1024 * 1024) return "File must be under 20MB";
    if (tab === "pdf" && !f.name.toLowerCase().endsWith(".pdf")) return "Only PDF files supported";
    if (tab === "docx" && !f.name.toLowerCase().endsWith(".docx")) return "Only .docx files supported";
    if (tab === "pptx" && !f.name.toLowerCase().endsWith(".pptx")) return "Only .pptx files supported";
    if (tab === "image") {
      const validExts = ["png", "jpg", "jpeg", "webp", "bmp", "tiff"];
      const ext = f.name.split(".").pop()?.toLowerCase() || "";
      if (!validExts.includes(ext)) return "Supported: PNG, JPG, JPEG, WEBP, BMP, TIFF";
    }
    return "";
  };

  const handleTabChange = (t: TabType) => {
    setTab(t);
    setError("");
    setFile(null);
    setUrlContent("");
    setTextContent("");
    if (t === "code") setCategory("code");
    else if (t === "pdf") setCategory("research");
    else setCategory("general");
  };

  const handleCategoryChange = (c: CategoryType) => {
    setCategory(c);
    if (c === "code" && tab !== "code") setTab("code");
  };

  const handleUpload = async () => {
    setError("");
    if (!title.trim()) { setError("Title is required"); return; }
    if ((tab === "text" || isCodeTab) && !textContent.trim()) { setError("Content cannot be empty"); return; }
    if (isFileTab && !file) { setError("Please select a file"); return; }
    if (isUrlTab && !urlContent.trim()) { setError("URL cannot be empty"); return; }

    if (isUrlTab) {
      const u = urlContent.trim().toLowerCase();
      if (u.includes("youtube.com") || u.includes("youtu.be")) {
        setError("YouTube URLs are not supported. Please use a regular webpage URL.");
        return;
      }
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("file_type", tab);
      formData.append("memory_category", category);
      formData.append("language", language);
      formData.append("project_status", projectStatus);
      formData.append("difficulty", difficulty);
      formData.append("subject", subject);

      if (tab === "text" || isCodeTab) {
        formData.append("text_content", textContent.trim());
      } else if (isFileTab && file) {
        formData.append("file", file);
      } else if (isUrlTab) {
        formData.append("url_content", urlContent.trim());
      }

      await api.post("/memories/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "10px",
    padding: "10px 14px",
    color: "#f1f5f9",
    fontSize: "13px",
    outline: "none",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
  };

  const labelStyle = {
    color: "#94a3b8", fontSize: "11px", fontWeight: 600 as const,
    display: "block" as const, marginBottom: "6px",
    textTransform: "uppercase" as const, letterSpacing: "0.06em",
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 50, padding: "20px",
      }}
    >
      <div style={{
        background: "#0f0f23",
        border: "1px solid rgba(99,102,241,0.2)",
        borderRadius: "24px", padding: "28px",
        width: "100%", maxWidth: "580px",
        position: "relative",
        boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{ marginBottom: "20px", paddingRight: "40px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f1f5f9", marginBottom: "2px" }}>
            Add Memory
          </h2>
          <p style={{ color: "#475569", fontSize: "12px" }}>
            Upload from any source to your second brain
          </p>
        </div>

        {/* Close */}
        <button
          onClick={() => !loading && onClose()}
          disabled={loading}
          style={{
            position: "absolute", top: "20px", right: "20px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#64748b", borderRadius: "8px",
            width: "30px", height: "30px",
            cursor: "pointer", fontSize: "14px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >✕</button>

        {/* Category selector */}
        <div style={{ marginBottom: "20px" }}>
          <label style={labelStyle}>Memory Category</label>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                style={{
                  padding: "6px 12px", borderRadius: "8px",
                  border: `1px solid ${category === cat.id ? cat.color + "66" : "rgba(255,255,255,0.08)"}`,
                  background: category === cat.id ? cat.color + "22" : "transparent",
                  color: category === cat.id ? cat.color : "#475569",
                  fontSize: "12px", fontWeight: 600, cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex", alignItems: "center", gap: "4px",
                }}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Source type tabs */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "4px", marginBottom: "20px",
          background: "rgba(255,255,255,0.02)",
          borderRadius: "10px", padding: "4px",
          border: "1px solid rgba(255,255,255,0.05)",
        }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              disabled={loading}
              title={t.label}
              style={{
                padding: "6px 2px", borderRadius: "6px", border: "none",
                background: tab === t.id ? "rgba(99,102,241,0.25)" : "transparent",
                color: tab === t.id ? "#a5b4fc" : "#475569",
                fontSize: "16px", cursor: "pointer", transition: "all 0.2s",
                display: "flex", flexDirection: "column",
                alignItems: "center", gap: "2px",
              }}
            >
              <span>{t.icon}</span>
              <span style={{ fontSize: "8px", fontWeight: 600 }}>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Title */}
        <div style={{ marginBottom: "14px" }}>
          <label style={labelStyle}>Title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give this memory a title..."
            maxLength={255} disabled={loading}
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
          />
        </div>

        {/* Text/Code content */}
        {(tab === "text" || isCodeTab) && (
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>{isCodeTab ? "Code *" : "Content *"}</label>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder={currentTab.placeholder}
              rows={isCodeTab ? 8 : 5} disabled={loading}
              style={{
                ...inputStyle, resize: "vertical",
                fontFamily: isCodeTab ? "monospace" : "inherit",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
            />
          </div>
        )}

        {/* URL input */}
        {isUrlTab && (
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Website URL *</label>
            <input
              value={urlContent}
              onChange={(e) => setUrlContent(e.target.value)}
              placeholder="https://example.com/article..."
              disabled={loading}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
            />
            <p style={{ color: "#475569", fontSize: "11px", marginTop: "4px" }}>
              Extracts readable text from any webpage or article
            </p>
          </div>
        )}

        {/* File upload */}
        {isFileTab && (
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>{currentTab.label} File * (max 20MB)</label>
            <div
              onClick={() => !loading && document.getElementById(`file-input-${tab}`)?.click()}
              style={{
                border: `2px dashed ${file ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.1)"}`,
                borderRadius: "10px", padding: "20px", textAlign: "center",
                cursor: loading ? "not-allowed" : "pointer",
                background: file ? "rgba(99,102,241,0.05)" : "transparent",
              }}
            >
              <div style={{ fontSize: "28px", marginBottom: "6px" }}>{currentTab.icon}</div>
              <p style={{ color: file ? "#a5b4fc" : "#64748b", fontSize: "13px", wordBreak: "break-all" }}>
                {file ? file.name : `Click to select ${currentTab.label} file`}
              </p>
              {file && (
                <p style={{ color: "#475569", fontSize: "11px", marginTop: "4px" }}>
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              )}
            </div>
            <input
              id={`file-input-${tab}`}
              type="file" accept={currentTab.accept}
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  const err = validateFile(f);
                  if (err) { setError(err); return; }
                  setError(""); setFile(f);
                }
                e.target.value = "";
              }}
            />
          </div>
        )}

        {/* Category specific fields */}
        {category === "code" && (
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Programming Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="">Auto-detect</option>
              {LANGUAGES.map(l => (
                <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
              ))}
            </select>
          </div>
        )}

        {category === "exam" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "14px" }}>
            <div>
              <label style={labelStyle}>Subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Data Structures, Machine Learning"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
              />
            </div>
            <div>
              <label style={labelStyle}>Difficulty Level</label>
              <div style={{ display: "flex", gap: "8px" }}>
                {[
                  { id: "easy", label: "Easy", icon: "🟢", desc: "Simple language", color: "#10b981" },
                  { id: "medium", label: "Medium", icon: "🟡", desc: "Professor level", color: "#f59e0b" },
                  { id: "hard", label: "Hard", icon: "🔴", desc: "Textbook level", color: "#ef4444" },
                ].map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDifficulty(d.id)}
                    style={{
                      flex: 1, padding: "10px 6px", borderRadius: "10px",
                      border: `1px solid ${difficulty === d.id ? d.color + "66" : "rgba(255,255,255,0.08)"}`,
                      background: difficulty === d.id ? d.color + "18" : "transparent",
                      color: difficulty === d.id ? d.color : "#475569",
                      fontSize: "12px", fontWeight: 600, cursor: "pointer",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                    }}
                  >
                    <span style={{ fontSize: "18px" }}>{d.icon}</span>
                    <span>{d.label}</span>
                    <span style={{ fontSize: "10px", opacity: 0.7, fontWeight: 400 }}>{d.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {category === "project" && (
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Project Status</label>
            <div style={{ display: "flex", gap: "8px" }}>
              {PROJECT_STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => setProjectStatus(s)}
                  style={{
                    flex: 1, padding: "8px 4px", borderRadius: "8px",
                    border: `1px solid ${projectStatus === s ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.08)"}`,
                    background: projectStatus === s ? "rgba(99,102,241,0.2)" : "transparent",
                    color: projectStatus === s ? "#a5b4fc" : "#475569",
                    fontSize: "11px", fontWeight: 600, cursor: "pointer",
                    textTransform: "capitalize",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#f87171", borderRadius: "8px",
            padding: "10px 14px", fontSize: "13px", marginBottom: "14px",
          }}>
            ⚠ {error}
          </div>
        )}

        {/* Upload button */}
        <button
          onClick={handleUpload} disabled={loading}
          style={{
            width: "100%",
            background: loading ? "rgba(99,102,241,0.4)" : "linear-gradient(135deg, #6366f1, #4f46e5)",
            border: "none", borderRadius: "12px", padding: "13px",
            color: loading ? "rgba(255,255,255,0.5)" : "white",
            fontSize: "14px", fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: !loading ? "0 0 20px rgba(99,102,241,0.3)" : "none",
          }}
        >
          {loading ? "Processing..." : `Upload ${currentTab.icon} Memory`}
        </button>
      </div>
    </div>
  );
}