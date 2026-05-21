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
    success: { bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)", text: "#10b981", icon: "✓" },
    error: { bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)", text: "#ef4444", icon: "✕" },
    info: { bg: "rgba(37,99,235,0.12)", border: "rgba(37,99,235,0.3)", text: "#60A5FA", icon: "ℹ" },
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
        backdropFilter: "blur(20px)",
        border: `1px solid ${c.border}`,
        borderRadius: "12px",
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
        minWidth: "280px",
        maxWidth: "400px",
      }}
    >
      <span style={{
        width: "24px", height: "24px",
        borderRadius: "50%",
        background: `${c.text}20`,
        border: `1px solid ${c.text}44`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: c.text, fontSize: "12px", fontWeight: 700,
        flexShrink: 0,
      }}>
        {c.icon}
      </span>
      <span style={{ color: "#E2E8F0", fontSize: "13px", fontWeight: 500, flex: 1 }}>
        {message}
      </span>
      <button
        onClick={() => { setExiting(true); setTimeout(onClose, 300); }}
        style={{
          background: "none", border: "none",
          color: "#475569", cursor: "pointer",
          fontSize: "14px", padding: "2px",
          flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
}