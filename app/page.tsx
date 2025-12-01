"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function LobbyPage() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    fetchUser();
  }, []);

  async function fetchUser() {
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (e) {
      console.error("Error fetching user:", e);
    }
  }

  if (!mounted) return null;

  return (
    <div style={{ overflowX: "hidden" }}>
      {/* Hero Section */}
      <section style={{
        position: "relative",
        padding: "120px 24px 80px",
        textAlign: "center",
        overflow: "hidden"
      }}>
        {/* Background Glow */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "60vw",
          height: "60vw",
          background: "radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)",
          opacity: 0.5,
          zIndex: -1,
          pointerEvents: "none"
        }} />

        <div className="animate-slide-up" style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{
            display: "inline-block",
            padding: "6px 16px",
            borderRadius: 20,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--accent)",
            marginBottom: 24
          }}>
            ✨ The Future of Industrial Parts
          </div>

          <h1 style={{
            fontSize: "clamp(40px, 6vw, 64px)",
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: 24,
            letterSpacing: "-0.02em"
          }}>
            Generate Industrial <br />
            <span className="text-gradient">Parts with AI</span>
          </h1>

          <p style={{
            fontSize: "clamp(16px, 2vw, 20px)",
            color: "var(--muted)",
            marginBottom: 40,
            lineHeight: 1.6,
            maxWidth: 600,
            marginLeft: "auto",
            marginRight: "auto"
          }}>
            Create detailed specifications, technical drawings, and documentation for manufacturing parts in seconds using advanced AI models.
          </p>

          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href={user ? "/generator" : "/register"} className="btn btn-primary" style={{ padding: "16px 32px", fontSize: 16 }}>
              {user ? "🚀 Start Generating" : "⚡ Get Started Free"}
            </Link>
            <Link href="/saved-global" className="btn btn-ghost" style={{ padding: "16px 32px", fontSize: 16 }}>
              🌐 Browse Catalog
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section style={{
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
        padding: "40px 24px"
      }}>
        <div style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 40,
          textAlign: "center"
        }}>
          {[
            { label: "Parts Generated", value: "100,000k+" },
            { label: "Active Users", value: "3+" },
            { label: "Processing Time", value: "< 3s" },
            { label: "Accuracy", value: "99.9%" },
          ].map((stat, i) => (
            <div key={i}>
              <div style={{ fontSize: 32, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>{stat.value}</div>
              <div style={{ fontSize: 14, color: "var(--muted)", fontWeight: 500 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16 }}>
              Everything you need to <span className="text-gradient">build faster</span>
            </h2>
            <p style={{ color: "var(--muted)", fontSize: 18, maxWidth: 600, margin: "0 auto" }}>
              Streamline your manufacturing workflow with our comprehensive suite of tools.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
            {[
              {
                icon: "⚡",
                title: "Instant Generation",
                desc: "Generate complete part specifications from simple text descriptions in seconds."
              },
              {
                icon: "🔍",
                title: "Smart Search",
                desc: "Find existing parts using semantic search that understands technical context."
              },
              {
                icon: "📊",
                title: "Batch Processing",
                desc: "Process thousands of parts simultaneously with our powerful batch engine."
              },
              {
                icon: "💾",
                title: "Global Catalog",
                desc: "Access a shared library of standardized parts contributed by the community."
              },
              {
                icon: "🔄",
                title: "Version Control",
                desc: "Track changes and manage revisions for all your technical specifications."
              },
              {
                icon: "📤",
                title: "Export Ready",
                desc: "Export to PDF, JSON, or CSV formats compatible with your existing ERP systems."
              }
            ].map((feature, i) => (
              <div key={i} className="card glass" style={{ padding: 32 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  marginBottom: 20
                }}>
                  {feature.icon}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>{feature.title}</h3>
                <p style={{ color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: "0 24px 100px" }}>
        <div className="glass" style={{
          maxWidth: 1200,
          margin: "0 auto",
          borderRadius: 24,
          padding: "60px 24px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{ position: "relative", zIndex: 2 }}>
            <h2 style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 800, marginBottom: 20 }}>
              Ready to transform your workflow?
            </h2>
            <p style={{ color: "var(--muted)", fontSize: 18, marginBottom: 40, maxWidth: 600, margin: "0 auto 40px" }}>
              Join hundreds of engineers and manufacturers using BIR Part Generator today.
            </p>

            {!user ? (
              <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
                <Link href="/register" className="btn btn-primary" style={{ padding: "16px 40px", fontSize: 16 }}>
                  Get Started Free
                </Link>
                <Link href="/login" className="btn btn-ghost" style={{ padding: "16px 40px", fontSize: 16 }}>
                  Login
                </Link>
              </div>
            ) : (
              <Link href="/generator" className="btn btn-primary" style={{ padding: "16px 40px", fontSize: 16 }}>
                Go to Dashboard
              </Link>
            )}
          </div>

          {/* Background decoration */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "linear-gradient(45deg, transparent 40%, var(--accent-glow) 100%)",
            opacity: 0.3,
            zIndex: 1
          }} />
        </div>
      </section>
    </div>
  );
}
