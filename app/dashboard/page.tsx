"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";

// --- Components ---

function StatCard({ label, value, sub, icon, color = "var(--accent)" }: { label: string; value: string | number; sub?: string; icon?: React.ReactNode; color?: string }) {
  return (
    <div style={{
      background: "var(--card-bg)",
      border: "1px solid var(--border)",
      borderRadius: 16,
      padding: 24,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      position: "relative",
      overflow: "hidden",
      backdropFilter: "blur(10px)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--muted)" }}>{label}</div>
        {icon && <div style={{ color: color, opacity: 0.8 }}>{icon}</div>}
      </div>
      <div>
        <div style={{ fontSize: 32, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em" }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{sub}</div>}
      </div>
      <div style={{
        position: "absolute",
        top: -20,
        right: -20,
        width: 100,
        height: 100,
        background: color,
        opacity: 0.05,
        borderRadius: "50%",
        filter: "blur(40px)"
      }} />
    </div>
  );
}

function QuickActionCard({ title, desc, icon, href, color }: { title: string; desc: string; icon: string; href: string; color: string }) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div style={{
        background: "var(--card-bg)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: 24,
        height: "100%",
        transition: "transform 0.2s, border-color 0.2s",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 20
      }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.borderColor = color;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.borderColor = "var(--border)";
        }}
      >
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 12,
          background: `${color}20`,
          color: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>{title}</div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>{desc}</div>
        </div>
      </div>
    </Link>
  );
}

