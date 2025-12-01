"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function AdminPage() {
    const router = useRouter();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searching, setSearching] = useState("");
    const [page, setPage] = useState(1);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ name: "", role: "USER", status: "ACTIVE" });
    const [deleting, setDeleting] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [hoveredUserId, setHoveredUserId] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [summary, setSummary] = useState<any>(null);
    const [addUserModalOpen, setAddUserModalOpen] = useState(false);
    const [newUserForm, setNewUserForm] = useState({ name: "", email: "", password: "", role: "USER" });
    const [addingUser, setAddingUser] = useState(false);

    useEffect(() => {
        fetchCurrentUser();
    }, []);

    useEffect(() => {
        if (user) {
            fetchUsers();
            fetchSummary();
        }
    }, [user, page, searching]);

    async function fetchCurrentUser() {
        try {
            const res = await fetch("/api/me", { cache: "no-store" });
            if (res.ok) {
                const data = await res.json();
                setUser(data);
            } else {
                router.push("/login");
            }
        } catch (e) {
            console.error("Error fetching current user:", e);
            router.push("/login");
        }
    }

    async function fetchUsers() {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch(`/api/admin/users?page=${page}&limit=10`, {
                cache: "no-store",
                credentials: "include",
            });

            if (res.status === 403 || res.status === 401) {
                router.push("/");
                return;
            }

            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            } else {
                setError("Failed to load users");
            }
        } catch (e: any) {
            console.error("[admin] Error fetching users:", e);
            setError("Error loading users");
        } finally {
            setLoading(false);
        }
    }

    async function fetchSummary() {
        try {
            const res = await fetch("/api/dashboard/summary", { cache: "no-store" });
            if (res.ok) {
                setSummary(await res.json());
            } else {
                setSummary(null);
            }
        } catch (e) {
            console.error("Error fetching summary:", e);
        }
    }

    async function fetchUserDetail(userId: string, event: React.MouseEvent) {
        try {
            setLoadingDetail(true);
            setHoveredUserId(userId);

            // Calculate position to keep tooltip on screen
            const x = event.clientX + 20;
            const y = event.clientY - 100;
            setTooltipPos({ x, y });

            const res = await fetch(`/api/admin/users/${userId}`, { cache: "no-store" });
            if (res.ok) {
                const data = await res.json();
                setSelectedUser(data);
            }
        } catch (e) {
            console.error("Error fetching user detail:", e);
        } finally {
            setLoadingDetail(false);
        }
    }

    function handleEdit(user: any) {
        setEditingId(user.id);
        setEditForm({
            name: user.name || "",
            role: user.role,
            status: user.status,
        });
    }

    async function handleSave(userId: string) {
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm),
            });

            if (res.ok) {
                showToast("✅ User updated successfully");
                setEditingId(null);
                fetchUsers();
            } else {
                const data = await res.json();
                showToast(`❌ ${data.error || "Update failed"}`, "error");
            }
        } catch (e: any) {
            showToast(`❌ ${e?.message || "Error updating user"}`, "error");
        }
    }

    async function handleDelete(userId: string) {
        if (!confirm("Are you sure you want to delete this user?")) return;

        try {
            setDeleting(userId);
            const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });

            if (res.ok) {
                showToast("✅ User deleted successfully");
                fetchUsers();
            } else {
                const data = await res.json();
                showToast(`❌ ${data.error || "Delete failed"}`, "error");
            }
        } catch (e: any) {
            showToast(`❌ ${e?.message || "Error deleting user"}`, "error");
        } finally {
            setDeleting(null);
        }
    }

    async function handleAddUser() {
        try {
            setAddingUser(true);
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newUserForm),
            });

            if (res.ok) {
                showToast("✅ User created successfully");
                setAddUserModalOpen(false);
                setNewUserForm({ name: "", email: "", password: "", role: "USER" });
                fetchUsers();
            } else {
                const data = await res.json();
                showToast(`❌ ${data.error || "Creation failed"}`, "error");
            }
        } catch (e: any) {
            showToast(`❌ ${e?.message || "Error creating user"}`, "error");
        } finally {
            setAddingUser(false);
        }
    }

    function showToast(msg: string, type: "success" | "error" = "success") {
        const existingToasts = document.querySelectorAll('.toast');
        const offset = existingToasts.length * 80 + 24; // Stack from bottom

        const t = document.createElement("div");
        t.className = `toast toast--${type}`;
        t.style.bottom = `${offset}px`;

        // Clean message and determine icon
        const cleanMsg = msg.replace(/^[✅❌]\s*/, '');
        const icon = type === 'success'
            ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'
            : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

        const title = type === 'success' ? 'Success' : 'Error';

        t.innerHTML = `
            <div style="
                display: flex; 
                align-items: center; 
                justify-content: center; 
                width: 32px; 
                height: 32px; 
                border-radius: 50%; 
                background: ${type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}; 
                color: ${type === 'success' ? '#10b981' : '#ef4444'};
                flex-shrink: 0;
            ">
                ${icon}
            </div>
            <div style="display: flex; flex-direction: column; gap: 2px;">
                <span style="font-weight: 700; font-size: 14px; color: var(--text);">${title}</span>
                <span style="font-size: 13px; color: var(--muted); line-height: 1.4;">${cleanMsg}</span>
            </div>
        `;

        document.body.appendChild(t);

        // Remove after 3 seconds
        setTimeout(() => {
            t.style.opacity = '0';
            t.style.transform = 'translateY(20px) scale(0.95)';
            t.style.transition = 'all 0.3s ease-in';

            setTimeout(() => {
                t.remove();
                // Adjust positions of remaining toasts could be complex, 
                // but for simple usage, just letting them disappear is fine.
            }, 300);
        }, 3000);
    }

    if (loading && !user) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                <div className="spinner" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container" style={{ marginTop: 40 }}>
                <div className="card glass" style={{ textAlign: "center", padding: 40 }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
                    <h2 style={{ marginBottom: 8 }}>Something went wrong</h2>
                    <p style={{ color: "var(--danger)", marginBottom: 24 }}>{error}</p>
                    <button onClick={fetchUsers} className="btn btn-primary">
                        🔄 Retry Connection
                    </button>
                </div>
            </div>
        );
    }

    if (user?.role !== "ADMIN" && user?.role !== "OWNER") {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                <div className="card glass" style={{ padding: 40, textAlign: "center" }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
                    <h2>Access Denied</h2>
                    <p style={{ color: "var(--muted)" }}>You don't have permission to view this page.</p>
                    <Link href="/" className="btn btn-ghost" style={{ marginTop: 24 }}>
                        Go Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 32 }}>
                <div>
                    <h1 style={{
                        fontSize: 32,
                        fontWeight: 800,
                        marginBottom: 8,
                        background: "linear-gradient(135deg, var(--text), var(--muted))",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent"
                    }}>
                        User Management
                    </h1>
                    <p style={{ color: "var(--muted)", fontSize: 14 }}>
                        Manage system access and user roles • <span style={{ color: "var(--accent)" }}>{user?.role} Access</span>
                    </p>
                </div>

                {summary && (
                    <div className="glass" style={{ padding: "12px 24px", borderRadius: 12, display: "flex", gap: 24 }}>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>TOTAL USERS</div>
                            <div style={{ fontSize: 20, fontWeight: 800 }}>{summary.totalUsers || users.length}</div>
                        </div>
                        <div style={{ width: 1, background: "var(--border)" }} />
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>ACTIVE</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--primary)" }}>{summary.activeUsers || "-"}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="glass" style={{ padding: 16, borderRadius: 16, marginBottom: 24, display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{ position: "relative", flex: 1 }}>
                    <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", opacity: 0.5 }}>🔍</div>
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={searching}
                        onChange={(e) => {
                            setSearching(e.target.value);
                            setPage(1);
                        }}
                        className="input"
                        style={{ paddingLeft: 44, background: "var(--bg)" }}
                    />
                </div>
                <button onClick={fetchUsers} className="btn btn-secondary" style={{ whiteSpace: "nowrap" }}>
                    🔄 Refresh List
                </button>
                <button
                    onClick={() => setAddUserModalOpen(true)}
                    className="btn btn-primary"
                    style={{ whiteSpace: "nowrap" }}
                >
                    + Add User
                </button>
            </div>

            {/* Add User Modal */}
            {addUserModalOpen && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.6)",
                        backdropFilter: "blur(8px)",
                        zIndex: 1000,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 16
                    }}
                    onClick={() => setAddUserModalOpen(false)}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        className="glass"
                        style={{
                            width: "100%",
                            maxWidth: 480,
                            borderRadius: 24,
                            padding: 32,
                            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                            animation: "scaleIn 0.2s ease-out",
                            border: "1px solid var(--border)"
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                            <div>
                                <h2 style={{
                                    margin: 0,
                                    fontSize: 24,
                                    fontWeight: 700,
                                    background: "linear-gradient(135deg, var(--text), var(--muted))",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent"
                                }}>Add New User</h2>
                                <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>Create a new account for your team</p>
                            </div>
                            <button
                                onClick={() => setAddUserModalOpen(false)}
                                style={{
                                    background: "var(--surface)",
                                    border: "1px solid var(--border)",
                                    borderRadius: "50%",
                                    width: 32,
                                    height: 32,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 18,
                                    cursor: "pointer",
                                    color: "var(--muted)",
                                    transition: "all 0.2s"
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = "var(--text)";
                                    e.currentTarget.style.color = "var(--text)";
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = "var(--border)";
                                    e.currentTarget.style.color = "var(--muted)";
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); handleAddUser(); }}>
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 13, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Full Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    style={{
                                        width: "100%",
                                        padding: "12px 16px",
                                        borderRadius: 12,
                                        fontSize: 15
                                    }}
                                    value={newUserForm.name}
                                    onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })}
                                    placeholder="e.g. John Doe"
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 13, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Email Address</label>
                                <input
                                    type="email"
                                    className="input"
                                    style={{
                                        width: "100%",
                                        padding: "12px 16px",
                                        borderRadius: 12,
                                        fontSize: 15
                                    }}
                                    value={newUserForm.email}
                                    onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })}
                                    placeholder="john@example.com"
                                    required
                                />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
                                <div>
                                    <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 13, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Password</label>
                                    <input
                                        type="password"
                                        className="input"
                                        style={{
                                            width: "100%",
                                            padding: "12px 16px",
                                            borderRadius: 12,
                                            fontSize: 15
                                        }}
                                        value={newUserForm.password}
                                        onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })}
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 13, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Role</label>
                                    <div style={{ position: "relative" }}>
                                        <select
                                            className="input"
                                            style={{
                                                width: "100%",
                                                padding: "12px 16px",
                                                borderRadius: 12,
                                                fontSize: 15,
                                                appearance: "none",
                                                cursor: "pointer"
                                            }}
                                            value={newUserForm.role}
                                            onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value })}
                                        >
                                            <option value="USER">User</option>
                                            <option value="ADMIN">Admin</option>
                                        </select>
                                        <div style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--muted)", fontSize: 12 }}>▼</div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", paddingTop: 20, borderTop: "1px solid var(--border)" }}>
                                <button
                                    type="button"
                                    onClick={() => setAddUserModalOpen(false)}
                                    className="btn btn-ghost"
                                    style={{ padding: "10px 24px" }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={addingUser}
                                    style={{
                                        padding: "10px 24px",
                                        minWidth: 120,
                                        display: "flex",
                                        justifyContent: "center"
                                    }}
                                >
                                    {addingUser ? (
                                        <div className="spinner" style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
                                    ) : (
                                        "Create User"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Users Table */}
            <div className="glass" style={{ borderRadius: 16, overflow: "hidden" }}>
                {loading ? (
                    <div style={{ padding: 60, textAlign: "center", color: "var(--muted)" }}>
                        <div className="spinner" style={{ margin: "0 auto 16px" }} />
                        Loading users...
                    </div>
                ) : users.length === 0 ? (
                    <div style={{ padding: 60, textAlign: "center", color: "var(--muted)" }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
                        <h3>No users found</h3>
                        <p>Try adjusting your search terms</p>
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                            <thead>
                                <tr style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                                    <th style={{ textAlign: "left", padding: "16px 24px", fontWeight: 600, color: "var(--muted)" }}>User</th>
                                    <th style={{ textAlign: "left", padding: "16px 24px", fontWeight: 600, color: "var(--muted)" }}>Role</th>
                                    <th style={{ textAlign: "left", padding: "16px 24px", fontWeight: 600, color: "var(--muted)" }}>Status</th>
                                    <th style={{ textAlign: "left", padding: "16px 24px", fontWeight: 600, color: "var(--muted)" }}>Joined</th>
                                    <th style={{ textAlign: "right", padding: "16px 24px", fontWeight: 600, color: "var(--muted)" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr
                                        key={u.id}
                                        style={{ borderBottom: "1px solid var(--border)", transition: "background 0.2s" }}
                                        className="hover:bg-white/5"
                                    >
                                        <td style={{ padding: "16px 24px" }}>
                                            <div
                                                style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
                                                onMouseEnter={(e) => fetchUserDetail(u.id, e)}
                                                onMouseLeave={() => {
                                                    if (hoveredUserId === u.id) {
                                                        setSelectedUser(null);
                                                        setHoveredUserId(null);
                                                    }
                                                }}
                                            >
                                                <div style={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: 10,
                                                    background: "var(--surface)",
                                                    border: "1px solid var(--border)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontWeight: 700,
                                                    color: "var(--accent)",
                                                    overflow: "hidden"
                                                }}>
                                                    {u.avatar ? (
                                                        <Image src={u.avatar} alt={u.name} width={40} height={40} style={{ objectFit: "cover" }} />
                                                    ) : (
                                                        (u.name || "U").charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    {editingId === u.id ? (
                                                        <input
                                                            type="text"
                                                            value={editForm.name}
                                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                            className="input"
                                                            style={{ padding: "4px 8px", fontSize: 13 }}
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <div style={{ fontWeight: 600, color: "var(--text)" }}>{u.name || "Unknown"}</div>
                                                    )}
                                                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: "16px 24px" }}>
                                            {editingId === u.id ? (
                                                <select
                                                    value={editForm.role}
                                                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                                    className="input"
                                                    style={{ padding: "4px 8px", fontSize: 13 }}
                                                >
                                                    <option value="USER">User</option>
                                                    <option value="ADMIN">Admin</option>
                                                    <option value="OWNER">Owner</option>
                                                </select>
                                            ) : (
                                                <span style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: 6,
                                                    padding: "4px 10px",
                                                    borderRadius: 20,
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                    background: u.role === "ADMIN" ? "rgba(239, 68, 68, 0.1)" : u.role === "OWNER" ? "rgba(245, 158, 11, 0.1)" : "rgba(16, 185, 129, 0.1)",
                                                    color: u.role === "ADMIN" ? "#ef4444" : u.role === "OWNER" ? "#f59e0b" : "#10b981",
                                                    border: `1px solid ${u.role === "ADMIN" ? "rgba(239, 68, 68, 0.2)" : u.role === "OWNER" ? "rgba(245, 158, 11, 0.2)" : "rgba(16, 185, 129, 0.2)"}`
                                                }}>
                                                    {u.role === "OWNER" && "👑"}
                                                    {u.role === "ADMIN" && "🛡️"}
                                                    {u.role === "USER" && "👤"}
                                                    {u.role}
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: "16px 24px" }}>
                                            {editingId === u.id ? (
                                                <select
                                                    value={editForm.status}
                                                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                                    className="input"
                                                    style={{ padding: "4px 8px", fontSize: 13 }}
                                                >
                                                    <option value="ACTIVE">Active</option>
                                                    <option value="INACTIVE">Inactive</option>
                                                    <option value="SUSPENDED">Suspended</option>
                                                </select>
                                            ) : (
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                    <div style={{
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: "50%",
                                                        background: u.status === "ACTIVE" ? "#10b981" : "#ef4444",
                                                        boxShadow: `0 0 8px ${u.status === "ACTIVE" ? "rgba(16, 185, 129, 0.4)" : "rgba(239, 68, 68, 0.4)"}`
                                                    }} />
                                                    <span style={{ fontSize: 13, color: "var(--text)" }}>{u.status}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: "16px 24px", color: "var(--muted)", fontSize: 13 }}>
                                            {new Date(u.createdAt).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: "16px 24px", textAlign: "right" }}>
                                            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                                                {editingId === u.id ? (
                                                    <>
                                                        <button onClick={() => handleSave(u.id)} className="btn btn-primary" style={{ padding: "6px 12px", fontSize: 12 }}>
                                                            Save
                                                        </button>
                                                        <button onClick={() => setEditingId(null)} className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }}>
                                                            Cancel
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleEdit(u)}
                                                            className="btn btn-ghost"
                                                            style={{ padding: "8px", color: "var(--muted)" }}
                                                            title="Edit User"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(u.id)}
                                                            className="btn btn-ghost"
                                                            style={{ padding: "8px", color: "var(--danger)" }}
                                                            title="Delete User"
                                                            disabled={deleting === u.id}
                                                        >
                                                            {deleting === u.id ? "⏳" : "🗑️"}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modern Tooltip Card */}
            {selectedUser && hoveredUserId && !loadingDetail && (
                <div
                    className="glass"
                    style={{
                        position: "fixed",
                        top: tooltipPos.y,
                        left: tooltipPos.x,
                        padding: 24,
                        width: 300,
                        borderRadius: 16,
                        zIndex: 100,
                        animation: "fadeIn 0.2s ease-out",
                        pointerEvents: "none",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                        <div style={{
                            width: 56,
                            height: 56,
                            borderRadius: 16,
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 24,
                            fontWeight: 700,
                            color: "var(--accent)"
                        }}>
                            {selectedUser.avatar ? (
                                <Image src={selectedUser.avatar} alt={selectedUser.name} width={56} height={56} style={{ borderRadius: 16 }} />
                            ) : (
                                (selectedUser.name || "U").charAt(0).toUpperCase()
                            )}
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 16 }}>{selectedUser.name}</div>
                            <div style={{ fontSize: 12, color: "var(--muted)" }}>{selectedUser.email}</div>
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                        <div style={{ background: "var(--surface)", padding: 12, borderRadius: 12, textAlign: "center", border: "1px solid var(--border)" }}>
                            <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>SEARCHES</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--accent)" }}>{selectedUser.searchCount || 0}</div>
                        </div>
                        <div style={{ background: "var(--surface)", padding: 12, borderRadius: 12, textAlign: "center", border: "1px solid var(--border)" }}>
                            <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>SAVED</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--primary)" }}>{selectedUser.savedCount || 0}</div>
                        </div>
                    </div>

                    <div style={{ fontSize: 12, color: "var(--muted)", display: "flex", justifyContent: "space-between" }}>
                        <span>Joined: {new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                        <span>Last Active: {selectedUser.lastActivityAt ? new Date(selectedUser.lastActivityAt).toLocaleDateString() : "Never"}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
