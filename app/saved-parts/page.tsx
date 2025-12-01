"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SavedPart = {
  id: string;
  partNumber: string;
  commonNameEn?: string;
  commonNameTh?: string;
  functionEn?: string;
  functionTh?: string;
  whereUsedEn?: string;
  whereUsedTh?: string;
  uom?: string;
  createdAt: string;
};

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

export default function SavedPartsPage() {
  const [parts, setParts] = useState<SavedPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deletePart, setDeletePart] = useState<SavedPart | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchParts();
    }
  }, [mounted, page, search]);

  async function fetchParts() {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/saved-global?page=${page}&limit=10&search=${encodeURIComponent(search)}`,
        { cache: "no-store" }
      );

      if (res.ok) {
        const data = await res.json();
        setParts(data.parts || []);
        setTotal(data.pagination?.total || 0);
      }
    } catch (e) {
      showToast("❌ Failed to load parts", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(part: SavedPart) {
    setConfirmDelete(part.id);
    setDeletePart(part);
  }

  async function confirmDeleteAction() {
    if (!confirmDelete || !deletePart) return;

    setDeleting(confirmDelete);
    try {
      const res = await fetch(`/api/saved-global/${confirmDelete}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setParts(parts.filter((p) => p.id !== confirmDelete));
        showToast(`✅ "${deletePart.partNumber}" deleted successfully`, "success");
        setConfirmDelete(null);
        setDeletePart(null);
      } else {
        showToast("❌ Failed to delete", "error");
      }
    } catch (e) {
      showToast("❌ Error deleting part", "error");
    } finally {
      setDeleting(null);
    }
  }

  if (!mounted || loading) {
    return (
      <div className="container" style={{ marginTop: 20 }}>
        <div className="card glass">
          <p style={{ color: "#9b59b6" }}>⏳ Loading...</p>
        </div>
      </div>
    );
  }

  const pages = Math.ceil(total / 10);

  return (
    <div className="container" style={{ marginTop: 20, marginBottom: 40 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2>💾 Saved Parts (Global)</h2>
        <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 12 }}>
          Total: {total} parts
        </p>
      </div>

      {/* Search */}
      <div className="card glass" style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="🔎 Search part number or name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{
            width: "100%",
            padding: "10px",
            background: "rgba(0, 0, 0, 0.2)",
            border: "1px solid rgba(155, 89, 182, 0.3)",
            borderRadius: 6,
            color: "white",
            fontSize: 13,
          }}
        />
      </div>

      {/* Content */}
      {parts.length === 0 ? (
        <div className="card glass">
          <p style={{ color: "rgba(255, 255, 255, 0.6)", textAlign: "center", padding: 20 }}>
            No saved parts found
          </p>
        </div>
      ) : (
        <div className="card glass">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid rgba(155, 89, 182, 0.3)" }}>
                  <th style={{ textAlign: "left", padding: 12, fontSize: 12 }}>Part Number</th>
                  <th style={{ textAlign: "left", padding: 12, fontSize: 12 }}>EN Name</th>
                  <th style={{ textAlign: "left", padding: 12, fontSize: 12 }}>Function</th>
                  <th style={{ textAlign: "center", padding: 12, fontSize: 12 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {parts.map((part, idx) => (
                  <tr
                    key={part.id}
                    style={{
                      borderBottom: "1px solid rgba(155, 89, 182, 0.1)",
                      backgroundColor: idx % 2 === 0 ? "rgba(155, 89, 182, 0.03)" : "transparent",
                    }}
                  >
                    <td style={{ padding: 12, fontSize: 12 }}>
                      <Link
                        href={`/generator?pn=${part.partNumber}`}
                        style={{ color: "#9b59b6", textDecoration: "none", fontWeight: 500 }}
                      >
                        {part.partNumber}
                      </Link>
                    </td>
                    <td style={{ padding: 12, fontSize: 12 }}>
                      {part.commonNameEn || "—"}
                    </td>
                    <td style={{ padding: 12, fontSize: 12, color: "rgba(255, 255, 255, 0.7)" }}>
                      {(part.functionEn || "—").substring(0, 50)}
                    </td>
                    <td style={{ textAlign: "center", padding: 12 }}>
                      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                        <Link
                          href={`/generator?pn=${part.partNumber}`}
                          className="btn btn--ghost"
                          style={{
                            padding: "6px 12px",
                            fontSize: 11,
                            textDecoration: "none",
                            display: "inline-block",
                          }}
                        >
                          👁️ View
                        </Link>
                        <button
                          onClick={() => handleDelete(part)}
                          disabled={deleting === part.id}
                          className="btn btn--ghost"
                          style={{
                            padding: "6px 12px",
                            fontSize: 11,
                            color: deleting === part.id ? "#999" : "#e74c3c",
                            cursor: deleting === part.id ? "not-allowed" : "pointer",
                            opacity: deleting === part.id ? 0.6 : 1,
                          }}
                        >
                          {deleting === part.id ? "⏳..." : "🗑️ Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ marginTop: 20, textAlign: "center", display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn--ghost"
            style={{ padding: "8px 12px" }}
          >
            ◀ Prev
          </button>
          <span style={{ padding: "8px 12px", fontSize: 12 }}>
            Page {page} of {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="btn btn--ghost"
            style={{ padding: "8px 12px" }}
          >
            Next ▶
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDelete && deletePart && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="card glass"
            style={{
              maxWidth: 450,
              padding: 30,
              animation: "slideUp 0.3s ease",
            }}
          >
            {/* Icon */}
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 10 }}>⚠️</div>
            </div>

            {/* Title */}
            <h3
              style={{
                textAlign: "center",
                marginTop: 0,
                marginBottom: 10,
                fontSize: 20,
                fontWeight: 600,
              }}
            >
              Delete this part?
            </h3>

            {/* Message */}
            <p
              style={{
                textAlign: "center",
                color: "rgba(255, 255, 255, 0.7)",
                marginBottom: 20,
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              You're about to permanently delete
            </p>

            {/* Part Info */}
            <div
              style={{
                background: "rgba(231, 76, 60, 0.1)",
                border: "1px solid rgba(231, 76, 60, 0.3)",
                borderRadius: 8,
                padding: 15,
                marginBottom: 20,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontWeight: 600,
                  color: "#e74c3c",
                  fontSize: 14,
                }}
              >
                {deletePart.partNumber}
              </p>
              <p
                style={{
                  margin: "5px 0 0 0",
                  fontSize: 12,
                  color: "rgba(255, 255, 255, 0.6)",
                }}
              >
                {deletePart.commonNameEn || "No name"}
              </p>
            </div>

            {/* Warning */}
            <p
              style={{
                fontSize: 11,
                color: "rgba(255, 255, 255, 0.5)",
                textAlign: "center",
                marginBottom: 20,
                fontStyle: "italic",
              }}
            >
              This action cannot be undone.
            </p>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => {
                  setConfirmDelete(null);
                  setDeletePart(null);
                }}
                className="btn btn--ghost"
                style={{
                  padding: "12px 24px",
                  flex: 1,
                  minWidth: 120,
                }}
              >
                ✕ Cancel
              </button>
              <button
                onClick={confirmDeleteAction}
                disabled={deleting === confirmDelete}
                style={{
                  padding: "12px 24px",
                  flex: 1,
                  minWidth: 120,
                  background: "#e74c3c",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  cursor: deleting === confirmDelete ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  fontSize: 13,
                  opacity: deleting === confirmDelete ? 0.6 : 1,
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  if (deleting !== confirmDelete) {
                    (e.target as HTMLElement).style.background = "#c0392b";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.background = "#e74c3c";
                }}
              >
                {deleting === confirmDelete ? "⏳ Deleting..." : "🗑️ Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
