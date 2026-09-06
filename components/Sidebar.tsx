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
    { label: "Chat", href: "/chat", icon: "💬" },
    { label: "Exam", href: "/exam", icon: "📚" },
    { label: "Projects", href: "/projects", icon: "🚀" },
    { label: "Insights", href: "/insights", icon: "📊" },
    { label: "Roadmap", href: "/roadmap", icon: "🗺️" },
  ];

  const handleLogout = () => {
    try { localStorage.removeItem("token"); } catch {}
    window.location.href = "/";
  };

  const sidebarContent = (
    <aside style={{
      width: "240px",
      height: "100vh",
      background: "#FFFFFF",
      borderRight: "1px solid #DDE7E2",
      padding: "24px 14px",
      display: "flex",
      flexDirection: "column",
      position: "fixed",
      left: isMobile ? (mobileOpen ? 0 : "-240px") : 0,
      top: 0,
      zIndex: 20,
      transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      boxShadow: "1px 0 3px rgba(16,35,29,0.02)",
    }}>
      {/* Logo */}
      <div style={{
        marginBottom: "28px", paddingLeft: "8px",
        display: "flex", alignItems: "center", gap: "10px",
      }}>
        <div style={{
          width: "36px", height: "36px",
          background: "linear-gradient(135deg, #064E3B 0%, #059669 100%)",
          borderRadius: "10px",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "18px",
          boxShadow: "0 2px 8px rgba(5,150,105,0.25)",
          flexShrink: 0,
          color: "#FFFFFF",
        }}>🧠</div>
        <div>
          <h1 style={{
            fontSize: "16px", fontWeight: 700,
            color: "#064E3B",
            margin: 0, lineHeight: 1.2,
            letterSpacing: "-0.01em",
          }}>
            MemoryOS
          </h1>
          <p style={{ color: "#7A8A84", fontSize: "11px", margin: 0, fontWeight: 500 }}>
            Knowledge Forest
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
        {navItems.map((item, idx) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="animate-slideInLeft"
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "9px 12px", borderRadius: "10px",
                textDecoration: "none",
                color: active ? "#064E3B" : "#52635C",
                background: active ? "#ECFDF5" : "transparent",
                border: active ? "1px solid #D1FAE5" : "1px solid transparent",
                fontSize: "13.5px", fontWeight: active ? 600 : 500,
                transition: "all 0.18s ease",
                animationDelay: `${idx * 0.04}s`,
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.color = "#10231D";
                  (e.currentTarget as HTMLAnchorElement).style.background = "#F1F5F3";
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.color = "#52635C";
                  (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                }
              }}
            >
              <span style={{ 
                fontSize: "15px", 
                color: active ? "#059669" : "#7A8A84",
                display: "flex", alignItems: "center"
              }}>
                {item.icon}
              </span>
              {item.label}
              {active && (
                <div style={{
                  marginLeft: "auto",
                  width: "6px", height: "6px",
                  borderRadius: "50%",
                  background: "#059669",
                  boxShadow: "0 0 6px rgba(5,150,105,0.6)",
                }} />
              )}
            </Link>
          );
        })}
      </nav>

      <div style={{ height: "1px", background: "#DDE7E2", margin: "12px 0" }} />

      <button
        onClick={handleLogout}
        style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "9px 12px", borderRadius: "10px",
          background: "transparent", border: "1px solid transparent",
          color: "#7A8A84", fontSize: "13.5px", fontWeight: 500,
          cursor: "pointer", width: "100%", transition: "all 0.18s",
          textAlign: "left",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = "#DC2626";
          e.currentTarget.style.background = "#FEF2F2";
          e.currentTarget.style.borderColor = "#FEE2E2";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = "#7A8A84";
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
            position: "fixed", top: "16px", left: "16px", zIndex: 30,
            background: "#FFFFFF",
            border: "1px solid #DDE7E2",
            borderRadius: "10px",
            width: "40px", height: "40px",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: "18px",
            color: "#10231D",
            boxShadow: "0 2px 8px rgba(16,35,29,0.08)",
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