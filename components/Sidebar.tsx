"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: "⊞" },
    { label: "Semantic Search", href: "/search", icon: "⌕" },
    { label: "AI Copilot", href: "/chat", icon: "💬" },
    { label: "Exam & Cards", href: "/exam", icon: "📚" },
    { label: "Quiz Test", href: "/quiz", icon: "🎯" },
    { label: "Kanban Board", href: "/projects", icon: "🚀" },
    { label: "Knowledge Graph", href: "/insights", icon: "📊" },
    { label: "Study Roadmap", href: "/roadmap", icon: "🗺️" },
  ];

  const handleLogout = () => {
    try { localStorage.removeItem("token"); } catch {}
    window.location.href = "/";
  };

  const sidebarContent = (
    <aside style={{
      width: "250px",
      height: "100vh",
      background: "linear-gradient(180deg, #0B1612 0%, #070E0B 100%)",
      borderRight: "1px solid #1F3830",
      padding: "20px 14px",
      display: "flex",
      flexDirection: "column",
      position: "fixed",
      left: isMobile ? (mobileOpen ? 0 : "-250px") : 0,
      top: 0,
      zIndex: 30,
      transition: "left 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      boxShadow: "4px 0 24px rgba(0,0,0,0.5)",
    }}>
      {/* Brand Header */}
      <Link href="/dashboard" style={{
        marginBottom: "22px", padding: "8px 10px",
        display: "flex", alignItems: "center", gap: "12px",
        borderRadius: "12px",
        background: "rgba(17, 30, 26, 0.6)",
        border: "1px solid rgba(31, 56, 48, 0.6)",
        transition: "all 0.2s ease",
        textDecoration: "none",
      }}>
        <div style={{
          width: "36px", height: "36px",
          background: "linear-gradient(135deg, #059669 0%, #10B981 100%)",
          borderRadius: "10px",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "18px",
          boxShadow: "0 0 16px rgba(16,185,129,0.35)",
          flexShrink: 0,
        }}>🧠</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <h1 style={{
              fontSize: "15px", fontWeight: 700,
              color: "#F0FDF4",
              margin: 0, lineHeight: 1.2,
              letterSpacing: "-0.01em",
            }}>
              MemoryOS
            </h1>
            <span style={{
              fontSize: "9px", fontWeight: 700,
              padding: "1px 5px", borderRadius: "4px",
              background: "rgba(16, 185, 129, 0.18)",
              color: "#34D399",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              letterSpacing: "0.04em",
            }}>PRO</span>
          </div>
          <p style={{ color: "#5D756C", fontSize: "11px", margin: 0, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            AI Second Brain
          </p>
        </div>
      </Link>

      {/* Nav List */}
      <div style={{
        fontSize: "10px", fontWeight: 700,
        color: "#5D756C", textTransform: "uppercase",
        letterSpacing: "0.08em", padding: "0 10px 8px 10px",
      }}>
        Workspace
      </div>

      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px", overflowY: "auto" }}>
        {navItems.map((item, idx) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="animate-slideInLeft"
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "8px 12px", borderRadius: "10px",
                textDecoration: "none",
                color: active ? "#34D399" : "#9EB3A8",
                background: active ? "rgba(16, 185, 129, 0.12)" : "transparent",
                border: active ? "1px solid rgba(16, 185, 129, 0.28)" : "1px solid transparent",
                fontSize: "13px", fontWeight: active ? 600 : 500,
                transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                animationDelay: `${idx * 0.03}s`,
                position: "relative",
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.color = "#F0FDF4";
                  (e.currentTarget as HTMLAnchorElement).style.background = "#14241E";
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.color = "#9EB3A8";
                  (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                }
              }}
            >
              <span style={{ 
                fontSize: "14px", 
                color: active ? "#10B981" : "#5D756C",
                display: "flex", alignItems: "center", width: "18px", justifyContent: "center",
              }}>
                {item.icon}
              </span>
              <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {item.label}
              </span>

              {active && (
                <div style={{
                  width: "6px", height: "6px",
                  borderRadius: "50%",
                  background: "#10B981",
                  boxShadow: "0 0 8px #10B981",
                }} />
              )}
            </Link>
          );
        })}
      </nav>

      <div style={{ height: "1px", background: "#1F3830", margin: "14px 0" }} />

      <button
        onClick={handleLogout}
        style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "8px 12px", borderRadius: "10px",
          background: "transparent", border: "1px solid transparent",
          color: "#5D756C", fontSize: "13px", fontWeight: 500,
          cursor: "pointer", width: "100%", transition: "all 0.18s",
          textAlign: "left",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = "#F87171";
          e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
          e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.25)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = "#5D756C";
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.borderColor = "transparent";
        }}
      >
        <span style={{ fontSize: "14px" }}>⇤</span>
        Sign out
      </button>
    </aside>
  );

  return (
    <>
      {/* Mobile hamburger */}
      {isMobile && (
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation"
          style={{
            position: "fixed", top: "16px", left: "16px", zIndex: 40,
            background: "#111E1A",
            border: "1px solid #1F3830",
            borderRadius: "10px",
            width: "40px", height: "40px",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: "18px",
            color: "#F0FDF4",
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
          }}
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      )}

      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="sidebar-overlay"
          style={{
            display: "block",
            animation: "fadeIn 0.2s ease forwards",
          }}
        />
      )}

      {sidebarContent}
    </>
  );
}