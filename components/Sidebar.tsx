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
  { label: "Search", href: "/search", icon: "⌕" },
  { label: "Chat", href: "/chat", icon: "◈" },
  { label: "Exam", href: "/exam", icon: "📚" },
  { label: "Projects", href: "/projects", icon: "🚀" },
  { label: "Insights", href: "/insights", icon: "📊" },
];

  const handleLogout = () => {
    try { localStorage.removeItem("token"); } catch {}
    window.location.href = "/";
  };

  const sidebarContent = (
    <aside style={{
      width: "240px",
      height: "100vh",
      background: "rgba(8,14,30,0.97)",
      backdropFilter: "blur(24px)",
      borderRight: "1px solid rgba(255,255,255,0.07)",
      padding: "24px 14px",
      display: "flex",
      flexDirection: "column",
      position: "fixed",
      left: isMobile ? (mobileOpen ? 0 : "-240px") : 0,
      top: 0,
      zIndex: 10,
      transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    }}>
      {/* Logo */}
      <div style={{
        marginBottom: "32px", paddingLeft: "8px",
        display: "flex", alignItems: "center", gap: "10px",
      }}>
        <div style={{
          width: "34px", height: "34px",
          background: "linear-gradient(135deg, #2563EB, #60A5FA)",
          borderRadius: "10px",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "18px",
          boxShadow: "0 0 20px rgba(37,99,235,0.4)",
          flexShrink: 0,
        }}>🧠</div>
        <div>
          <h1 style={{
            fontSize: "15px", fontWeight: 800,
            background: "linear-gradient(135deg, #F8FAFC, #60A5FA)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            margin: 0, lineHeight: 1.2,
          }}>
            MemoryOS
          </h1>
          <p style={{ color: "#1e3a5f", fontSize: "10px", margin: 0 }}>
            Your second brain
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "3px" }}>
        {navItems.map((item, idx) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="animate-slideInLeft"
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "10px 14px", borderRadius: "12px",
                textDecoration: "none",
                color: active ? "#60A5FA" : "#475569",
                background: active ? "rgba(37,99,235,0.14)" : "transparent",
                border: active ? "1px solid rgba(37,99,235,0.24)" : "1px solid transparent",
                fontSize: "14px", fontWeight: active ? 600 : 500,
                transition: "all 0.2s ease",
                animationDelay: `${idx * 0.05}s`,
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.color = "#94A3B8";
                  (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.05)";
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.color = "#475569";
                  (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                }
              }}
            >
              <span style={{ fontSize: "15px", opacity: active ? 1 : 0.5 }}>
                {item.icon}
              </span>
              {item.label}
              {active && (
                <div style={{
                  marginLeft: "auto",
                  width: "6px", height: "6px",
                  borderRadius: "50%",
                  background: "#2563EB",
                  boxShadow: "0 0 8px rgba(37,99,235,0.8)",
                }} />
              )}
            </Link>
          );
        })}
      </nav>

      <div style={{ height: "1px", background: "rgba(255,255,255,0.05)", margin: "12px 0" }} />

      <button
        onClick={handleLogout}
        style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "10px 14px", borderRadius: "12px",
          background: "transparent", border: "1px solid transparent",
          color: "#334155", fontSize: "14px", fontWeight: 500,
          cursor: "pointer", width: "100%", transition: "all 0.2s",
          textAlign: "left",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = "#ef4444";
          e.currentTarget.style.background = "rgba(239,68,68,0.07)";
          e.currentTarget.style.borderColor = "rgba(239,68,68,0.15)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = "#334155";
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.borderColor = "transparent";
        }}
      >
        <span style={{ fontSize: "14px" }}>⇤</span>
        Logout
      </button>
    </aside>
  );

  return (
    <>
      {/* Mobile hamburger */}
      {isMobile && (
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            position: "fixed", top: "16px", left: "16px", zIndex: 20,
            background: "rgba(16,26,51,0.9)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "10px",
            width: "40px", height: "40px",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: "18px",
            color: "#F8FAFC",
            boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
          }}
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      )}

      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 9,
            animation: "fadeIn 0.2s ease forwards",
          }}
        />
      )}

      {sidebarContent}
    </>
  );
}