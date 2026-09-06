"use client";
import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = "success", onClose, duration = 3000 }: ToastProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const colors = {
    success: { bg: "#111E1A", border: "#1F3830", text: "#34D399", iconBg: "rgba(16, 185, 129, 0.15)", icon: "✓" },
    error: { bg: "#111E1A", border: "rgba(239, 68, 68, 0.3)", text: "#F87171", iconBg: "rgba(239, 68, 68, 0.15)", icon: "✕" },
    info: { bg: "#111E1A", border: "rgba(56, 189, 248, 0.3)", text: "#38BDF8", iconBg: "rgba(56, 189, 248, 0.15)", icon: "ℹ" },
  };

  const c = colors[type];

  return (
    <div
      className={`toast ${exiting ? "exit" : ""}`}
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 1000,
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: "14px",
        padding: "12px 18px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5), 0 0 15px rgba(16, 185, 129, 0.1)",
        minWidth: "280px",
        maxWidth: "400px",
      }}
    >
      <span style={{
        width: "24px", height: "24px",
        borderRadius: "50%",
        background: c.iconBg,
        border: `1px solid ${c.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: c.text, fontSize: "12px", fontWeight: 700,
        flexShrink: 0,
      }}>
        {c.icon}
      </span>
      <span style={{ color: "#F0FDF4", fontSize: "13px", fontWeight: 600, flex: 1 }}>
        {message}
      </span>
      <button
        onClick={() => { setExiting(true); setTimeout(onClose, 300); }}
        style={{
          background: "none", border: "none",
          color: "#9EB3A8", cursor: "pointer",
          fontSize: "14px", padding: "2px",
          flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
}