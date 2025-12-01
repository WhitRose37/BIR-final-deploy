"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

type User = {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("USER");
  const [status, setStatus] = useState("ACTIVE");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  async function fetchUser() {
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setName(data.name || "");
        setRole(data.role);
        setStatus(data.status);
      }
    } catch (e) {
      setError("Failed to load user");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, role, status }),
      });

      if (res.ok) {
        alert("User updated successfully");
        router.push("/admin");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update user");
      }
    } catch (e: any) {
      setError(e?.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="container" style={{ marginTop: 40 }}>
        <div className="card glass">
          <p>⏳ Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container" style={{ marginTop: 40 }}>
        <div className="card glass">
          <p>User not found</p>
          <Link href="/admin" className="btn btn--ghost" style={{ marginTop: 10 }}>
            ← Back to Admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ marginTop: 40 }}>
      <div className="card glass" style={{ maxWidth: 500, margin: "0 auto" }}>
        <h2>Edit User</h2>

        {error && (
          <div className="alert alert--error" style={{ marginTop: 10 }}>
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSave} style={{ marginTop: 20 }}>
          <div style={{ marginBottom: 15 }}>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={user.email}
              disabled
            />
          </div>

          <div style={{ marginBottom: 15 }}>
            <label className="label">Name</label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: 15 }}>
            <label className="label">Role</label>
            <select
              className="input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="label">Status</label>
            <select
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" className="btn btn--primary" disabled={saving} style={{ flex: 1 }}>
              {saving ? "⏳ Saving..." : "💾 Save Changes"}
            </button>
            <Link href="/admin" className="btn btn--ghost" style={{ flex: 1, textAlign: "center" }}>
              ← Cancel
            </Link>
          </div>
        </form>

        <hr style={{ margin: "20px 0", opacity: 0.3 }} />

        <div style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.6)" }}>
          <p>Created: {new Date(user.createdAt).toLocaleString()}</p>
          <p>Updated: {new Date(user.updatedAt).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
