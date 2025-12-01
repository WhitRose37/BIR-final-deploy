"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function showToast(msg: string, type: "success" | "error" = "success") {
  const t = document.createElement("div");
  t.className = `toast toast--${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => {
    t.classList.add("toast--hide");
    setTimeout(() => t.remove(), 400);
  }, 2000);
}

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim() || !password) {
      showToast("❌ Please enter Email and Password", "error");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        showToast("✅ Login successful", "success");
        setTimeout(() => {
          window.location.href = "/";
        }, 500);
      } else {
        showToast(`❌ ${data.error || "Login failed"}`, "error");
      }
    } catch (e: any) {
      console.error("Login error:", e);
      showToast(`❌ ${e?.message || "Network error"}`, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Background Decoration */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "100%",
        height: "100%",
        background: "radial-gradient(circle at center, var(--accent-glow) 0%, transparent 70%)",
        opacity: 0.4,
        zIndex: -1
      }} />

      <div className="glass animate-slide-up" style={{
        maxWidth: 420,
        width: "100%",
        padding: 40,
        borderRadius: 24,
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{
            fontSize: 32,
            fontWeight: 800,
            marginBottom: 8,
            background: "linear-gradient(135deg, var(--text), var(--muted))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            Welcome Back
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Enter your credentials to access your account
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text)" }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
              autoFocus
              className="input"
              style={{ padding: "12px 16px" }}
            />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                Password
              </label>
              <a href="#" style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none" }}>
                Forgot password?
              </a>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="input"
              style={{ padding: "12px 16px" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: "100%",
              padding: "14px",
              marginTop: 8,
              fontSize: 15,
              justifyContent: "center"
            }}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 16, height: 16, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%" }} />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: "center", fontSize: 14, color: "var(--muted)" }}>
          Don't have an account?{" "}
          <Link href="/register" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>
            Create account
          </Link>
        </div>

        {/* Demo Credentials Hint */}
        <div style={{
          marginTop: 32,
          padding: 16,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          fontSize: 12,
          color: "var(--muted)"
        }}>
          <div style={{ fontWeight: 600, marginBottom: 4, color: "var(--text)" }}>💡 Demo Account</div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Email: admin@example.com</span>
            <span>Pass: admin123</span>
          </div>
        </div>
      </div>
    </div>
  );
}
