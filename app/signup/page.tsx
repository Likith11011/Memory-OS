"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { signup } from "@/lib/api";
import Link from "next/link";

interface PasswordStrength {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

function checkPassword(password: string): PasswordStrength {
  return {
    hasMinLength: password.length >= 6,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;'/`~]/.test(password),
  };
}

function StrengthRow({ met, label }: { met: boolean; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
      <div style={{
        width: "16px", height: "16px", borderRadius: "50%", flexShrink: 0,
        background: met ? "#ECFDF5" : "#F1F5F3",
        border: `1px solid ${met ? "#059669" : "#DDE7E2"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "9px", color: met ? "#059669" : "transparent",
        fontWeight: 700,
      }}>✓</div>
      <span style={{ color: met ? "#064E3B" : "#7A8A84", fontSize: "12px", fontWeight: met ? 600 : 400 }}>{label}</span>
    </div>
  );
}

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showStrength, setShowStrength] = useState(false);
  const { saveToken, isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  const strength = checkPassword(password);
  const allMet = Object.values(strength).every(Boolean);

  useEffect(() => {
    if (!isLoading && isLoggedIn) router.push("/dashboard");
  }, [isLoggedIn, isLoading, router]);

  const handleSignup = async () => {
    setError(""); setSuccess("");
    if (!email.trim()) { setError("Email is required"); return; }
    if (!allMet) { setError("Please meet all password requirements"); return; }
    setLoading(true);
    try {
      const data = await signup(email, password);
      if (!data?.access_token) throw new Error("No token received");
      setSuccess("Account created! Redirecting to dashboard...");
      saveToken(data.access_token);
      setTimeout(() => router.push("/dashboard"), 1200);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Signup failed");
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
      {/* Ambient forest accents */}
      <div style={{
        position: "absolute", top: "20%", left: "30%",
        width: "400px", height: "400px",
        background: "radial-gradient(circle, rgba(5,150,105,0.06) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "20%", right: "25%",
        width: "350px", height: "350px",
        background: "radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none",
      }} />

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: "440px",
        background: "#FFFFFF",
        border: "1px solid #DDE7E2",
        borderRadius: "20px",
        padding: "38px",
        boxShadow: "0 20px 40px rgba(6,78,59,0.08), 0 2px 8px rgba(16,35,29,0.04)",
        position: "relative", zIndex: 1,
      }}>
        {/* Logo */}
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
            Create your account
          </h1>
          <p style={{ color: "#52635C", fontSize: "13px", margin: 0 }}>
            Start building your private knowledge base
          </p>
        </div>

        {success && (
          <div style={{
            background: "#ECFDF5", border: "1px solid #A7F3D0",
            color: "#065F46", borderRadius: "10px", padding: "11px 14px",
            fontSize: "13px", marginBottom: "18px", fontWeight: 600,
          }}>
            ✓ {success}
          </div>
        )}

        {error && (
          <div style={{
            background: "#FEF2F2", border: "1px solid #FEE2E2",
            color: "#DC2626", borderRadius: "10px", padding: "11px 14px",
            fontSize: "13px", marginBottom: "18px", fontWeight: 500,
          }}>
            ⚠ {error}
          </div>
        )}

        {/* Email */}
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
            onKeyDown={(e) => e.key === "Enter" && handleSignup()}
            placeholder="you@example.com"
            autoComplete="email" disabled={loading}
            className="input-field"
            style={{
              width: "100%", padding: "12px 14px",
              fontSize: "14px", boxSizing: "border-box",
            }}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: "16px" }}>
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
              onFocus={() => setShowStrength(true)}
              onKeyDown={(e) => e.key === "Enter" && handleSignup()}
              placeholder="Create a strong password"
              autoComplete="new-password" disabled={loading}
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

          {showStrength && password.length > 0 && (
            <div style={{
              background: "#F8FAF9",
              border: "1px solid #DDE7E2",
              borderRadius: "10px", padding: "14px", marginTop: "10px",
            }}>
              <p style={{ color: "#064E3B", fontSize: "10px", fontWeight: 700, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Password requirements
              </p>
              <StrengthRow met={strength.hasMinLength} label="At least 6 characters" />
              <StrengthRow met={strength.hasUppercase} label="One uppercase letter (A-Z)" />
              <StrengthRow met={strength.hasLowercase} label="One lowercase letter (a-z)" />
              <StrengthRow met={strength.hasNumber} label="One number (0-9)" />
              <StrengthRow met={strength.hasSpecial} label="One special character (!@#$%...)" />
            </div>
          )}
        </div>

        <button
          onClick={handleSignup} disabled={loading || !allMet}
          className="btn-primary"
          style={{
            width: "100%", padding: "13px",
            fontSize: "14.5px", fontWeight: 600,
            cursor: loading || !allMet ? "not-allowed" : "pointer",
            marginTop: "6px", marginBottom: "20px",
            opacity: loading || !allMet ? 0.6 : 1,
          }}
        >
          {loading ? "Creating account..." : "Create account →"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
          <div style={{ flex: 1, height: "1px", background: "#DDE7E2" }} />
          <span style={{ color: "#7A8A84", fontSize: "12px" }}>Already have an account?</span>
          <div style={{ flex: 1, height: "1px", background: "#DDE7E2" }} />
        </div>

        <Link href="/login" className="btn-secondary" style={{
          width: "100%", textAlign: "center", padding: "12px",
          fontSize: "13.5px", boxSizing: "border-box",
        }}>
          Sign in to existing account
        </Link>
      </div>
    </main>
  );
}