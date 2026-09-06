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
    success: { bg: "#FFFFFF", border: "#A7F3D0", text: "#059669", iconBg: "#ECFDF5", icon: "✓" },
    error: { bg: "#FFFFFF", border: "#FCA5A5", text: "#DC2626", iconBg: "#FEF2F2", icon: "✕" },
    info: { bg: "#FFFFFF", border: "#BFDBFE", text: "#2563EB", iconBg: "#EFF6FF", icon: "ℹ" },
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
        boxShadow: "0 10px 25px rgba(6, 78, 59, 0.08), 0 2px 6px rgba(16, 35, 29, 0.04)",
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
      <span style={{ color: "#10231D", fontSize: "13px", fontWeight: 600, flex: 1 }}>
        {message}
      </span>
      <button
        onClick={() => { setExiting(true); setTimeout(onClose, 300); }}
        style={{
          background: "none", border: "none",
          color: "#7A8A84", cursor: "pointer",
          fontSize: "14px", padding: "2px",
          flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
}