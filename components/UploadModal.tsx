"use client";
import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  defaultCategory?: CategoryType;
}

type IngestionChannel = "text" | "code" | "document" | "url";
type CategoryType = "general" | "code" | "research" | "exam" | "project";
type DocumentSubtype = "pdf" | "docx" | "pptx" | "image";

const CHANNELS: { id: IngestionChannel; label: string; icon: string; desc: string }[] = [
  { id: "text", label: "Note & Idea", icon: "✍️", desc: "Markdown & freeform notes" },
  { id: "code", label: "Code Snippet", icon: "💻", desc: "Syntax & algorithms" },
  { id: "document", label: "Document / File", icon: "📁", desc: "PDF, Word, Slides, Image" },
  { id: "url", label: "Web Link", icon: "🌐", desc: "Articles & docs" },
];

const CATEGORIES: { id: CategoryType; label: string; icon: string; color: string; hint: string }[] = [
  { id: "general", label: "General", icon: "📌", color: "#10B981", hint: "General knowledge & everyday thoughts" },
  { id: "code", label: "Code & Snippets", icon: "💻", color: "#34D399", hint: "Code snippets, scripts & technical references" },
  { id: "research", label: "Research & Papers", icon: "🔬", color: "#38BDF8", hint: "Academic papers, literature & deep dives" },
  { id: "exam", label: "Exam & Revision", icon: "📚", color: "#FBBF24", hint: "Active recall study notes & flashcards" },
  { id: "project", label: "Project Idea", icon: "🚀", color: "#A78BFA", hint: "Sprint tasks, backlog ideas & milestones" },
];

const POPULAR_LANGS = ["python", "typescript", "javascript", "cpp", "go", "rust", "java", "sql", "html", "css"];

const ALL_LANGS = [
  "python", "javascript", "typescript", "java", "cpp", "c",
  "csharp", "go", "rust", "ruby", "php", "swift", "kotlin",
  "sql", "bash", "html", "css", "r", "yaml", "json", "other"
];

const DIFFICULTIES = [
  { id: "easy", label: "Easy", icon: "🟢", desc: "Core concepts & fundamentals", color: "#34D399" },
  { id: "medium", label: "Medium", icon: "🟡", desc: "Applied & problem-solving", color: "#FBBF24" },
  { id: "hard", label: "Hard", icon: "🔴", desc: "Deep theoretical / advanced", color: "#F87171" },
];

const PROJECT_STATUSES = [
  { id: "idea", label: "💡 Idea", color: "#38BDF8" },
  { id: "in-progress", label: "🔨 In Progress", color: "#FBBF24" },
  { id: "done", label: "✅ Done", color: "#34D399" },
  { id: "abandoned", label: "🚫 Archived", color: "#94A3B8" },
];

