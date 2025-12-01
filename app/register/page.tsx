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

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim() || !password || !name.trim()) {
      showToast("❌ Please fill in all fields", "error");
      return;
    }

    if (password.length < 6) {
      showToast("❌ Password must be at least 6 characters", "error");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("email", email.trim());
      formData.append("password", password);
      formData.append("name", name.trim());

      const res = await fetch("/api/register", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        showToast("✅ Account created successfully");
        setTimeout(() => {
          window.location.href = "/";
        }, 500);
      } else {
        showToast(`❌ ${data.error || "Registration failed"}`, "error");
      }
    } catch (e: any) {
      console.error("Register error:", e);
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
            Create Account
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Join us to start generating industrial parts
          </p>
        </div>

        <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text)" }}>
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              autoFocus
              className="input"
              style={{ padding: "12px 16px" }}
            />
          </div>

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
              className="input"
              style={{ padding: "12px 16px" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text)" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="input"
              style={{ padding: "12px 16px" }}
            />
            <p style={{ margin: "6px 0 0 0", fontSize: 11, color: "var(--muted)" }}>
              Must be at least 6 characters long
            </p>
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
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: "center", fontSize: 14, color: "var(--muted)" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
