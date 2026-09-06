"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Link from "next/link";

const features = [
  { icon: "🧠", title: "Semantic Vector Search", desc: "Find memories by meaning, concept, and context rather than exact keyword matches." },
  { icon: "📄", title: "Universal Ingestion", desc: "PDFs, Word documents, Markdown notes, source code, web pages — indexed automatically." },
  { icon: "💬", title: "Grounded AI Chat", desc: "Ask questions and receive hallucination-free answers cited with exact memory sources." },
  { icon: "🔬", title: "Research & Citations", desc: "Auto-extract page citations, paper abstracts, and academic insights into knowledge graphs." },
  { icon: "💻", title: "Code & Snippet Hub", desc: "Store multi-language code snippets with instant recall and syntax-highlighted previews." },
  { icon: "📚", title: "Spaced Repetition & Exam", desc: "Turn raw study notes into active recall flashcards, quizzes, and difficulty-rated revision cards." },
];

export default function Home() {
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"search" | "chat" | "cards">("search");

  useEffect(() => {
    if (!isLoading && isLoggedIn) router.push("/dashboard");
  }, [isLoggedIn, isLoading, router]);

  if (isLoading) return null;

  return (
    <main style={{
      minHeight: "100vh",
      background: "#09110E",
      color: "#F0FDF4",
      fontFamily: "'Inter', sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background ambient lighting */}
      <div style={{
        position: "fixed", top: "-15%", left: "30%",
        width: "700px", height: "700px",
        background: "radial-gradient(circle, rgba(16,185,129,0.14) 0%, transparent 65%)",
        borderRadius: "50%", pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{
        position: "fixed", bottom: "10%", right: "5%",
        width: "600px", height: "600px",
        background: "radial-gradient(circle, rgba(5,150,105,0.09) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none", zIndex: 0,
      }} />

      {/* Top Navbar */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0,
        zIndex: 100,
        background: "rgba(9, 17, 14, 0.85)",
        backdropFilter: "blur(18px)",
        borderBottom: "1px solid #1F3830",
        padding: "0 32px",
        height: "64px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "36px", height: "36px",
            background: "linear-gradient(135deg, #059669 0%, #10B981 100%)",
            borderRadius: "10px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "18px",
            boxShadow: "0 2px 12px rgba(16,185,129,0.4)",
            color: "#FFFFFF",
          }}>🧠</div>
          <span style={{ fontWeight: 800, fontSize: "18px", color: "#F0FDF4", letterSpacing: "-0.01em" }}>
            MemoryOS
          </span>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <Link href="/login" className="btn-secondary" style={{
            padding: "8px 18px", borderRadius: "10px", fontSize: "13.5px",
          }}>
            Sign in
          </Link>
          <Link href="/signup" className="btn-primary" style={{
            padding: "8px 20px", borderRadius: "10px", fontSize: "13.5px",
          }}>
            Get Started Free
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        position: "relative", zIndex: 1,
        padding: "130px 20px 40px",
        maxWidth: "1160px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}>
        {/* Release / Status Badge */}
        <div className="animate-fadeInUp" style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          background: "rgba(16, 185, 129, 0.1)",
          border: "1px solid rgba(16, 185, 129, 0.3)",
          borderRadius: "999px",
          padding: "6px 16px",
          marginBottom: "24px",
          color: "#34D399",
          fontSize: "13px", fontWeight: 600,
          boxShadow: "0 0 20px rgba(16,185,129,0.12)",
        }}>
          <span style={{
            width: "7px", height: "7px",
            background: "#10B981",
            borderRadius: "50%",
            boxShadow: "0 0 8px #10B981",
          }} />
          MemoryOS 2.0 • AI-Powered Second Brain
        </div>

        {/* Main Heading */}
        <h1 className="animate-fadeInUp" style={{
          fontSize: "clamp(2.6rem, 5.5vw, 4.4rem)",
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: "-0.03em",
          marginBottom: "20px",
          maxWidth: "850px",
        }}>
          Turn Your Scattered Knowledge into an{" "}
          <span style={{
            background: "linear-gradient(135deg, #10B981 0%, #34D399 50%, #6EE7B7 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            Active Second Brain
          </span>
        </h1>

        {/* Subtitle */}
        <p className="animate-fadeInUp" style={{
          color: "#9EB3A8",
          fontSize: "clamp(1rem, 2vw, 1.2rem)",
          lineHeight: 1.6,
          maxWidth: "680px",
          marginBottom: "36px",
        }}>
          Store notes, documents, research, and code. Ask questions, generate flashcards,
          and explore neural memory connections with lightning-fast AI retrieval.
        </p>

        {/* CTA Buttons */}
        <div className="animate-fadeInUp" style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap", marginBottom: "48px" }}>
          <Link href="/signup" className="btn-primary" style={{
            padding: "13px 32px", borderRadius: "12px", fontSize: "15px",
          }}>
            Create Your Brain Free →
          </Link>
          <Link href="/login" className="btn-secondary" style={{
            padding: "13px 26px", borderRadius: "12px", fontSize: "15px",
          }}>
            Live Demo Access
          </Link>
        </div>

        {/* Interactive App Preview Window */}
        <div className="glass-card animate-scaleIn" style={{
          width: "100%",
          maxWidth: "920px",
          borderRadius: "18px",
          border: "1px solid rgba(255,255,255,0.08)",
          background: "#0E1915",
          padding: "16px",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(16, 185, 129, 0.08)",
          textAlign: "left",
          marginBottom: "70px",
        }}>
          {/* Mock Window Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            borderBottom: "1px solid #1F3830", paddingBottom: "12px", marginBottom: "16px",
          }}>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#EF4444" }} />
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#F59E0B" }} />
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10B981" }} />
              <span style={{ color: "#5D756C", fontSize: "12px", marginLeft: "10px", fontFamily: "monospace" }}>
                memoryos.ai/app/workspace
              </span>
            </div>

            {/* Interactive Preview Tabs */}
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                onClick={() => setActiveTab("search")}
                style={{
                  padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600,
                  cursor: "pointer", border: "1px solid",
                  background: activeTab === "search" ? "rgba(16,185,129,0.2)" : "transparent",
                  borderColor: activeTab === "search" ? "#10B981" : "#1F3830",
                  color: activeTab === "search" ? "#34D399" : "#9EB3A8",
                }}
              >
                ⌕ Semantic Search
              </button>
              <button
                onClick={() => setActiveTab("chat")}
                style={{
                  padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600,
                  cursor: "pointer", border: "1px solid",
                  background: activeTab === "chat" ? "rgba(16,185,129,0.2)" : "transparent",
                  borderColor: activeTab === "chat" ? "#10B981" : "#1F3830",
                  color: activeTab === "chat" ? "#34D399" : "#9EB3A8",
                }}
              >
                💬 RAG Chat
              </button>
              <button
                onClick={() => setActiveTab("cards")}
                style={{
                  padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600,
                  cursor: "pointer", border: "1px solid",
                  background: activeTab === "cards" ? "rgba(16,185,129,0.2)" : "transparent",
                  borderColor: activeTab === "cards" ? "#10B981" : "#1F3830",
                  color: activeTab === "cards" ? "#34D399" : "#9EB3A8",
                }}
              >
                📚 Active Recall
              </button>
            </div>
          </div>

          {/* Tab Content Preview */}
          {activeTab === "search" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{
                background: "#111E1A", border: "1px solid #1F3830", borderRadius: "10px",
                padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px",
              }}>
                <span style={{ color: "#10B981" }}>⌕</span>
                <span style={{ color: "#F0FDF4", fontSize: "13px" }}>how does distributed consensus work in raft?</span>
                <span className="kbd-badge" style={{ marginLeft: "auto" }}>98% Match</span>
              </div>
              <div style={{
                background: "#14241E", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "10px",
                padding: "14px",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ color: "#34D399", fontWeight: 600, fontSize: "13px" }}>📄 Raft Distributed Consensus Protocol Notes</span>
                  <span style={{ fontSize: "11px", color: "#5D756C" }}>Indexed 2 hrs ago</span>
                </div>
                <p style={{ color: "#9EB3A8", fontSize: "12.5px", lineHeight: 1.5, margin: 0 }}>
                  Raft achieves consensus by electing a distinguished leader, then giving the leader complete responsibility for managing the replicated log. Leaders accept log entries from clients and replicate them across followers...
                </p>
              </div>
            </div>
          )}

          {activeTab === "chat" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ alignSelf: "flex-end", background: "#172923", padding: "8px 14px", borderRadius: "12px 12px 2px 12px", maxWidth: "70%" }}>
                <p style={{ color: "#F0FDF4", fontSize: "13px", margin: 0 }}>What are the 3 key takeaways from my Machine Learning notes?</p>
              </div>
              <div style={{ alignSelf: "flex-start", background: "#111E1A", border: "1px solid #1F3830", padding: "12px 16px", borderRadius: "12px 12px 12px 2px", maxWidth: "80%" }}>
                <p style={{ color: "#F0FDF4", fontSize: "13px", margin: "0 0 6px 0", lineHeight: 1.5 }}>
                  Based on your saved note <strong>Deep Learning Fundamentals (p. 42)</strong>:
                </p>
                <ul style={{ color: "#9EB3A8", fontSize: "12px", margin: 0, paddingLeft: "18px", lineHeight: 1.5 }}>
                  <li>Gradient descent convergence relies on learning rate schedules (Adam/Cosine).</li>
                  <li>Overfitting mitigation is achieved via weight decay and dropout layers.</li>
                  <li>Cross-entropy loss optimizes maximum likelihood for multi-class classification.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === "cards" && (
            <div style={{
              background: "#111E1A", border: "1px solid #1F3830", borderRadius: "12px",
              padding: "20px", textAlign: "center",
            }}>
              <span style={{ fontSize: "11px", color: "#10B981", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Active Recall Flashcard
              </span>
              <h3 style={{ color: "#F0FDF4", fontSize: "16px", fontWeight: 600, margin: "10px 0 16px" }}>
                What is the time complexity of vector similarity search in HNSW?
              </h3>
              <div style={{ display: "inline-flex", gap: "8px" }}>
                <span className="tag-pill" style={{ background: "rgba(16,185,129,0.15)" }}>O(log N) Average</span>
                <span className="tag-pill" style={{ background: "rgba(56,189,248,0.15)", color: "#38BDF8", borderColor: "rgba(56,189,248,0.3)" }}>Graph Exploration</span>
              </div>
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px", width: "100%", maxWidth: "900px", marginBottom: "70px",
        }}>
          {[
            { metric: "100%", label: "Private & Local Vector Storage" },
            { metric: "Sub-50ms", label: "Semantic RAG Query Speed" },
            { metric: "Zero", label: "Hallucination Citation Guarantee" },
            { metric: "10+ Formats", label: "PDF, DOCX, Code, Audio & Web" },
          ].map((s) => (
            <div key={s.label} style={{
              background: "#111E1A", border: "1px solid #1F3830",
              borderRadius: "14px", padding: "18px 14px", textAlign: "center",
            }}>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#34D399", marginBottom: "4px" }}>
                {s.metric}
              </div>
              <div style={{ fontSize: "12px", color: "#9EB3A8" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid Section */}
      <section style={{
        position: "relative", zIndex: 1,
        padding: "30px 24px 100px",
        maxWidth: "1100px", margin: "0 auto",
      }}>
        <div style={{ textAlign: "center", marginBottom: "44px" }}>
          <h2 style={{
            fontSize: "clamp(1.8rem, 3.5vw, 2.4rem)",
            fontWeight: 700, color: "#F0FDF4",
            marginBottom: "10px", letterSpacing: "-0.02em",
          }}>
            Architected for Serious Thinkers
          </h2>
          <p style={{ color: "#9EB3A8", fontSize: "15px" }}>
            Experience the precision of modern semantic intelligence.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "20px",
        }}>
          {features.map((f) => (
            <div key={f.title} style={{
              background: "#111E1A",
              border: "1px solid #1F3830",
              borderRadius: "18px",
              padding: "26px",
              transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.35)",
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "#10B981";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 10px 30px rgba(16, 185, 129, 0.15)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "#1F3830";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.35)";
              }}
            >
              <div style={{
                width: "44px", height: "44px",
                background: "rgba(16, 185, 129, 0.12)",
                border: "1px solid rgba(16, 185, 129, 0.25)",
                borderRadius: "12px",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "20px", marginBottom: "16px",
              }}>
                {f.icon}
              </div>
              <h3 style={{ color: "#F0FDF4", fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>
                {f.title}
              </h3>
              <p style={{ color: "#9EB3A8", fontSize: "13.5px", lineHeight: 1.6, margin: 0 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid #1F3830",
        padding: "36px 32px",
        background: "#070E0B",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: "16px",
        color: "#5D756C", fontSize: "13px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span>🧠 MemoryOS Second Brain</span>
          <span>•</span>
          <span>© 2026</span>
        </div>
        <div style={{ display: "flex", gap: "20px" }}>
          <Link href="/login" style={{ color: "#9EB3A8" }}>Login</Link>
          <Link href="/signup" style={{ color: "#9EB3A8" }}>Signup</Link>
          <Link href="/dashboard" style={{ color: "#9EB3A8" }}>Dashboard</Link>
        </div>
      </footer>
    </main>
  );
}