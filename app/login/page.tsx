"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { login } from "@/lib/api";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { saveToken, isLoggedIn, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isLoggedIn) router.push("/dashboard");
  }, [isLoggedIn, isLoading, router]);

  const handleLogin = async () => {
    setError("");
    if (!email.trim()) { setError("Email is required"); return; }
    if (!password.trim()) { setError("Password is required"); return; }
    setLoading(true);
    try {
      const data = await login(email, password);
      if (!data?.access_token) throw new Error("No token received");
      saveToken(data.access_token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return null;

  return (
    <main style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0A1224 0%, #0d1530 50%, #0A1224 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px", position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: "25%", right: "20%",
        width: "350px", height: "350px",
        background: "radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "25%", left: "20%",
        width: "280px", height: "280px",
        background: "radial-gradient(circle, rgba(96,165,250,0.07) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none",
      }} />

      <div style={{
        width: "100%", maxWidth: "420px",
        background: "rgba(16,26,51,0.7)",
        backdropFilter: "blur(30px)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "24px", padding: "40px",
        boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(37,99,235,0.1), inset 0 1px 0 rgba(255,255,255,0.08)",
        position: "relative", zIndex: 1,
      }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: "52px", height: "52px",
            background: "linear-gradient(135deg, rgba(37,99,235,0.3), rgba(96,165,250,0.2))",
            border: "1px solid rgba(37,99,235,0.4)",
            borderRadius: "14px", fontSize: "24px", marginBottom: "16px",
            boxShadow: "0 0 20px rgba(37,99,235,0.3)",
          }}>🧠</div>
          <h1 style={{
            fontSize: "22px", fontWeight: 800, margin: "0 0 4px",
            background: "linear-gradient(135deg, #F8FAFC, #94A3B8)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Welcome back
          </h1>
          <p style={{ color: "#475569", fontSize: "13px", margin: 0 }}>
            Login to your second brain
          </p>
        </div>

        {error && (
          <div style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
            color: "#f87171", borderRadius: "10px", padding: "12px 16px",
            fontSize: "13px", marginBottom: "20px",
          }}>
            ⚠ {error}
          </div>
        )}

        <div style={{ marginBottom: "16px" }}>
          <label style={{
            color: "#94A3B8", fontSize: "11px", fontWeight: 600,
            display: "block", marginBottom: "8px",
            textTransform: "uppercase", letterSpacing: "0.08em",
          }}>
            Email address
          </label>
          <input
            type="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="you@example.com"
            autoComplete="email" disabled={loading}
            style={{
              width: "100%", background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px", padding: "13px 16px",
              color: "#F8FAFC", fontSize: "14px", outline: "none",
              boxSizing: "border-box", transition: "all 0.2s",
            }}
            onFocus={e => { e.target.style.borderColor = "rgba(37,99,235,0.6)"; e.target.style.background = "rgba(255,255,255,0.07)"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.15)"; }}
            onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.background = "rgba(255,255,255,0.05)"; e.target.style.boxShadow = "none"; }}
          />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label style={{
            color: "#94A3B8", fontSize: "11px", fontWeight: 600,
            display: "block", marginBottom: "8px",
            textTransform: "uppercase", letterSpacing: "0.08em",
          }}>
            Password
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="••••••••"
              autoComplete="current-password" disabled={loading}
              style={{
                width: "100%", background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px", padding: "13px 48px 13px 16px",
                color: "#F8FAFC", fontSize: "14px", outline: "none",
                boxSizing: "border-box", transition: "all 0.2s",
              }}
              onFocus={e => { e.target.style.borderColor = "rgba(37,99,235,0.6)"; e.target.style.background = "rgba(255,255,255,0.07)"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.15)"; }}
              onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.background = "rgba(255,255,255,0.05)"; e.target.style.boxShadow = "none"; }}
            />
            <button onClick={() => setShowPassword(!showPassword)} style={{
              position: "absolute", right: "14px", top: "50%",
              transform: "translateY(-50%)",
              background: "none", border: "none",
              color: "#475569", cursor: "pointer", fontSize: "15px", padding: "4px",
            }}>
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        <button
          onClick={handleLogin} disabled={loading}
          style={{
            width: "100%",
            background: loading ? "rgba(37,99,235,0.4)" : "linear-gradient(135deg, #2563EB, #1d4ed8)",
            border: "none", borderRadius: "12px", padding: "14px",
            color: loading ? "rgba(255,255,255,0.5)" : "white",
            fontSize: "15px", fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            marginBottom: "24px",
            boxShadow: !loading ? "0 0 25px rgba(37,99,235,0.4)" : "none",
            transition: "all 0.2s",
          }}
        >
          {loading ? "Logging in..." : "Login →"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
          <span style={{ color: "#334155", fontSize: "12px" }}>Don't have an account?</span>
          <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
        </div>

        <Link href="/signup" style={{
          display: "block", textAlign: "center",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "12px", padding: "13px",
          color: "#94A3B8", fontSize: "14px", fontWeight: 500,
          transition: "all 0.2s",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(37,99,235,0.3)"; (e.currentTarget as HTMLAnchorElement).style.color = "#60A5FA"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLAnchorElement).style.color = "#94A3B8"; }}
        >
          Create a new account
        </Link>
      </div>
    </main>
  );
}