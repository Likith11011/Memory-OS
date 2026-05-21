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

const SUGGESTED_QUESTIONS = [
  "Summarize everything I know about AI",
  "What are my project ideas?",
  "What did I learn recently?",
  "Show my code snippets",
];

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [nMemories, setNMemories] = useState(5);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm your MemoryOS assistant. Ask me anything about your uploaded memories — notes, PDFs, code snippets, research papers, or any content you've saved.",
      timestamp: new Date(),
    }]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
              content: data.answer || "No answer generated",
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
              content: err.response?.data?.detail || err.message || "Failed to get response",
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
      color: isError ? "#f87171" : "#E2E8F0",
      fontSize: "14px", lineHeight: 1.8,
      wordBreak: "break-word",
    }}>
      {content.split('\n').map((line, i) => {
        // Escape HTML first to prevent corruption
        const escaped = escapeHtml(line);

        // Then apply bold formatting safely
        const boldLine = escaped.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#F8FAFC">$1</strong>');

        // Numbered list: 1. item
        if (/^\d+\.\s/.test(line)) {
          const num = line.match(/^(\d+)\./)?.[1];
          const text = escapeHtml(line.replace(/^\d+\.\s/, "")).replace(/\*\*(.*?)\*\*/g, '<strong style="color:#F8FAFC">$1</strong>');
          return (
            <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "6px", alignItems: "flex-start" }}>
              <span style={{
                color: "#2563EB", fontWeight: 700, fontSize: "13px",
                minWidth: "20px", flexShrink: 0,
              }}>{num}.</span>
              <span dangerouslySetInnerHTML={{ __html: text }} />
            </div>
          );
        }

        // Bullet points
        if (line.startsWith('- ') || line.startsWith('• ') || line.startsWith('* ')) {
          const text = escapeHtml(line.replace(/^[-•*]\s/, "")).replace(/\*\*(.*?)\*\*/g, '<strong style="color:#F8FAFC">$1</strong>');
          return (
            <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "6px", alignItems: "flex-start" }}>
              <span style={{
                color: "#2563EB", flexShrink: 0,
                marginTop: "2px", fontSize: "16px", lineHeight: 1,
              }}>•</span>
              <span dangerouslySetInnerHTML={{ __html: text }} />
            </div>
          );
        }

        // H3
        if (line.startsWith('### ')) {
          return (
            <p key={i} style={{
              color: "#94A3B8", fontWeight: 700, fontSize: "12px",
              margin: "14px 0 6px", textTransform: "uppercase", letterSpacing: "0.08em",
            }}>
              {line.replace('### ', '')}
            </p>
          );
        }

        // H2
        if (line.startsWith('## ')) {
          return (
            <p key={i} style={{
              color: "#60A5FA", fontWeight: 700, fontSize: "15px",
              margin: "16px 0 6px",
            }}>
              {line.replace('## ', '')}
            </p>
          );
        }

        // H1
        if (line.startsWith('# ')) {
          return (
            <p key={i} style={{
              color: "#F8FAFC", fontWeight: 800, fontSize: "17px",
              margin: "16px 0 8px", letterSpacing: "-0.01em",
            }}>
              {line.replace('# ', '')}
            </p>
          );
        }

        // Horizontal rule
        if (line.trim() === '---' || line.trim() === '***') {
          return <div key={i} style={{ height: "1px", background: "rgba(255,255,255,0.08)", margin: "12px 0" }} />;
        }

        // Empty line
        if (!line.trim()) return <div key={i} style={{ height: "6px" }} />;

        // Normal text with bold support
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
      background: "linear-gradient(135deg, #0A1224 0%, #0d1530 100%)",
      fontFamily: "'Inter', sans-serif",
    }}>
      <Sidebar />
      <main style={{
        marginLeft: "240px", flex: 1,
        display: "flex", flexDirection: "column",
        height: "100vh", overflow: "hidden",
      }}>

        {/* Header */}
        <div style={{
          padding: "20px 32px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "rgba(10,18,36,0.6)", backdropFilter: "blur(10px)",
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#F8FAFC", margin: 0 }}>
              Chat with Memories
            </h2>
            <p style={{ color: "#334155", fontSize: "13px", margin: "2px 0 0" }}>
              Ask anything — grounded answers from your personal knowledge base
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#334155", fontSize: "12px" }}>Depth:</span>
              <select
                value={nMemories}
                onChange={(e) => setNMemories(Number(e.target.value))}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px", color: "#94A3B8",
                  padding: "4px 10px", fontSize: "12px",
                  cursor: "pointer", outline: "none",
                }}
              >
                <option value={3}>3 memories</option>
                <option value={5}>5 memories</option>
                <option value={8}>8 memories</option>
                <option value={10}>10 memories</option>
              </select>
            </div>
            <button
              onClick={() => setMessages([{
                id: "clear", role: "assistant",
                content: "Chat cleared. Ask me anything!",
                timestamp: new Date(),
              }])}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px", color: "#475569",
                padding: "6px 14px", fontSize: "12px",
                cursor: "pointer", transition: "all 0.2s",
              }}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: "auto",
          padding: "24px 32px",
          display: "flex", flexDirection: "column", gap: "20px",
        }}>
          {messages.map((message) => (
            <div key={message.id} style={{
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
                background: message.role === "user"
                  ? "linear-gradient(135deg, #2563EB, #1d4ed8)"
                  : "rgba(255,255,255,0.05)",
                border: message.role === "assistant"
                  ? "1px solid rgba(255,255,255,0.08)" : "none",
                boxShadow: message.role === "user"
                  ? "0 0 15px rgba(37,99,235,0.3)" : "none",
              }}>
                {message.role === "user" ? "👤" : "🧠"}
              </div>

              <div style={{
                maxWidth: "72%",
                display: "flex", flexDirection: "column", gap: "8px",
              }}>
                {/* Message bubble */}
                <div style={{
                  background: message.role === "user"
                    ? "linear-gradient(135deg, rgba(37,99,235,0.25), rgba(29,78,216,0.2))"
                    : message.error ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.04)",
                  backdropFilter: "blur(10px)",
                  border: `1px solid ${
                    message.error ? "rgba(239,68,68,0.2)"
                    : message.role === "user" ? "rgba(37,99,235,0.3)"
                    : "rgba(255,255,255,0.08)"
                  }`,
                  borderRadius: message.role === "user"
                    ? "16px 4px 16px 16px"
                    : "4px 16px 16px 16px",
                  padding: "14px 18px",
                  boxShadow: message.role === "user"
                    ? "0 4px 15px rgba(37,99,235,0.15)" : "none",
                }}>
                  {message.loading ? (
                    <div style={{
                      display: "flex", gap: "6px",
                      alignItems: "center", padding: "4px 0",
                    }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{
                          width: "8px", height: "8px",
                          borderRadius: "50%", background: "#2563EB",
                          animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                        }} />
                      ))}
                      <style>{`
                        @keyframes pulse {
                          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
                          40% { opacity: 1; transform: scale(1); }
                        }
                      `}</style>
                    </div>
                  ) : (
                    renderMessage(message.content, !!message.error)
                  )}
                </div>

                {/* Sources */}
                {message.sources && message.sources.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <p style={{
                      color: "#334155", fontSize: "11px", fontWeight: 600,
                      textTransform: "uppercase", letterSpacing: "0.06em", margin: 0,
                    }}>
                      {message.memories_used} {message.memories_used === 1 ? "memory" : "memories"} used
                    </p>
                    {message.sources.map((source) => (
                      <div key={source.id} style={{
                        background: "rgba(255,255,255,0.02)",
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "10px", padding: "10px 14px",
                        display: "flex", flexDirection: "column", gap: "4px",
                      }}>
                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}>
                          <span style={{ color: "#94A3B8", fontSize: "12px", fontWeight: 600 }}>
                            {typeIcons[source.file_type] || "📝"} {source.title}
                          </span>
                          <span style={{
                            background: "rgba(37,99,235,0.12)",
                            border: "1px solid rgba(37,99,235,0.25)",
                            color: "#60A5FA",
                            fontSize: "10px", fontWeight: 600,
                            padding: "2px 8px", borderRadius: "999px",
                          }}>
                            {source.similarity.toFixed(1)}% match
                          </span>
                        </div>
                        <p style={{
                          color: "#334155", fontSize: "11px",
                          margin: 0, lineHeight: 1.5,
                        }}>
                          {source.content_preview}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Timestamp */}
                <span style={{
                  color: "#1e293b", fontSize: "10px",
                  alignSelf: message.role === "user" ? "flex-end" : "flex-start",
                }}>
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested questions */}
        {messages.length <= 1 && (
          <div style={{ padding: "0 32px 16px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {SUGGESTED_QUESTIONS.map((q) => (
              <button key={q} onClick={() => sendMessage(q)} disabled={loading} style={{
                background: "rgba(37,99,235,0.08)",
                border: "1px solid rgba(37,99,235,0.2)",
                borderRadius: "999px", color: "#60A5FA",
                padding: "6px 14px", fontSize: "12px",
                cursor: "pointer", transition: "all 0.2s",
              }}>
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{
          padding: "16px 32px 24px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(10,18,36,0.6)", backdropFilter: "blur(10px)",
          flexShrink: 0,
        }}>
          <div style={{
            display: "flex", gap: "12px", alignItems: "flex-end",
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "16px", padding: "12px 16px",
            transition: "border-color 0.2s",
          }}
            onFocusCapture={e => (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(37,99,235,0.4)"}
            onBlurCapture={e => (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.1)"}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your memories... (Enter to send)"
              rows={1} disabled={loading}
              style={{
                flex: 1, background: "transparent", border: "none",
                color: "#F8FAFC", fontSize: "14px", outline: "none",
                resize: "none", fontFamily: "inherit", lineHeight: 1.6,
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
              style={{
                background: loading || !input.trim()
                  ? "rgba(37,99,235,0.3)"
                  : "linear-gradient(135deg, #2563EB, #1d4ed8)",
                border: "none", borderRadius: "10px",
                width: "40px", height: "40px",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                flexShrink: 0, fontSize: "16px",
                boxShadow: !loading && input.trim()
                  ? "0 0 15px rgba(37,99,235,0.4)" : "none",
                transition: "all 0.2s",
              }}
            >
              {loading ? "⏳" : "→"}
            </button>
          </div>
          <p style={{ color: "#1e293b", fontSize: "11px", marginTop: "8px", textAlign: "center" }}>
            Answers are generated from your personal memory bank only
          </p>
        </div>
      </main>
    </div>
  );
}