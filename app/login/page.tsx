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
      background: "#F8FAF9",
      color: "#10231D",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px", position: "relative", overflow: "hidden",
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Ambient background accents */}
      <div style={{
        position: "absolute", top: "20%", right: "20%",
        width: "400px", height: "400px",
        background: "radial-gradient(circle, rgba(5,150,105,0.06) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "20%", left: "20%",
        width: "350px", height: "350px",
        background: "radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none",
      }} />

      <div style={{
        width: "100%", maxWidth: "420px",
        background: "#FFFFFF",
        border: "1px solid #DDE7E2",
        borderRadius: "20px", padding: "38px",
        boxShadow: "0 20px 40px rgba(6,78,59,0.08), 0 2px 8px rgba(16,35,29,0.04)",
        position: "relative", zIndex: 1,
      }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: "50px", height: "50px",
            background: "linear-gradient(135deg, #064E3B 0%, #059669 100%)",
            borderRadius: "12px", fontSize: "24px", marginBottom: "14px",
            boxShadow: "0 4px 12px rgba(5,150,105,0.25)",
            color: "#FFFFFF",
          }}>🧠</div>
          <h1 style={{
            fontSize: "22px", fontWeight: 700, margin: "0 0 4px",
            color: "#064E3B",
          }}>
            Welcome back
          </h1>
          <p style={{ color: "#52635C", fontSize: "13px", margin: 0 }}>
            Sign in to your private knowledge base
          </p>
        </div>

        {error && (
          <div style={{
            background: "#FEF2F2", border: "1px solid #FEE2E2",
            color: "#DC2626", borderRadius: "10px", padding: "11px 14px",
            fontSize: "13px", marginBottom: "18px", fontWeight: 500,
          }}>
            ⚠ {error}
          </div>
        )}

        <div style={{ marginBottom: "16px" }}>
          <label style={{
            color: "#064E3B", fontSize: "11px", fontWeight: 700,
            display: "block", marginBottom: "6px",
            textTransform: "uppercase", letterSpacing: "0.06em",
          }}>
            Email address
          </label>
          <input
            type="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="you@example.com"
            autoComplete="email" disabled={loading}
            className="input-field"
            style={{
              width: "100%", padding: "12px 14px",
              fontSize: "14px", boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label style={{
            color: "#064E3B", fontSize: "11px", fontWeight: 700,
            display: "block", marginBottom: "6px",
            textTransform: "uppercase", letterSpacing: "0.06em",
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
              className="input-field"
              style={{
                width: "100%", padding: "12px 42px 12px 14px",
                fontSize: "14px", boxSizing: "border-box",
              }}
            />
            <button onClick={() => setShowPassword(!showPassword)} style={{
              position: "absolute", right: "12px", top: "50%",
              transform: "translateY(-50%)",
              background: "none", border: "none",
              color: "#7A8A84", cursor: "pointer", fontSize: "14px", padding: "4px",
            }}>
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        <button
          onClick={handleLogin} disabled={loading}
          className="btn-primary"
          style={{
            width: "100%", padding: "13px",
            fontSize: "14.5px", fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            marginBottom: "20px",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Signing in..." : "Sign in →"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
          <div style={{ flex: 1, height: "1px", background: "#DDE7E2" }} />
          <span style={{ color: "#7A8A84", fontSize: "12px" }}>Don't have an account?</span>
          <div style={{ flex: 1, height: "1px", background: "#DDE7E2" }} />
        </div>

        <Link href="/signup" className="btn-secondary" style={{
          width: "100%", textAlign: "center", padding: "12px",
          fontSize: "13.5px", boxSizing: "border-box",
        }}>
          Create a new account
        </Link>
      </div>
    </main>
  );
}