export default function UploadModal({ onClose, onSuccess, defaultCategory }: Props) {
  const [channel, setChannel] = useState<IngestionChannel>(defaultCategory === "code" ? "code" : "text");
  const [category, setCategory] = useState<CategoryType>(defaultCategory || "general");
  const [title, setTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [urlContent, setUrlContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [detectedDocType, setDetectedDocType] = useState<DocumentSubtype>("pdf");
  const [language, setLanguage] = useState(defaultCategory === "code" ? "python" : "");
  const [projectStatus, setProjectStatus] = useState("idea");
  const [difficulty, setDifficulty] = useState("medium");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [showMetadataTray, setShowMetadataTray] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loading, onClose]);

  // Channel switch helper
  const handleChannelSwitch = (ch: IngestionChannel) => {
    setChannel(ch);
    setError("");
    if (ch === "code") {
      setCategory("code");
      if (!language) setLanguage("python");
    } else if (ch === "document") {
      if (category === "code") setCategory("research");
    }
  };

  // Detect file type and auto-populate title if empty
  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.size > 20 * 1024 * 1024) {
      setError("File must be under 20MB");
      return;
    }

    const name = selectedFile.name;
    const ext = name.split(".").pop()?.toLowerCase() || "";

    let subType: DocumentSubtype = "pdf";
    if (ext === "docx") subType = "docx";
    else if (ext === "pptx") subType = "pptx";
    else if (["png", "jpg", "jpeg", "webp", "bmp", "tiff"].includes(ext)) subType = "image";
    else if (ext === "pdf") subType = "pdf";
    else {
      setError("Supported file formats: PDF, DOCX, PPTX, PNG, JPG, WEBP");
      return;
    }

    setError("");
    setFile(selectedFile);
    setDetectedDocType(subType);

    // Auto-generate clean title from filename if title is empty
    if (!title.trim()) {
      const cleanTitle = name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setTitle(cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1));
    }
  };

  // Smart code editor keydown handler: auto-indentation, block expansion, bracket pairing, multi-line tab/shift-tab
  const handleCodeKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const value = target.value;

    // 1. AUTO-INDENTATION ON ENTER
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      // Find start of the current line
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const currentLine = value.substring(lineStart, start);

      // Match leading whitespace
      const match = currentLine.match(/^(\s*)/);
      let indent = match ? match[1] : "";

      // Check if line ends with a block opening symbol (: in python, { in c/js/java, ( in lisp/calls, [ in arrays)
      const trimmedBeforeCursor = currentLine.trimEnd();
      const isBlockOpen =
        trimmedBeforeCursor.endsWith(":") ||
        trimmedBeforeCursor.endsWith("{") ||
        trimmedBeforeCursor.endsWith("(") ||
        trimmedBeforeCursor.endsWith("[");

      const isBetweenBrackets =
        (value[start - 1] === "{" && value[start] === "}") ||
        (value[start - 1] === "(" && value[start] === ")") ||
        (value[start - 1] === "[" && value[start] === "]");

      if (isBetweenBrackets) {
        // Expand:
        // {
        //   |cursor
        // }
        const extraIndent = "  ";
        const newText = "\n" + indent + extraIndent + "\n" + indent;
        const newCursorPos = start + 1 + indent.length + extraIndent.length;

        target.value = value.substring(0, start) + newText + value.substring(end);
        target.selectionStart = target.selectionEnd = newCursorPos;
        setTextContent(target.value);
        return;
      }

      if (isBlockOpen) {
        indent += "  ";
      }

      const insertion = "\n" + indent;
      target.value = value.substring(0, start) + insertion + value.substring(end);
      target.selectionStart = target.selectionEnd = start + insertion.length;
      setTextContent(target.value);
      return;
    }

    // 2. TAB & SHIFT+TAB (Single line & Multi-line)
    if (e.key === "Tab") {
      e.preventDefault();

      if (start !== end) {
        // Multi-line selection indent/outdent
        const lineStart = value.lastIndexOf("\n", start - 1) + 1;
        const lineEnd = value.indexOf("\n", end) === -1 ? value.length : value.indexOf("\n", end);
        const selectedText = value.substring(lineStart, lineEnd);
        const lines = selectedText.split("\n");

        if (e.shiftKey) {
          // Outdent 2 spaces
          const newLines = lines.map(line => line.startsWith("  ") ? line.slice(2) : line.startsWith(" ") ? line.slice(1) : line);
          const replacement = newLines.join("\n");
          target.value = value.substring(0, lineStart) + replacement + value.substring(lineEnd);
          target.selectionStart = lineStart;
          target.selectionEnd = lineStart + replacement.length;
        } else {
          // Indent 2 spaces
          const newLines = lines.map(line => "  " + line);
          const replacement = newLines.join("\n");
          target.value = value.substring(0, lineStart) + replacement + value.substring(lineEnd);
          target.selectionStart = lineStart;
          target.selectionEnd = lineStart + replacement.length;
        }
        setTextContent(target.value);
        return;
      }

      if (e.shiftKey) {
        // Single cursor Shift+Tab outdent
        const lineStart = value.lastIndexOf("\n", start - 1) + 1;
        const linePrefix = value.substring(lineStart, start);
        if (linePrefix.endsWith("  ")) {
          target.value = value.substring(0, start - 2) + value.substring(start);
          target.selectionStart = target.selectionEnd = start - 2;
          setTextContent(target.value);
        } else if (linePrefix.endsWith(" ")) {
          target.value = value.substring(0, start - 1) + value.substring(start);
          target.selectionStart = target.selectionEnd = start - 1;
          setTextContent(target.value);
        }
        return;
      }

      // Normal single cursor Tab -> insert 2 spaces
      target.value = value.substring(0, start) + "  " + value.substring(end);
      target.selectionStart = target.selectionEnd = start + 2;
      setTextContent(target.value);
      return;
    }

    // 3. SMART BACKSPACE (Delete 2 spaces if in indentation)
    if (e.key === "Backspace" && start === end) {
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const linePrefix = value.substring(lineStart, start);
      if (linePrefix.length >= 2 && linePrefix.endsWith("  ") && linePrefix.trim() === "") {
        e.preventDefault();
        target.value = value.substring(0, start - 2) + value.substring(start);
        target.selectionStart = target.selectionEnd = start - 2;
        setTextContent(target.value);
        return;
      }
    }

    // 4. AUTO-CLOSING BRACKETS & QUOTES
    const pairs: Record<string, string> = {
      "(": ")",
      "[": "]",
      "{": "}",
      '"': '"',
      "'": "'",
      "`": "`",
    };

    if (pairs[e.key]) {
      const closeChar = pairs[e.key];

      // If text is selected, wrap it
      if (start !== end) {
        e.preventDefault();
        const selected = value.substring(start, end);
        target.value = value.substring(0, start) + e.key + selected + closeChar + value.substring(end);
        target.selectionStart = start + 1;
        target.selectionEnd = end + 1;
        setTextContent(target.value);
        return;
      }

      // If quote or backtick and cursor is right before that same char, skip over
      if (['"', "'", "`"].includes(e.key) && value[start] === e.key) {
        e.preventDefault();
        target.selectionStart = target.selectionEnd = start + 1;
        return;
      }

      // Insert pair
      e.preventDefault();
      target.value = value.substring(0, start) + e.key + closeChar + value.substring(end);
      target.selectionStart = target.selectionEnd = start + 1;
      setTextContent(target.value);
      return;
    }

    // Skip over closing bracket if typed
    if ([")", "]", "}"].includes(e.key) && value[start] === e.key) {
      e.preventDefault();
      target.selectionStart = target.selectionEnd = start + 1;
      return;
    }
  };

  // Smart markdown note keydown handler: auto list continuation (- , * , 1. )
  const handleTextKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      if (start !== end) return;
      const value = target.value;

      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const currentLine = value.substring(lineStart, start);

      // Bullet list item
      const bulletMatch = currentLine.match(/^(\s*)([-*•])\s+/);
      if (bulletMatch) {
        e.preventDefault();
        const indent = bulletMatch[1];
        const symbol = bulletMatch[2];
        const itemContent = currentLine.substring(bulletMatch[0].length);

        if (itemContent.trim() === "") {
          // Empty item -> terminate list
          target.value = value.substring(0, lineStart) + value.substring(start);
          target.selectionStart = target.selectionEnd = lineStart;
        } else {
          // Continue bullet list
          const insertion = "\n" + indent + symbol + " ";
          target.value = value.substring(0, start) + insertion + value.substring(end);
          target.selectionStart = target.selectionEnd = start + insertion.length;
        }
        setTextContent(target.value);
        return;
      }

      // Numbered list item
      const numMatch = currentLine.match(/^(\s*)(\d+)\.\s+/);
      if (numMatch) {
        e.preventDefault();
        const indent = numMatch[1];
        const num = parseInt(numMatch[2], 10);
        const itemContent = currentLine.substring(numMatch[0].length);

        if (itemContent.trim() === "") {
          // Empty item -> terminate list
          target.value = value.substring(0, lineStart) + value.substring(start);
          target.selectionStart = target.selectionEnd = lineStart;
        } else {
          // Continue numbered list
          const insertion = "\n" + indent + (num + 1) + ". ";
          target.value = value.substring(0, start) + insertion + value.substring(end);
          target.selectionStart = target.selectionEnd = start + insertion.length;
        }
        setTextContent(target.value);
        return;
      }
    }
  };

  const handleUpload = async () => {
    setError("");
    if (!title.trim()) {
      setError("Please give your memory a title");
      titleInputRef.current?.focus();
      return;
    }

    if ((channel === "text" || channel === "code") && !textContent.trim()) {
      setError(channel === "code" ? "Please paste your code snippet" : "Please enter memory content");
      return;
    }

    if (channel === "document" && !file) {
      setError("Please select or drop a file to upload");
      return;
    }

    if (channel === "url") {
      const u = urlContent.trim();
      if (!u) {
        setError("Please enter a valid website URL");
        return;
      }
      if (u.includes("youtube.com") || u.includes("youtu.be")) {
        setError("YouTube links are not supported yet. Please provide an article or documentation URL.");
        return;
      }
      if (!u.startsWith("http://") && !u.startsWith("https://")) {
        setUrlContent("https://" + u);
      }
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      
      // Determine backend file_type
      let backendFileType = "text";
      if (channel === "code") backendFileType = "code";
      else if (channel === "url") backendFileType = "url";
      else if (channel === "document") backendFileType = detectedDocType;

      formData.append("file_type", backendFileType);
      formData.append("memory_category", category);
      formData.append("language", channel === "code" ? (language || "other") : "");
      formData.append("project_status", category === "project" ? projectStatus : "");
      formData.append("difficulty", category === "exam" ? difficulty : "");
      formData.append("subject", category === "exam" ? subject.trim() : "");

      if (channel === "text" || channel === "code") {
        formData.append("text_content", textContent.trim());
      } else if (channel === "document" && file) {
        formData.append("file", file);
      } else if (channel === "url") {
        formData.append("url_content", urlContent.trim().startsWith("http") ? urlContent.trim() : "https://" + urlContent.trim());
      }

      await api.post("/memories/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 90000,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Upload failed. Please check network.");
    } finally {
      setLoading(false);
    }
  };

  // Word count & read time estimates
  const wordCount = textContent.trim() ? textContent.trim().split(/\s+/).length : 0;
  const charCount = textContent.length;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(3, 7, 5, 0.8)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 50, padding: "20px",
      }}
    >
      <div
        className="glass-card animate-scaleIn"
        style={{
          background: "#111E1A",
          border: "1px solid #1F3830",
          borderTopColor: "rgba(255, 255, 255, 0.14)",
          borderRadius: "20px",
          width: "100%", maxWidth: "620px",
          position: "relative",
          boxShadow: "0 28px 70px rgba(0, 0, 0, 0.65), 0 0 40px rgba(16, 185, 129, 0.12)",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Modal Top Bar */}
        <div style={{
          padding: "20px 24px 16px",
          borderBottom: "1px solid #1F3830",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          background: "linear-gradient(180deg, rgba(23, 41, 35, 0.5) 0%, transparent 100%)",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "8px",
                background: "linear-gradient(135deg, #059669 0%, #10B981 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "14px", color: "#FFFFFF", boxShadow: "0 2px 8px rgba(16, 185, 129, 0.35)",
              }}>
                🧠
              </div>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#F0FDF4", margin: 0 }}>
                Add Knowledge Memory
              </h2>
            </div>
            <p style={{ color: "#9EB3A8", fontSize: "12.5px", margin: 0 }}>
              Ingest notes, snippets, or documents into your AI neural vector store
            </p>
          </div>

          <button
            onClick={() => !loading && onClose()}
            disabled={loading}
            aria-label="Close modal"
            style={{
              background: "#172923",
              border: "1px solid #1F3830",
              color: "#9EB3A8", borderRadius: "8px",
              width: "30px", height: "30px",
              cursor: "pointer", fontSize: "13px",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "#F0FDF4"; e.currentTarget.style.background = "#1F3830"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#9EB3A8"; e.currentTarget.style.background = "#172923"; }}
          >✕</button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "18px" }}>
          
          {/* Step 1: Ingestion Mode Segmented Controller */}
          <div>
            <label style={{ color: "#34D399", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>
              1. Ingestion Source
            </label>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "6px",
              background: "#0E1915",
              padding: "4px",
              borderRadius: "12px",
              border: "1px solid #1F3830",
            }}>
              {CHANNELS.map((ch) => {
                const active = channel === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => handleChannelSwitch(ch.id)}
                    disabled={loading}
                    style={{
                      padding: "8px 6px",
                      borderRadius: "9px",
                      border: active ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid transparent",
                      background: active ? "rgba(16, 185, 129, 0.14)" : "transparent",
                      color: active ? "#34D399" : "#9EB3A8",
                      fontSize: "12px",
                      fontWeight: active ? 700 : 500,
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "3px",
                      transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                      boxShadow: active ? "0 2px 8px rgba(0,0,0,0.35)" : "none",
                    }}
                  >
                    <span style={{ fontSize: "16px" }}>{ch.icon}</span>
                    <span style={{ whiteSpace: "nowrap" }}>{ch.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Title Input */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label style={{ color: "#34D399", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                2. Memory Title *
              </label>
              <span style={{ fontSize: "11px", color: "#5D756C" }}>{title.length}/255</span>
            </div>
            <input
              ref={titleInputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Distributed Consensus in Raft, Transformers Architecture..."
              maxLength={255}
              disabled={loading}
              className="input-field"
              style={{
                width: "100%", padding: "10px 14px", fontSize: "13.5px",
              }}
            />
          </div>

          {/* Step 3: Dynamic Ingestion Canvas */}
          <div>
            <label style={{ color: "#34D399", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px" }}>
              3. Content Payload *
            </label>

            {/* CHANNEL A: Note & Idea */}
            {channel === "text" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  onKeyDown={handleTextKeyDown}
                  placeholder="Paste your notes, lecture transcript, thoughts, or markdown text here..."
                  rows={6}
                  disabled={loading}
                  className="input-field"
                  style={{
                    width: "100%", padding: "12px 14px", fontSize: "13.5px", lineHeight: 1.55, resize: "vertical",
                  }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", color: "#5D756C", fontSize: "11px", padding: "0 2px" }}>
                  <span>Markdown formatting supported (**bold**, - bullets, # headings)</span>
                  <span>{wordCount} words • {charCount} chars</span>
                </div>
              </div>
            )}

            {/* CHANNEL B: Code Snippet */}
            {channel === "code" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {/* Language pills + dropdown */}
                <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "11px", color: "#9EB3A8", fontWeight: 600 }}>Lang:</span>
                  {POPULAR_LANGS.slice(0, 5).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLanguage(l)}
                      style={{
                        padding: "2px 8px", borderRadius: "6px",
                        fontSize: "11px", cursor: "pointer",
                        border: language === l ? "1px solid #10B981" : "1px solid #1F3830",
                        background: language === l ? "rgba(16,185,129,0.18)" : "#0E1915",
                        color: language === l ? "#34D399" : "#9EB3A8",
                        fontWeight: language === l ? 700 : 500,
                      }}
                    >
                      {l}
                    </button>
                  ))}
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    style={{
                      marginLeft: "auto",
                      background: "#0E1915", border: "1px solid #1F3830",
                      borderRadius: "6px", color: "#F0FDF4",
                      fontSize: "11px", padding: "3px 8px", outline: "none", cursor: "pointer",
                    }}
                  >
                    <option value="">Other Language...</option>
                    {ALL_LANGS.map(l => (
                      <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                    ))}
                  </select>
                </div>

                {/* Code Textarea */}
                <div style={{ position: "relative" }}>
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    onKeyDown={handleCodeKeyDown}
                    placeholder={`// Paste your ${language || 'code'} snippet here...\nfunction example() {\n  return "Fast vector search";\n}`}
                    rows={7}
                    disabled={loading}
                    className="input-field"
                    style={{
                      width: "100%", padding: "12px 14px", fontSize: "13px",
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                      lineHeight: 1.5, resize: "vertical",
                      background: "#0A120F",
                    }}
                  />
                  <span className="kbd-badge" style={{ position: "absolute", bottom: "10px", right: "12px", fontSize: "10px" }}>
                    Tab indent supported
                  </span>
                </div>
              </div>
            )}

            {/* CHANNEL C: Document / File Upload */}
            {channel === "document" && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg,.webp,.bmp,.tiff"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelect(f);
                    e.target.value = "";
                  }}
                />

                {!file ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      const f = e.dataTransfer.files?.[0];
                      if (f) handleFileSelect(f);
                    }}
                    onClick={() => !loading && fileInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${dragOver ? "#10B981" : "#1F3830"}`,
                      borderRadius: "14px",
                      padding: "28px 20px",
                      textAlign: "center",
                      cursor: loading ? "not-allowed" : "pointer",
                      background: dragOver ? "rgba(16, 185, 129, 0.12)" : "#0E1915",
                      transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  >
                    <div style={{ fontSize: "36px", marginBottom: "8px" }} className="animate-float">📁</div>
                    <p style={{ color: "#F0FDF4", fontSize: "14px", fontWeight: 600, margin: "0 0 4px" }}>
                      Click to browse or drag & drop file
                    </p>
                    <p style={{ color: "#9EB3A8", fontSize: "12px", margin: "0 0 10px" }}>
                      PDF, Microsoft Word (.docx), PowerPoint (.pptx), Images (PNG, JPG, WEBP)
                    </p>
                    <div style={{ display: "inline-flex", gap: "6px" }}>
                      {["PDF", "DOCX", "PPTX", "IMAGE"].map(ext => (
                        <span key={ext} className="tag-pill" style={{ fontSize: "10px", padding: "1px 6px" }}>
                          {ext}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background: "#0E1915",
                    border: "1px solid #10B981",
                    borderRadius: "14px",
                    padding: "16px 18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                      <div style={{
                        width: "40px", height: "40px", borderRadius: "10px",
                        background: "rgba(16, 185, 129, 0.15)",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "20px", flexShrink: 0,
                      }}>
                        {detectedDocType === "pdf" ? "📄" : detectedDocType === "docx" ? "📘" : detectedDocType === "pptx" ? "📊" : "🖼️"}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ color: "#F0FDF4", fontSize: "13.5px", fontWeight: 700, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {file.name}
                        </p>
                        <p style={{ color: "#34D399", fontSize: "11.5px", margin: "2px 0 0" }}>
                          {(file.size / (1024 * 1024)).toFixed(2)} MB • {detectedDocType.toUpperCase()} Ready for indexing
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setFile(null)}
                      style={{
                        background: "rgba(239, 68, 68, 0.15)",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        color: "#F87171",
                        borderRadius: "8px",
                        padding: "6px 10px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      ✕ Remove
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* CHANNEL D: Web Link / URL */}
            {channel === "url" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#10B981" }}>🌐</span>
                  <input
                    value={urlContent}
                    onChange={(e) => setUrlContent(e.target.value)}
                    placeholder="https://en.wikipedia.org/wiki/Neural_network or documentation link..."
                    disabled={loading}
                    className="input-field"
                    style={{ width: "100%", padding: "10px 14px 10px 36px", fontSize: "13.5px" }}
                  />
                </div>
                <p style={{ color: "#5D756C", fontSize: "11.5px", margin: 0 }}>
                  ⚡ MemoryOS will scrape, clean, and convert the page content into vectorized knowledge chunks.
                </p>
              </div>
            )}
          </div>

          {/* Step 4: Category & Adaptive Meta Tray */}
          <div style={{
            background: "#0E1915",
            border: "1px solid #1F3830",
            borderRadius: "14px",
            padding: "14px 16px",
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: "10px",
            }}>
              <label style={{ color: "#34D399", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
                4. Target Category
              </label>
              <button
                type="button"
                onClick={() => setShowMetadataTray(!showMetadataTray)}
                style={{ background: "transparent", border: "none", color: "#9EB3A8", fontSize: "11px", cursor: "pointer" }}
              >
                {showMetadataTray ? "Hide Details ▲" : "Configure Meta ▼"}
              </button>
            </div>

            {/* Category Chips */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: showMetadataTray ? "12px" : "0" }}>
              {CATEGORIES.map((cat) => {
                const active = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    style={{
                      padding: "5px 10px", borderRadius: "8px",
                      border: active ? "1px solid #10B981" : "1px solid #1F3830",
                      background: active ? "rgba(16, 185, 129, 0.16)" : "#111E1A",
                      color: active ? "#34D399" : "#9EB3A8",
                      fontSize: "12px", fontWeight: active ? 700 : 500, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: "5px",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Adaptive Category Meta Fields */}
            {showMetadataTray && (
              <div style={{ borderTop: "1px solid #1F3830", paddingTop: "12px" }} className="animate-fadeIn">
                {/* Exam Settings */}
                {category === "exam" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div>
                      <label style={{ color: "#9EB3A8", fontSize: "11px", fontWeight: 600, display: "block", marginBottom: "4px" }}>
                        Subject or Course Name
                      </label>
                      <input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g. Operating Systems, CS101, Data Science"
                        className="input-field"
                        style={{ width: "100%", padding: "7px 12px", fontSize: "12.5px" }}
                      />
                    </div>
                    <div>
                      <label style={{ color: "#9EB3A8", fontSize: "11px", fontWeight: 600, display: "block", marginBottom: "4px" }}>
                        Exam Difficulty Level
                      </label>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
                        {DIFFICULTIES.map((d) => {
                          const active = difficulty === d.id;
                          return (
                            <button
                              key={d.id}
                              onClick={() => setDifficulty(d.id)}
                              style={{
                                padding: "6px 8px", borderRadius: "8px",
                                border: active ? `1px solid ${d.color}` : "1px solid #1F3830",
                                background: active ? "rgba(16,185,129,0.12)" : "#111E1A",
                                color: active ? d.color : "#9EB3A8",
                                fontSize: "11px", fontWeight: active ? 700 : 500, cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: "4px",
                              }}
                            >
                              <span>{d.icon}</span>
                              <span>{d.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Project Status Settings */}
                {category === "project" && (
                  <div>
                    <label style={{ color: "#9EB3A8", fontSize: "11px", fontWeight: 600, display: "block", marginBottom: "4px" }}>
                      Initial Kanban Column
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
                      {PROJECT_STATUSES.map(s => {
                        const active = projectStatus === s.id;
                        return (
                          <button
                            key={s.id}
                            onClick={() => setProjectStatus(s.id)}
                            style={{
                              padding: "6px 4px", borderRadius: "8px",
                              border: active ? "1px solid #10B981" : "1px solid #1F3830",
                              background: active ? "rgba(16,185,129,0.16)" : "#111E1A",
                              color: active ? "#34D399" : "#9EB3A8",
                              fontSize: "11px", fontWeight: active ? 700 : 500, cursor: "pointer",
                              textAlign: "center",
                            }}
                          >
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* General / Research Hint */}
                {["general", "research", "code"].includes(category) && (
                  <p style={{ color: "#5D756C", fontSize: "11.5px", margin: 0 }}>
                    💡 {CATEGORIES.find(c => c.id === category)?.hint}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="animate-fadeIn" style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#F87171", borderRadius: "10px",
              padding: "10px 14px", fontSize: "12.5px", fontWeight: 500,
              display: "flex", alignItems: "center", gap: "8px",
            }}>
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Footer */}
        <div style={{
          padding: "16px 24px 20px",
          borderTop: "1px solid #1F3830",
          background: "linear-gradient(0deg, rgba(23, 41, 35, 0.5) 0%, transparent 100%)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
        }}>
          <button
            type="button"
            onClick={() => !loading && onClose()}
            disabled={loading}
            className="btn-ghost"
            style={{ padding: "10px 18px", fontSize: "13px" }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleUpload}
            disabled={loading}
            className="btn-primary"
            style={{
              padding: "11px 28px",
              fontSize: "13.5px",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              boxShadow: "0 4px 16px rgba(16, 185, 129, 0.4)",
            }}
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Vectorizing & Indexing...</span>
              </>
            ) : (
              <>
                <span>{channel === "code" ? "💾 Save Code Snippet" : channel === "document" ? "📁 Ingest Document" : channel === "url" ? "🌐 Import Web Knowledge" : "✨ Create Memory"}</span>
                <span>→</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}