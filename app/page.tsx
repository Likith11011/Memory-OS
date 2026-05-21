"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Link from "next/link";

const features = [
  { icon: "🧠", title: "Semantic Search", desc: "Find memories by meaning, not just keywords. AI understands context." },
  { icon: "📄", title: "Multi-Format Upload", desc: "PDFs, Word docs, code, images, URLs, YouTube — everything supported." },
  { icon: "💬", title: "Chat with Memories", desc: "Ask questions and get AI answers grounded in your personal knowledge." },
  { icon: "🔬", title: "Research Recall", desc: "Auto-detect research papers, extract citations, page-level search." },
  { icon: "💻", title: "Code Snippets", desc: "Save code with syntax highlighting and language auto-detection." },
  { icon: "📚", title: "Exam Revision", desc: "AI explanations at easy, medium, or hard difficulty levels." },
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
      background: "linear-gradient(135deg, #0A1224 0%, #0d1530 40%, #0A1224 100%)",
      fontFamily: "'Inter', sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Ambient background orbs */}
      <div style={{
        position: "fixed", top: "10%", left: "20%",
        width: "500px", height: "500px",
        background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{
        position: "fixed", bottom: "20%", right: "15%",
        width: "400px", height: "400px",
        background: "radial-gradient(circle, rgba(96,165,250,0.08) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none", zIndex: 0,
      }} />

      {/* Navigation */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0,
        zIndex: 100,
        background: "rgba(10,18,36,0.8)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "0 40px",
        height: "64px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "32px", height: "32px",
            background: "linear-gradient(135deg, #2563EB, #60A5FA)",
            borderRadius: "8px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "16px",
          }}>🧠</div>
          <span style={{ fontWeight: 700, fontSize: "16px", color: "#F8FAFC" }}>
            MemoryOS <span style={{ color: "#60A5FA" }}></span>
          </span>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <Link href="/login" style={{
            color: "#94A3B8", fontSize: "14px", fontWeight: 500,
            padding: "8px 20px", borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.04)",
            transition: "all 0.2s",
          }}>
            Login
          </Link>
          <Link href="/signup" style={{
            color: "white", fontSize: "14px", fontWeight: 600,
            padding: "8px 20px", borderRadius: "10px",
            background: "linear-gradient(135deg, #2563EB, #1d4ed8)",
            boxShadow: "0 0 20px rgba(37,99,235,0.4)",
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
        padding: "100px 20px 60px",
        textAlign: "center",
      }}>
        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          background: "rgba(37,99,235,0.12)",
          border: "1px solid rgba(37,99,235,0.3)",
          borderRadius: "999px",
          padding: "6px 16px",
          marginBottom: "32px",
          color: "#60A5FA",
          fontSize: "13px", fontWeight: 500,
        }}>
          <span style={{
            width: "6px", height: "6px",
            background: "#60A5FA",
            borderRadius: "50%",
            boxShadow: "0 0 8px #60A5FA",
          }} />
          AI-Powered Second Brain
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: "clamp(3rem, 7vw, 5.5rem)",
          fontWeight: 800,
          lineHeight: 1.05,
          letterSpacing: "-0.03em",
          marginBottom: "24px",
          maxWidth: "800px",
        }}>
          <span style={{
            background: "linear-gradient(135deg, #F8FAFC 0%, #94A3B8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            Your Memory,{" "}
          </span>
          <span style={{
            background: "linear-gradient(135deg, #2563EB 0%, #60A5FA 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            Supercharged
          </span>
        </h1>

        {/* Subtitle */}
        <p style={{
          color: "#94A3B8",
          fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
          lineHeight: 1.7,
          maxWidth: "560px",
          marginBottom: "48px",
        }}>
          Upload notes, PDFs, code, and ideas. Retrieve them later using
          natural language — your AI second brain remembers everything.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap", marginBottom: "80px" }}>
          <Link href="/signup" style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            color: "white", fontSize: "15px", fontWeight: 600,
            padding: "14px 32px", borderRadius: "12px",
            background: "linear-gradient(135deg, #2563EB, #1d4ed8)",
            boxShadow: "0 0 30px rgba(37,99,235,0.5), 0 4px 20px rgba(0,0,0,0.3)",
            transition: "all 0.3s",
          }}>
            Start for free →
          </Link>
          <Link href="/login" style={{
            display: "inline-flex", alignItems: "center",
            color: "#94A3B8", fontSize: "15px", fontWeight: 500,
            padding: "14px 32px", borderRadius: "12px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(10px)",
            transition: "all 0.3s",
          }}>
            Sign in
          </Link>
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
          {["Semantic Search", "Vector Database", "RAG Chat", "Code Snippets", "Exam Revision", "Project Ideas"].map((f) => (
            <span key={f} style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#64748b",
              padding: "6px 14px", borderRadius: "999px",
              fontSize: "12px", fontWeight: 500,
            }}>
              {f}
            </span>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section style={{
        position: "relative", zIndex: 1,
        padding: "60px 40px 100px",
        maxWidth: "1100px", margin: "0 auto",
      }}>
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <h2 style={{
            fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
            fontWeight: 700, color: "#F8FAFC",
            marginBottom: "12px", letterSpacing: "-0.02em",
          }}>
            Everything you need
          </h2>
          <p style={{ color: "#94A3B8", fontSize: "15px" }}>
            Built with production AI techniques used by top companies
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "20px",
        }}>
          {features.map((f) => (
            <div key={f.title} style={{
              background: "rgba(255,255,255,0.04)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "20px",
              padding: "28px",
              transition: "all 0.3s ease",
              cursor: "default",
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.07)";
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(37,99,235,0.3)";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 40px rgba(0,0,0,0.3)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)";
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.08)";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
              }}
            >
              <div style={{
                width: "48px", height: "48px",
                background: "linear-gradient(135deg, rgba(37,99,235,0.2), rgba(96,165,250,0.1))",
                border: "1px solid rgba(37,99,235,0.3)",
                borderRadius: "12px",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "22px", marginBottom: "16px",
              }}>
                {f.icon}
              </div>
              <h3 style={{ color: "#F8FAFC", fontSize: "15px", fontWeight: 600, marginBottom: "8px" }}>
                {f.title}
              </h3>
              <p style={{ color: "#64748b", fontSize: "13px", lineHeight: 1.6 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}