function BarChart({ data, max }: { data: { day: number; count: number }[]; max: number }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 200, paddingTop: 20 }}>
      {data.map((d, i) => {
        const heightPct = max > 0 ? (d.count / max) * 100 : 0;
        const isHovered = hoverIndex === i;

        return (
          <div
            key={d.day}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", position: "relative" }}
            onMouseEnter={() => setHoverIndex(i)}
            onMouseLeave={() => setHoverIndex(null)}
          >
            {/* Tooltip */}
            {isHovered && (
              <div style={{
                position: "absolute",
                bottom: `${heightPct}%`,
                marginBottom: 8,
                background: "var(--popover)",
                color: "var(--text)",
                padding: "4px 8px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                zIndex: 10,
                whiteSpace: "nowrap",
                pointerEvents: "none"
              }}>
                Day {d.day}: {d.count}
              </div>
            )}

            <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
              <div style={{
                width: "80%",
                height: `${Math.max(heightPct, 2)}%`,
                background: isHovered ? "var(--accent)" : "var(--primary)",
                borderRadius: "4px 4px 0 0",
                opacity: isHovered ? 1 : 0.7,
                transition: "all 0.2s ease",
                minHeight: 4
              }} />
            </div>
            <div style={{ marginTop: 8, fontSize: 10, color: "var(--muted)", opacity: i % 2 === 0 ? 1 : 0 }}>
              {d.day}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DonutChart({ data, size = 160 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let offset = 0;

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        {data.map((d, i) => {
          const portion = d.value / total;
          const dash = `${portion * circumference} ${circumference}`;
          const dashOffset = offset * circumference;
          offset += portion;

          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={d.color}
              strokeWidth={16}
              strokeDasharray={dash}
              strokeDashoffset={-dashOffset}
              strokeLinecap="round"
              style={{ transition: "all 0.3s ease" }}
            />
          );
        })}
      </svg>
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text)" }}>{total}</div>
        <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total</div>
      </div>
    </div>
  );
}

// --- Main Page ---

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [daily, setDaily] = useState<{ day: number; count: number }[]>([]);
  const [topUsers, setTopUsers] = useState<{ name: string; count: number }[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [cost, setCost] = useState<number>(0);
  const [periodStart, setPeriodStart] = useState<string | null>(null);
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<{ id: string; name?: string | null; avatar?: string | null; email?: string | null }[]>([]);
  const [onlineLoading, setOnlineLoading] = useState(false);

  // Fetch Summary Data
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/dashboard/summary", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load summary");
        const j = await res.json();
        setDaily(j.daily || Array.from({ length: 31 }).map((_, i) => ({ day: i + 1, count: 0 })));
        setTopUsers(j.topUsers || []);
        setTotal(j.total ?? 0);
        setCost(j.tokenStats?.cost || 0);
        setPeriodStart(j.periodStart);
        setPeriodEnd(j.periodEnd);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Fetch Online Users
  const loadOnlineUsers = async () => {
    try {
      setOnlineLoading(true);
      const res = await fetch("/api/dashboard/online", { cache: "no-store" });
      if (res.ok) {
        const j = await res.json();
        setOnlineUsers(Array.isArray(j.users) ? j.users.slice(0, 8) : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setOnlineLoading(false);
    }
  };

  useEffect(() => {
    loadOnlineUsers();
    const t = setInterval(loadOnlineUsers, 30000);
    return () => clearInterval(t);
  }, []);

  // Process Data for Charts
  const pieData = useMemo(() => {
    const arr = [...daily].sort((a, b) => b.count - a.count);
    const top = arr.slice(0, 5);
    const otherCount = arr.slice(5).reduce((s, d) => s + d.count, 0);

    const colors = ["#6366F1", "#EC4899", "#F59E0B", "#10B981", "#8B5CF6"];
    const data = top.map((d, i) => ({
      label: `Day ${d.day}`,
      value: d.count,
      color: colors[i]
    }));

    if (otherCount > 0) {
      data.push({ label: "Others", value: otherCount, color: "#9CA3AF" });
    }

    if (data.every(d => d.value === 0)) return [{ label: "No Data", value: 1, color: "#E5E7EB" }];
    return data;
  }, [daily]);

  const maxDaily = Math.max(1, ...daily.map(d => d.count));

  if (loading && !total) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
        <div className="spinner" style={{ margin: "0 auto 16px" }} />
        Loading dashboard...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>

      {/* Header */}
      <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "end" }}>
        <div>
          <h1 style={{
            fontSize: 36,
            fontWeight: 800,
            margin: "0 0 8px",
            background: "linear-gradient(135deg, var(--primary), var(--accent))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            Dashboard Overview
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 15, margin: 0 }}>
            Welcome back! Here's what's happening with your parts generation.
          </p>
        </div>
        <div style={{ textAlign: "right", fontSize: 13, color: "var(--muted)" }}>
          Period: <strong>{periodStart}</strong> - <strong>{periodEnd}</strong>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginBottom: 32 }}>
        <StatCard
          label="Total Generated"
          value={total}
          sub="Parts in current period"
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>}
        />
        <StatCard
          label="Active Users"
          value={onlineUsers.length}
          sub="Online right now"
          color="#10B981"
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>}
        />
        <StatCard
          label="Peak Daily"
          value={maxDaily}
          sub="Highest daily volume"
          color="#F59E0B"
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>}
        />
        <StatCard
          label="Estimated Cost"
          value={`$${cost.toFixed(2)}`}
          sub="Total API usage"
          color="#EF4444"
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>}
        />
      </div>

      {/* Main Content Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>

        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Activity Chart */}
          <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Activity Volume</h3>
              <select style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", fontSize: 12, color: "var(--text)" }}>
                <option>This Month</option>
              </select>
            </div>
            <BarChart data={daily} max={maxDaily} />
          </div>

          {/* Quick Actions */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <QuickActionCard
              title="New Generator"
              desc="Create a single part spec"
              icon="⚡"
              href="/generator"
              color="var(--primary)"
            />
            <QuickActionCard
              title="Batch Search"
              desc="Process multiple parts"
              icon="📦"
              href="/batch-search"
              color="var(--accent)"
            />
          </div>

          {/* Top Users Table */}
          <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 700 }}>Top Contributors</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)", textAlign: "left" }}>
                    <th style={{ padding: "12px 8px", fontWeight: 500 }}>Rank</th>
                    <th style={{ padding: "12px 8px", fontWeight: 500 }}>User</th>
                    <th style={{ padding: "12px 8px", fontWeight: 500, textAlign: "right" }}>Generated</th>
                  </tr>
                </thead>
                <tbody>
                  {topUsers.length > 0 ? topUsers.map((u, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px 8px", color: "var(--accent)", fontWeight: 700 }}>#{i + 1}</td>
                      <td style={{ padding: "12px 8px", fontWeight: 500 }}>{u.name}</td>
                      <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: "monospace" }}>{u.count}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={3} style={{ padding: 20, textAlign: "center", color: "var(--muted)" }}>No activity yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Usage Distribution */}
          <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <h3 style={{ margin: "0 0 24px", fontSize: 18, fontWeight: 700, alignSelf: "flex-start" }}>Usage Distribution</h3>
            <DonutChart data={pieData} />
            <div style={{ marginTop: 24, width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
              {pieData.map((d, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />
                    <span style={{ color: "var(--text)" }}>{d.label}</span>
                  </div>
                  <span style={{ fontWeight: 600, color: "var(--muted)" }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Online Users */}
          <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Online Users</h3>
              <span style={{ fontSize: 12, color: "var(--muted)", background: "var(--surface)", padding: "2px 8px", borderRadius: 10 }}>Live</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {onlineLoading ? (
                <div style={{ padding: 20, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>Loading users...</div>
              ) : onlineUsers.length === 0 ? (
                <div style={{ padding: 20, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>No users online</div>
              ) : (
                onlineUsers.map(u => (
                  <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 8, borderRadius: 8, transition: "background 0.2s", cursor: "default" }} className="hover:bg-white/5">
                    <div style={{ position: "relative" }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, overflow: "hidden", background: "var(--surface)", border: "1px solid var(--border)" }}>
                        {u.avatar ? (
                          <Image src={u.avatar} alt={u.name || "User"} width={40} height={40} style={{ objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontWeight: 700 }}>
                            {(u.name || "U").charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div style={{ position: "absolute", bottom: -2, right: -2, width: 12, height: 12, background: "#10B981", borderRadius: "50%", border: "2px solid var(--card-bg)" }} />
                    </div>
                    <div style={{ overflow: "hidden" }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name || "Unknown User"}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dashboard-root {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
