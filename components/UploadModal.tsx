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
    background: "#FFFFFF",
    border: "1px solid #DDE7E2",
    borderRadius: "10px",
    padding: "10px 14px",
    color: "#10231D",
    fontSize: "13.5px",
    outline: "none",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
    transition: "all 0.18s ease",
  };

  const labelStyle = {
    color: "#064E3B", fontSize: "11px", fontWeight: 700 as const,
    display: "block" as const, marginBottom: "6px",
    textTransform: "uppercase" as const, letterSpacing: "0.06em",
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(2, 44, 34, 0.45)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 50, padding: "20px",
      }}
    >
      <div style={{
        background: "#FFFFFF",
        border: "1px solid #DDE7E2",
        borderRadius: "20px", padding: "28px",
        width: "100%", maxWidth: "580px",
        position: "relative",
        boxShadow: "0 20px 45px rgba(6, 78, 59, 0.12), 0 4px 12px rgba(16, 35, 29, 0.04)",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{ marginBottom: "20px", paddingRight: "40px" }}>
          <h2 style={{ fontSize: "19px", fontWeight: 700, color: "#064E3B", marginBottom: "2px" }}>
            Add Memory
          </h2>
          <p style={{ color: "#52635C", fontSize: "13px" }}>
            Store notes, documents, and code into your personal knowledge base
          </p>
        </div>

        {/* Close */}
        <button
          onClick={() => !loading && onClose()}
          disabled={loading}
          aria-label="Close modal"
          style={{
            position: "absolute", top: "20px", right: "20px",
            background: "#F1F5F3",
            border: "1px solid #DDE7E2",
            color: "#52635C", borderRadius: "8px",
            width: "32px", height: "32px",
            cursor: "pointer", fontSize: "13px",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "#10231D"; e.currentTarget.style.background = "#E2ECE7"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#52635C"; e.currentTarget.style.background = "#F1F5F3"; }}
        >✕</button>

        {/* Category selector */}
        <div style={{ marginBottom: "18px" }}>
          <label style={labelStyle}>Memory Category</label>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {CATEGORIES.map((cat) => {
              const active = category === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  style={{
                    padding: "6px 12px", borderRadius: "8px",
                    border: active ? "1px solid #059669" : "1px solid #DDE7E2",
                    background: active ? "#ECFDF5" : "#FFFFFF",
                    color: active ? "#064E3B" : "#52635C",
                    fontSize: "12px", fontWeight: active ? 700 : 500, cursor: "pointer",
                    transition: "all 0.15s",
                    display: "flex", alignItems: "center", gap: "5px",
                  }}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Source type tabs */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "4px", marginBottom: "18px",
          background: "#F1F5F3",
          borderRadius: "12px", padding: "4px",
          border: "1px solid #DDE7E2",
        }}>
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleTabChange(t.id)}
                disabled={loading}
                title={t.label}
                style={{
                  padding: "7px 2px", borderRadius: "8px", border: "none",
                  background: active ? "#FFFFFF" : "transparent",
                  color: active ? "#064E3B" : "#7A8A84",
                  fontSize: "15px", cursor: "pointer", transition: "all 0.15s",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", gap: "2px",
                  boxShadow: active ? "0 1px 3px rgba(16,35,29,0.06)" : "none",
                }}
              >
                <span>{t.icon}</span>
                <span style={{ fontSize: "9px", fontWeight: active ? 700 : 500 }}>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Title */}
        <div style={{ marginBottom: "14px" }}>
          <label style={labelStyle}>Title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give this memory a clear title..."
            maxLength={255} disabled={loading}
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = "#059669"; e.target.style.boxShadow = "0 0 0 3px rgba(5,150,105,0.12)"; }}
            onBlur={e => { e.target.style.borderColor = "#DDE7E2"; e.target.style.boxShadow = "none"; }}
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
                fontFamily: isCodeTab ? "'Fira Code', 'Courier New', monospace" : "inherit",
              }}
              onFocus={e => { e.target.style.borderColor = "#059669"; e.target.style.boxShadow = "0 0 0 3px rgba(5,150,105,0.12)"; }}
              onBlur={e => { e.target.style.borderColor = "#DDE7E2"; e.target.style.boxShadow = "none"; }}
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
              onFocus={e => { e.target.style.borderColor = "#059669"; e.target.style.boxShadow = "0 0 0 3px rgba(5,150,105,0.12)"; }}
              onBlur={e => { e.target.style.borderColor = "#DDE7E2"; e.target.style.boxShadow = "none"; }}
            />
            <p style={{ color: "#7A8A84", fontSize: "11.5px", marginTop: "5px" }}>
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
                border: `2px dashed ${file ? "#059669" : "#A7F3D0"}`,
                borderRadius: "14px", padding: "24px 20px", textAlign: "center",
                cursor: loading ? "not-allowed" : "pointer",
                background: file ? "#ECFDF5" : "#F8FAF9",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "#ECFDF5"; (e.currentTarget as HTMLDivElement).style.borderColor = "#059669"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = file ? "#ECFDF5" : "#F8FAF9"; (e.currentTarget as HTMLDivElement).style.borderColor = file ? "#059669" : "#A7F3D0"; }}
            >
              <div style={{ fontSize: "32px", marginBottom: "6px" }}>{currentTab.icon}</div>
              <p style={{ color: file ? "#064E3B" : "#10231D", fontSize: "13.5px", fontWeight: 600, wordBreak: "break-all" }}>
                {file ? file.name : `Click or drag to select ${currentTab.label} file`}
              </p>
              <p style={{ color: "#7A8A84", fontSize: "11px", marginTop: "4px" }}>
                {file ? `${(file.size / 1024).toFixed(1)} KB` : "PDF • TXT • DOCX • Code"}
              </p>
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
                onFocus={e => { e.target.style.borderColor = "#059669"; e.target.style.boxShadow = "0 0 0 3px rgba(5,150,105,0.12)"; }}
                onBlur={e => { e.target.style.borderColor = "#DDE7E2"; e.target.style.boxShadow = "none"; }}
              />
            </div>
            <div>
              <label style={labelStyle}>Difficulty Level</label>
              <div style={{ display: "flex", gap: "8px" }}>
                {[
                  { id: "easy", label: "Easy", icon: "🟢", desc: "Simple language", color: "#059669" },
                  { id: "medium", label: "Medium", icon: "🟡", desc: "Professor level", color: "#D97706" },
                  { id: "hard", label: "Hard", icon: "🔴", desc: "Textbook level", color: "#DC2626" },
                ].map((d) => {
                  const active = difficulty === d.id;
                  return (
                    <button
                      key={d.id}
                      onClick={() => setDifficulty(d.id)}
                      style={{
                        flex: 1, padding: "9px 6px", borderRadius: "10px",
                        border: active ? `1px solid ${d.color}` : "1px solid #DDE7E2",
                        background: active ? "#F8FAF9" : "#FFFFFF",
                        color: active ? d.color : "#52635C",
                        fontSize: "12px", fontWeight: 600, cursor: "pointer",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
                        transition: "all 0.15s",
                      }}
                    >
                      <span style={{ fontSize: "16px" }}>{d.icon}</span>
                      <span>{d.label}</span>
                      <span style={{ fontSize: "10px", color: "#7A8A84", fontWeight: 400 }}>{d.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {category === "project" && (
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Project Status</label>
            <div style={{ display: "flex", gap: "8px" }}>
              {PROJECT_STATUSES.map(s => {
                const active = projectStatus === s;
                return (
                  <button
                    key={s}
                    onClick={() => setProjectStatus(s)}
                    style={{
                      flex: 1, padding: "8px 4px", borderRadius: "8px",
                      border: active ? "1px solid #059669" : "1px solid #DDE7E2",
                      background: active ? "#ECFDF5" : "#FFFFFF",
                      color: active ? "#064E3B" : "#52635C",
                      fontSize: "11.5px", fontWeight: active ? 700 : 500, cursor: "pointer",
                      textTransform: "capitalize",
                      transition: "all 0.15s",
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: "#FEF2F2",
            border: "1px solid #FEE2E2",
            color: "#DC2626", borderRadius: "10px",
            padding: "10px 14px", fontSize: "13px", marginBottom: "14px",
            fontWeight: 500,
          }}>
            ⚠ {error}
          </div>
        )}

        {/* Upload button */}
        <button
          onClick={handleUpload} disabled={loading}
          className="btn-primary"
          style={{
            width: "100%",
            padding: "13px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Processing..." : `Upload ${currentTab.icon} Memory`}
        </button>
      </div>
    </div>
  );
}