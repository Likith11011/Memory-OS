"use client";
import { useEffect, useState } from "react";
import { wakeUpBackend } from "@/lib/api";

export default function BackendWaker() {
  const [status, setStatus] = useState<"waking" | "ready" | "idle">("idle");

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${API_BASE}/ping`, {
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) throw new Error("not ready");
        setStatus("ready");
      } catch {
        // Backend is sleeping — wake it
        setStatus("waking");
        await wakeUpBackend();
        setStatus("ready");
      }
    };

    checkBackend();

    // Ping every 10 minutes to keep Render alive
    const interval = setInterval(() => {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      fetch(`${API_BASE}/ping`, { signal: AbortSignal.timeout(5000) }).catch(() => {});
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (status !== "waking") return null;

  return (
    <div style={{
      position: "fixed",
      top: "16px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 9999,
      background: "#111E1A",
      border: "1px solid #1F3830",
      borderRadius: "999px",
      padding: "8px 18px",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      boxShadow: "0 6px 20px rgba(0, 0, 0, 0.6), 0 0 12px rgba(16, 185, 129, 0.15)",
    }}>
      <div style={{
        width: "8px", height: "8px", borderRadius: "50%",
        background: "#F59E0B",
        animation: "pulse 1s ease-in-out infinite",
      }} />
      <style>{`@keyframes pulse { 0%,100%{opacity:0.4;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }`}</style>
      <span style={{ color: "#9EB3A8", fontSize: "12.5px", fontWeight: 500 }}>
        Waking up server... first load takes ~30 seconds
      </span>
    </div>
  );
}