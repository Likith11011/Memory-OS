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
      content: "Hello! I am your MemoryOS assistant. Ask me any question grounded in your saved notes, PDFs, code snippets, and uploaded knowledge.",
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
        color: isError ? "#DC2626" : "#10231D",
        fontSize: "14px", lineHeight: 1.75,
        wordBreak: "break-word",
      }}>
        {content.split('\n').map((line, i) => {
          const escaped = escapeHtml(line);
          const boldLine = escaped.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#064E3B">$1</strong>');

          // Numbered list
          if (/^\d+\.\s/.test(line)) {
            const num = line.match(/^(\d+)\./)?.[1];
            const text = escapeHtml(line.replace(/^\d+\.\s/, "")).replace(/\*\*(.*?)\*\*/g, '<strong style="color:#064E3B">$1</strong>');
            return (
              <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "6px", alignItems: "flex-start" }}>
                <span style={{
                  color: "#059669", fontWeight: 700, fontSize: "13px",
                  minWidth: "20px", flexShrink: 0,
                }}>{num}.</span>
                <span dangerouslySetInnerHTML={{ __html: text }} />
              </div>
            );
          }

          // Bullet points
          if (line.startsWith('- ') || line.startsWith('• ') || line.startsWith('* ')) {
            const text = escapeHtml(line.replace(/^[-•*]\s/, "")).replace(/\*\*(.*?)\*\*/g, '<strong style="color:#064E3B">$1</strong>');
            return (
              <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "6px", alignItems: "flex-start" }}>
                <span style={{
                  color: "#059669", flexShrink: 0,
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
                color: "#064E3B", fontWeight: 700, fontSize: "13px",
                margin: "12px 0 4px", textTransform: "uppercase", letterSpacing: "0.05em",
              }}>
                {line.replace('### ', '')}
              </p>
            );
          }

          if (line.startsWith('## ') || line.startsWith('# ')) {
            return (
              <p key={i} style={{
                color: "#064E3B", fontWeight: 700, fontSize: "15px",
                margin: "14px 0 6px",
              }}>
                {line.replace(/^#+\s/, '')}
              </p>
            );
          }

          if (line.trim() === '---' || line.trim() === '***') {
            return <div key={i} style={{ height: "1px", background: "#DDE7E2", margin: "12px 0" }} />;
          }

          if (!line.trim()) return <div key={i} style={{ height: "6px" }} />;

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
      background: "#F8FAF9",
      color: "#10231D",
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
          padding: "16px 32px",
          borderBottom: "1px solid #DDE7E2",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "#FFFFFF",
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ fontSize: "19px", fontWeight: 700, color: "#064E3B", margin: 0 }}>
              Ask Memory
            </h2>
            <p style={{ color: "#52635C", fontSize: "12.5px", margin: "2px 0 0" }}>
              Intelligent answers grounded in your private knowledge forest
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ color: "#7A8A84", fontSize: "12px", fontWeight: 500 }}>Context:</span>
              <select
                value={nMemories}
                onChange={(e) => setNMemories(Number(e.target.value))}
                style={{
                  background: "#F1F5F3",
                  border: "1px solid #DDE7E2",
                  borderRadius: "8px", color: "#10231D",
                  padding: "4px 8px", fontSize: "12px",
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
                content: "Chat cleared. Ask me anything about your memories!",
                timestamp: new Date(),
              }])}
              className="btn-secondary"
              style={{ padding: "5px 12px", fontSize: "12px", borderRadius: "8px" }}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: "auto",
          padding: "24px 32px",
          display: "flex", flexDirection: "column", gap: "18px",
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
                background: message.role === "user" ? "#F1F5F3" : "#059669",
                border: message.role === "user" ? "1px solid #DDE7E2" : "none",
                color: message.role === "user" ? "#064E3B" : "#FFFFFF",
                boxShadow: message.role === "assistant" ? "0 2px 6px rgba(5,150,105,0.25)" : "none",
              }}>
                {message.role === "user" ? "👤" : "🧠"}
              </div>

              <div style={{
                maxWidth: "75%",
                display: "flex", flexDirection: "column", gap: "6px",
              }}>
                {/* Message bubble */}
                <div style={{
                  background: message.role === "user"
                    ? "#F1F5F3"
                    : message.error ? "#FEF2F2" : "#FFFFFF",
                  border: `1px solid ${
                    message.error ? "#FEE2E2"
                    : message.role === "user" ? "#DDE7E2"
                    : "#DDE7E2"
                  }`,
                  borderRadius: message.role === "user"
                    ? "16px 4px 16px 16px"
                    : "4px 16px 16px 16px",
                  padding: "14px 18px",
                  boxShadow: "0 1px 3px rgba(16,35,29,0.03)",
                }}>
                  {message.loading ? (
                    <div style={{
                      display: "flex", gap: "6px",
                      alignItems: "center", padding: "4px 0",
                    }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{
                          width: "8px", height: "8px",
                          borderRadius: "50%", background: "#059669",
                          animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                        }} />
                      ))}
                    </div>
                  ) : (
                    renderMessage(message.content, !!message.error)
                  )}
                </div>

                {/* Sources */}
                {message.sources && message.sources.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "2px" }}>
                    <p style={{
                      color: "#7A8A84", fontSize: "11px", fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: "0.06em", margin: 0,
                    }}>
                      {message.memories_used} {message.memories_used === 1 ? "source cited" : "sources cited"}
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "6px" }}>
                      {message.sources.map((source) => (
                        <div key={source.id} style={{
                          background: "#FFFFFF",
                          border: "1px solid #DDE7E2",
                          borderRadius: "10px", padding: "10px 12px",
                          display: "flex", flexDirection: "column", gap: "4px",
                          boxShadow: "0 1px 2px rgba(16,35,29,0.02)",
                        }}>
                          <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}>
                            <span style={{ color: "#064E3B", fontSize: "12px", fontWeight: 700 }}>
                              {typeIcons[source.file_type] || "📝"} {source.title}
                            </span>
                            <span style={{
                              background: "#ECFDF5",
                              border: "1px solid #D1FAE5",
                              color: "#059669",
                              fontSize: "10px", fontWeight: 700,
                              padding: "2px 7px", borderRadius: "999px",
                            }}>
                              {source.similarity.toFixed(1)}% match
                            </span>
                          </div>
                          <p style={{
                            color: "#52635C", fontSize: "11.5px",
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
                  color: "#7A8A84", fontSize: "10.5px",
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
          <div style={{ padding: "0 32px 14px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {SUGGESTED_QUESTIONS.map((q) => (
              <button key={q} onClick={() => sendMessage(q)} disabled={loading} style={{
                background: "#FFFFFF",
                border: "1px solid #DDE7E2",
                borderRadius: "999px", color: "#064E3B",
                padding: "6px 14px", fontSize: "12px", fontWeight: 500,
                cursor: "pointer", transition: "all 0.15s",
                boxShadow: "0 1px 2px rgba(16,35,29,0.02)",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "#ECFDF5"; e.currentTarget.style.borderColor = "#A7F3D0"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#FFFFFF"; e.currentTarget.style.borderColor = "#DDE7E2"; }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div style={{
          padding: "16px 32px 20px",
          borderTop: "1px solid #DDE7E2",
          background: "#FFFFFF",
          flexShrink: 0,
        }}>
          <div style={{
            display: "flex", gap: "10px", alignItems: "flex-end",
            background: "#F8FAF9",
            border: "1px solid #DDE7E2",
            borderRadius: "14px", padding: "10px 14px",
            transition: "all 0.2s ease",
          }}
            onFocusCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#059669"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 3px rgba(5,150,105,0.1)"; }}
            onBlurCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#DDE7E2"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your memories... (Press Enter to send)"
              rows={1} disabled={loading}
              style={{
                flex: 1, background: "transparent", border: "none",
                color: "#10231D", fontSize: "14px", outline: "none",
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
                opacity: loading || !input.trim() ? 0.5 : 1,
                fontSize: "16px",
              }}
            >
              {loading ? "⏳" : "→"}
            </button>
          </div>
          <p style={{ color: "#7A8A84", fontSize: "11px", marginTop: "6px", textAlign: "center" }}>
            AI responses are grounded strictly in your uploaded knowledge
          </p>
        </div>
      </main>
    </div>
  );
}