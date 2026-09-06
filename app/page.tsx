"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Link from "next/link";

const features = [
  { icon: "🧠", title: "Semantic Search", desc: "Find memories by meaning, not just keywords. AI understands context." },
  { icon: "📄", title: "Multi-Format Upload", desc: "PDFs, Word docs, code, images, URLs — all automatically indexed." },
  { icon: "💬", title: "Chat with Memories", desc: "Ask questions and get AI answers grounded in your personal knowledge." },
  { icon: "🔬", title: "Research Recall", desc: "Auto-detect research papers, extract citations, page-level search." },
  { icon: "💻", title: "Code Snippets", desc: "Save code with syntax highlighting and language auto-detection." },
  { icon: "📚", title: "Exam Revision", desc: "AI flashcards and quizzes at easy, medium, or hard difficulty levels." },
];

export default function Home() {
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isLoggedIn) router.push("/dashboard");
  }, [isLoggedIn, isLoading, router]);

  if (isLoading) return null;

  return (
    <main style={{
      minHeight: "100vh",
      background: "#F8FAF9",
      color: "#10231D",
      fontFamily: "'Inter', sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Subtle ambient forest gradients */}
      <div style={{
        position: "fixed", top: "-10%", left: "20%",
        width: "600px", height: "600px",
        background: "radial-gradient(circle, rgba(5,150,105,0.06) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{
        position: "fixed", bottom: "10%", right: "10%",
        width: "500px", height: "500px",
        background: "radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none", zIndex: 0,
      }} />

      {/* Navigation */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0,
        zIndex: 100,
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid #DDE7E2",
        padding: "0 40px",
        height: "64px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "34px", height: "34px",
            background: "linear-gradient(135deg, #064E3B 0%, #059669 100%)",
            borderRadius: "9px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "17px",
            boxShadow: "0 2px 8px rgba(5,150,105,0.2)",
            color: "#FFFFFF",
          }}>🧠</div>
          <span style={{ fontWeight: 800, fontSize: "17px", color: "#064E3B", letterSpacing: "-0.01em" }}>
            MemoryOS
          </span>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <Link href="/login" className="btn-secondary" style={{
            padding: "8px 18px", borderRadius: "10px", fontSize: "14px",
          }}>
            Sign in
          </Link>
          <Link href="/signup" className="btn-primary" style={{
            padding: "8px 20px", borderRadius: "10px", fontSize: "14px",
          }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero section */}
      <section style={{
        position: "relative", zIndex: 1,
        minHeight: "100vh",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "120px 20px 60px",
        textAlign: "center",
      }}>
        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          background: "#ECFDF5",
          border: "1px solid #D1FAE5",
          borderRadius: "999px",
          padding: "6px 16px",
          marginBottom: "28px",
          color: "#065F46",
          fontSize: "13px", fontWeight: 600,
          boxShadow: "0 1px 3px rgba(5,150,105,0.06)",
        }}>
          <span style={{
            width: "7px", height: "7px",
            background: "#059669",
            borderRadius: "50%",
            boxShadow: "0 0 6px rgba(5,150,105,0.6)",
          }} />
          AI-Powered Second Brain
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: "clamp(2.8rem, 6.5vw, 5rem)",
          fontWeight: 800,
          lineHeight: 1.08,
          letterSpacing: "-0.03em",
          marginBottom: "22px",
          maxWidth: "800px",
        }}>
          <span style={{ color: "#064E3B" }}>
            Your Memory,{" "}
          </span>
          <br />
          <span style={{ color: "#059669" }}>
            Supercharged
          </span>
        </h1>

        {/* Subtitle */}
        <p style={{
          color: "#52635C",
          fontSize: "clamp(1.05rem, 2.2vw, 1.25rem)",
          lineHeight: 1.65,
          maxWidth: "600px",
          marginBottom: "40px",
        }}>
          Upload notes, PDFs, code, and ideas. Retrieve them later using
          natural language — your AI second brain remembers everything.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap", marginBottom: "64px" }}>
          <Link href="/signup" className="btn-primary" style={{
            padding: "14px 34px", borderRadius: "12px", fontSize: "15px",
          }}>
            Start for free →
          </Link>
          <Link href="/login" className="btn-secondary" style={{
            padding: "14px 30px", borderRadius: "12px", fontSize: "15px",
          }}>
            Sign in
          </Link>
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
          {["Semantic Search", "Vector Embeddings", "RAG Chat", "Code Snippets", "Exam Revision", "Knowledge Graph"].map((f) => (
            <span key={f} style={{
              background: "#FFFFFF",
              border: "1px solid #DDE7E2",
              color: "#52635C",
              padding: "6px 14px", borderRadius: "999px",
              fontSize: "12px", fontWeight: 500,
              boxShadow: "0 1px 2px rgba(16,35,29,0.02)",
            }}>
              {f}
            </span>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section style={{
        position: "relative", zIndex: 1,
        padding: "40px 24px 100px",
        maxWidth: "1100px", margin: "0 auto",
      }}>
        <div style={{ textAlign: "center", marginBottom: "50px" }}>
          <h2 style={{
            fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)",
            fontWeight: 700, color: "#064E3B",
            marginBottom: "10px", letterSpacing: "-0.02em",
          }}>
            Everything you need
          </h2>
          <p style={{ color: "#52635C", fontSize: "15px" }}>
            Built with production-grade AI vector retrieval & contextual memory
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "20px",
        }}>
          {features.map((f) => (
            <div key={f.title} style={{
              background: "#FFFFFF",
              border: "1px solid #DDE7E2",
              borderRadius: "18px",
              padding: "26px",
              transition: "all 0.2s ease",
              boxShadow: "0 1px 3px rgba(16, 35, 29, 0.03)",
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "#B5D1C5";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(6, 78, 59, 0.06)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "#DDE7E2";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 3px rgba(16, 35, 29, 0.03)";
              }}
            >
              <div style={{
                width: "46px", height: "46px",
                background: "#ECFDF5",
                border: "1px solid #D1FAE5",
                borderRadius: "12px",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "20px", marginBottom: "16px",
              }}>
                {f.icon}
              </div>
              <h3 style={{ color: "#064E3B", fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>
                {f.title}
              </h3>
              <p style={{ color: "#52635C", fontSize: "13.5px", lineHeight: 1.6 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}