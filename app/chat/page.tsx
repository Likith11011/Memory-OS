"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { chatWithMemories } from "@/lib/api";
import Sidebar from "@/components/Sidebar";

interface Source {
  id: number; title: string; file_type: string;
  similarity: number; content_preview: string;
}

interface Message {
  id: string; role: "user" | "assistant";
  content: string; sources?: Source[];
  memories_used?: number; timestamp: Date;
  loading?: boolean; error?: boolean;
}

const typeIcons: Record<string, string> = {
  text: "📝", pdf: "📄", docx: "📘", pptx: "📊",
  image: "🖼️", url: "🌐", youtube: "▶️", code: "💻",
};

const SUGGESTED_PROMPTS = [
  { label: "Summarize AI Knowledge", query: "Summarize everything I have saved about AI and Machine Learning" },
  { label: "Review Project Ideas", query: "What are all the project ideas and notes in my memory?" },
  { label: "Key Formulas & Code", query: "Show me code snippets and algorithms saved in my knowledge base" },
  { label: "Recent Study Insights", query: "What are the most important concepts from my recent notes?" },
];

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [nMemories, setNMemories] = useState(5);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: "Hello! I am your **MemoryOS AI Copilot**. Ask me anything grounded in your notes, PDFs, code repositories, or uploaded documents.",
      timestamp: new Date(),
    }]);
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sendMessage = async (messageText?: string) => {
    const text = (messageText || input).trim();
    if (!text || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(), role: "user",
      content: text, timestamp: new Date(),
    };
    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(), role: "assistant",
      content: "", timestamp: new Date(), loading: true,
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInput("");
    setLoading(true);

    try {
      const data = await chatWithMemories(text, nMemories);
      setMessages(prev => prev.map(m =>
        m.id === loadingMessage.id
          ? {
              ...m,
              content: data.answer || "No relevant information found in your memories.",
              sources: data.sources || [],
              memories_used: data.memories_used || 0,
              loading: false,
            }
          : m
      ));
    } catch (err: any) {
      setMessages(prev => prev.map(m =>
        m.id === loadingMessage.id
          ? {
              ...m,
              content: err.response?.data?.detail || err.message || "Unable to reach memory retrieval pipeline.",
              loading: false,
              error: true,
            }
          : m
      ));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const escapeHtml = (text: string): string => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const renderMessage = (content: string, isError: boolean) => {
    return (
      <div style={{
        color: isError ? "#F87171" : "#F0FDF4",
        fontSize: "14px", lineHeight: 1.75,
        wordBreak: "break-word",
      }}>
        {content.split('\n').map((line, i) => {
          const escaped = escapeHtml(line);
          const boldLine = escaped
            .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#34D399">$1</strong>')
            .replace(/`([^`]+)`/g, '<code style="background:#0E1915; border:1px solid #1F3830; padding:1px 6px; border-radius:4px; color:#6EE7B7; font-size:12.5px; font-family:monospace;">$1</code>');

          // Numbered list
          if (/^\d+\.\s/.test(line)) {
            const num = line.match(/^(\d+)\./)?.[1];
            const text = escapeHtml(line.replace(/^\d+\.\s/, ""))
              .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#34D399">$1</strong>')
              .replace(/`([^`]+)`/g, '<code style="background:#0E1915; border:1px solid #1F3830; padding:1px 6px; border-radius:4px; color:#6EE7B7; font-size:12.5px; font-family:monospace;">$1</code>');
            return (
              <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "6px", alignItems: "flex-start" }}>
                <span style={{
                  color: "#10B981", fontWeight: 700, fontSize: "13px",
                  minWidth: "20px", flexShrink: 0,
                }}>{num}.</span>
                <span dangerouslySetInnerHTML={{ __html: text }} />
              </div>
            );
          }

          // Bullet points
          if (line.startsWith('- ') || line.startsWith('• ') || line.startsWith('* ')) {
            const text = escapeHtml(line.replace(/^[-•*]\s/, ""))
              .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#34D399">$1</strong>')
              .replace(/`([^`]+)`/g, '<code style="background:#0E1915; border:1px solid #1F3830; padding:1px 6px; border-radius:4px; color:#6EE7B7; font-size:12.5px; font-family:monospace;">$1</code>');
            return (
              <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "6px", alignItems: "flex-start" }}>
                <span style={{
                  color: "#10B981", flexShrink: 0,
                  marginTop: "2px", fontSize: "14px", lineHeight: 1,
                }}>•</span>
                <span dangerouslySetInnerHTML={{ __html: text }} />
              </div>
            );
          }

          // Headers
          if (line.startsWith('### ')) {
            return (
              <p key={i} style={{
                color: "#34D399", fontWeight: 700, fontSize: "13.5px",
                margin: "14px 0 4px", textTransform: "uppercase", letterSpacing: "0.04em",
              }}>
                {line.replace('### ', '')}
              </p>
            );
          }

          if (line.startsWith('## ') || line.startsWith('# ')) {
            return (
              <p key={i} style={{
                color: "#F0FDF4", fontWeight: 700, fontSize: "15px",
                margin: "16px 0 6px",
              }}>
                {line.replace(/^#+\s/, '')}
              </p>
            );
          }

          if (line.trim() === '---' || line.trim() === '***') {
            return <div key={i} style={{ height: "1px", background: "#1F3830", margin: "14px 0" }} />;
          }

          if (!line.trim()) return <div key={i} style={{ height: "8px" }} />;

          return (
            <p key={i} style={{ margin: "0 0 6px" }}
              dangerouslySetInnerHTML={{ __html: boldLine }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div style={{
      display: "flex", minHeight: "100vh",
      background: "#09110E",
      color: "#F0FDF4",
      fontFamily: "'Inter', sans-serif",
    }}>
      <Sidebar />
      <main style={{
        marginLeft: "250px", flex: 1,
        display: "flex", flexDirection: "column",
        height: "100vh", overflow: "hidden",
        width: "calc(100% - 250px)",
      }}>

        {/* Top Chat Header */}
        <div style={{
          padding: "16px 36px",
          borderBottom: "1px solid #1F3830",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "#0B1612",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "10px",
              background: "linear-gradient(135deg, #059669 0%, #10B981 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "18px", boxShadow: "0 2px 10px rgba(16,185,129,0.35)",
            }}>💬</div>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#F0FDF4", margin: 0 }}>
                Memory AI Copilot
              </h2>
              <p style={{ color: "#9EB3A8", fontSize: "12px", margin: "2px 0 0" }}>
                Contextual answers strictly grounded in your vector database
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: "#111E1A", border: "1px solid #1F3830",
              borderRadius: "8px", padding: "4px 10px",
            }}>
              <span style={{ color: "#9EB3A8", fontSize: "12px", fontWeight: 500 }}>Context Window:</span>
              <select
                value={nMemories}
                onChange={(e) => setNMemories(Number(e.target.value))}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#34D399",
                  fontWeight: 600,
                  fontSize: "12px",
                  cursor: "pointer", outline: "none",
                }}
              >
                <option value={3} style={{ background: "#111E1A", color: "#F0FDF4" }}>3 sources</option>
                <option value={5} style={{ background: "#111E1A", color: "#F0FDF4" }}>5 sources</option>
                <option value={8} style={{ background: "#111E1A", color: "#F0FDF4" }}>8 sources</option>
                <option value={10} style={{ background: "#111E1A", color: "#F0FDF4" }}>10 sources</option>
              </select>
            </div>
            <button
              onClick={() => setMessages([{
                id: "clear", role: "assistant",
                content: "Chat cleared. What knowledge would you like to explore?",
                timestamp: new Date(),
              }])}
              className="btn-secondary"
              style={{ padding: "6px 14px", fontSize: "12px", borderRadius: "8px" }}
            >
              Clear Chat
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div style={{
          flex: 1, overflowY: "auto",
          padding: "28px 36px",
          display: "flex", flexDirection: "column", gap: "20px",
        }}>
          {messages.map((message) => (
            <div key={message.id} className="animate-fadeIn" style={{
              display: "flex",
              flexDirection: message.role === "user" ? "row-reverse" : "row",
              gap: "12px", alignItems: "flex-start",
            }}>
              {/* Avatar */}
              <div style={{
                width: "36px", height: "36px",
                borderRadius: "10px", flexShrink: 0,
                display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "16px",
                background: message.role === "user" ? "#172923" : "linear-gradient(135deg, #059669, #10B981)",
                border: message.role === "user" ? "1px solid #1F3830" : "none",
                color: message.role === "user" ? "#34D399" : "#FFFFFF",
                boxShadow: message.role === "assistant" ? "0 2px 12px rgba(16,185,129,0.3)" : "none",
              }}>
                {message.role === "user" ? "👤" : "🧠"}
              </div>

              <div style={{
                maxWidth: "76%",
                display: "flex", flexDirection: "column", gap: "6px",
              }}>
                {/* Message Bubble */}
                <div style={{
                  background: message.role === "user"
                    ? "#172923"
                    : message.error ? "rgba(239, 68, 68, 0.12)" : "#111E1A",
                  border: `1px solid ${
                    message.error ? "rgba(239, 68, 68, 0.3)"
                    : message.role === "user" ? "#1F3830"
                    : "#1F3830"
                  }`,
                  borderTopColor: message.role === "assistant" && !message.error ? "rgba(255, 255, 255, 0.08)" : undefined,
                  borderRadius: message.role === "user"
                    ? "18px 4px 18px 18px"
                    : "4px 18px 18px 18px",
                  padding: "16px 20px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
                  position: "relative",
                }}>
                  {message.loading ? (
                    <div style={{
                      display: "flex", gap: "6px",
                      alignItems: "center", padding: "6px 0",
                    }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{
                          width: "8px", height: "8px",
                          borderRadius: "50%", background: "#10B981",
                          animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                        }} />
                      ))}
                      <span style={{ fontSize: "12px", color: "#9EB3A8", marginLeft: "6px" }}>Searching memory vector embeddings...</span>
                    </div>
                  ) : (
                    renderMessage(message.content, !!message.error)
                  )}

                  {/* Copy Action Button */}
                  {message.role === "assistant" && !message.loading && !message.error && (
                    <button
                      onClick={() => copyToClipboard(message.content, message.id)}
                      style={{
                        position: "absolute", top: "10px", right: "10px",
                        background: "rgba(23, 41, 35, 0.7)",
                        border: "1px solid #1F3830",
                        borderRadius: "6px",
                        padding: "3px 8px", fontSize: "10px", color: "#9EB3A8",
                        cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px",
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#34D399"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#9EB3A8"; }}
                    >
                      {copiedId === message.id ? "✓ Copied" : "📋 Copy"}
                    </button>
                  )}
                </div>

                {/* Sources & Citations */}
                {message.sources && message.sources.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
                    <p style={{
                      color: "#9EB3A8", fontSize: "11px", fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 2px",
                      display: "flex", alignItems: "center", gap: "6px",
                    }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10B981" }} />
                      {message.memories_used} {message.memories_used === 1 ? "Citation Referenced" : "Citations Referenced"}
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "8px" }}>
                      {message.sources.map((source) => (
                        <div key={source.id} style={{
                          background: "#0E1915",
                          border: "1px solid #1F3830",
                          borderRadius: "10px", padding: "10px 14px",
                          display: "flex", flexDirection: "column", gap: "4px",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                        }}>
                          <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}>
                            <span style={{ color: "#F0FDF4", fontSize: "12px", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {typeIcons[source.file_type] || "📝"} {source.title}
                            </span>
                            <span style={{
                              background: "rgba(16, 185, 129, 0.15)",
                              border: "1px solid rgba(16, 185, 129, 0.3)",
                              color: "#34D399",
                              fontSize: "10px", fontWeight: 700,
                              padding: "2px 7px", borderRadius: "999px", flexShrink: 0,
                            }}>
                              {source.similarity.toFixed(1)}% match
                            </span>
                          </div>
                          <p style={{
                            color: "#9EB3A8", fontSize: "11.5px",
                            margin: 0, lineHeight: 1.45,
                            display: "-webkit-box", WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical", overflow: "hidden",
                          }}>
                            {source.content_preview}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timestamp */}
                <span style={{
                  color: "#5D756C", fontSize: "10.5px",
                  alignSelf: message.role === "user" ? "flex-end" : "flex-start",
                }}>
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Starters */}
        {messages.length <= 1 && (
          <div style={{ padding: "0 36px 14px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {SUGGESTED_PROMPTS.map((p) => (
              <button
                key={p.label}
                onClick={() => sendMessage(p.query)}
                disabled={loading}
                style={{
                  background: "#111E1A",
                  border: "1px solid #1F3830",
                  borderRadius: "999px", color: "#34D399",
                  padding: "7px 16px", fontSize: "12px", fontWeight: 500,
                  cursor: "pointer", transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                  display: "inline-flex", alignItems: "center", gap: "6px",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(16, 185, 129, 0.16)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#10B981";
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = "#111E1A";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#1F3830";
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                }}
              >
                <span>⚡</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Bottom Input Area */}
        <div style={{
          padding: "16px 36px 22px",
          borderTop: "1px solid #1F3830",
          background: "#0B1612",
          flexShrink: 0,
        }}>
          <div style={{
            display: "flex", gap: "10px", alignItems: "flex-end",
            background: "#0E1915",
            border: "1px solid #1F3830",
            borderRadius: "14px", padding: "10px 14px",
            transition: "all 0.2s ease",
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)",
          }}
            onFocusCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#10B981"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 3px rgba(16,185,129,0.18)"; }}
            onBlurCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#1F3830"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything grounded in your memory forest... (Press Enter to send, Shift+Enter for newline)"
              rows={1} disabled={loading}
              style={{
                flex: 1, background: "transparent", border: "none",
                color: "#F0FDF4", fontSize: "14px", outline: "none",
                resize: "none", fontFamily: "inherit", lineHeight: 1.5,
                maxHeight: "120px", overflowY: "auto",
              }}
              onInput={(e) => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = "auto";
                t.style.height = Math.min(t.scrollHeight, 120) + "px";
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="btn-primary"
              aria-label="Send message"
              style={{
                borderRadius: "10px",
                width: "38px", height: "38px",
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                opacity: loading || !input.trim() ? 0.4 : 1,
                fontSize: "16px",
              }}
            >
              {loading ? "⏳" : "→"}
            </button>
          </div>
          <p style={{ color: "#5D756C", fontSize: "11px", marginTop: "6px", textAlign: "center" }}>
            🔒 100% Private Vector Retrieval • Grounded in Your Personal Knowledge
          </p>
        </div>
      </main>
    </div>
  );
}