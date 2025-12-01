"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Favorite = {
  id: string;
  glossaryId?: string | null;
  globalId?: string | null;
  glossary?: {
    partNumber: string;
    commonNameEn?: string;
    commonNameTh?: string;
  } | null;
  global?: {
    partNumber: string;
    commonNameEn?: string;
    commonNameTh?: string;
  } | null;
  createdAt: string;
};

// ✅ Add proper return type
type PartInfo = {
  partNumber: string;
  commonNameEn?: string;
  commonNameTh?: string;
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

export default function MyCatalogPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchFavorites();
    }
  }, [mounted, page]);

  async function fetchFavorites() {
    try {
      setLoading(true);
      const res = await fetch(`/api/My-catalog?page=${page}&limit=10`, {
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        setFavorites(data.favorites || []);
        setTotal(data.pagination?.total || 0);
      } else {
        showToast("❌ Failed to load catalog", "error");
      }
    } catch (e) {
      console.error("Error:", e);
      showToast("❌ Error loading catalog", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(favoriteId: string, partName: string) {
    setConfirmDelete(favoriteId);
    setDeleteName(partName);
  }

  async function confirmDeleteAction() {
    if (!confirmDelete) return;

    setDeleting(confirmDelete);
    try {
      const res = await fetch(`/api/My-catalog?id=${confirmDelete}`, {
        method: "DELETE",
      });

      if (res.status === 404 || res.status === 403) {
        showToast("❌ Not authorized or already deleted", "error");
        setFavorites(favorites.filter(f => f.id !== confirmDelete));
      } else if (res.ok) {
        const data = await res.json();
        setFavorites(favorites.filter(f => f.id !== confirmDelete));
        showToast(`✅ "${deleteName}" removed from catalog`, "success");
        setConfirmDelete(null);
      } else {
        const errorData = await res.json();
        showToast(`❌ ${errorData.error || "Failed to remove"}`, "error");
      }
    } catch (e: any) {
      console.error("Error:", e);
      showToast(`❌ ${e?.message || "Error removing"}`, "error");
    } finally {
      setDeleting(null);
    }
  }

  // ✅ Fix: Add proper return type annotation
  function getPartInfo(fav: Favorite): PartInfo {
    if (fav.glossary) {
      return {
        partNumber: fav.glossary.partNumber,
        commonNameEn: fav.glossary.commonNameEn,
        commonNameTh: fav.glossary.commonNameTh,
      };
    }
    if (fav.global) {
      return {
        partNumber: fav.global.partNumber,
        commonNameEn: fav.global.commonNameEn,
        commonNameTh: fav.global.commonNameTh,
      };
    }
    return {
      partNumber: "Unknown",
      commonNameEn: "Unknown",
      commonNameTh: "ไม่ทราบ",
    };
  }

  const filteredFavorites = favorites.filter((fav) => {
    if (!searchQuery.trim()) return true;
    const part = getPartInfo(fav);
    const query = searchQuery.toLowerCase();
    return (
      part.partNumber.toLowerCase().includes(query) ||
      part.commonNameEn?.toLowerCase().includes(query) ||
      part.commonNameTh?.toLowerCase().includes(query)
    );
  });

  if (!mounted || loading) {
    return (
      <div className="container" style={{ marginTop: 20, marginBottom: 40 }}>
        <div className="card glass">
          <p style={{ color: "#9b59b6" }}>⏳ Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ marginTop: 20, marginBottom: 40 }}>
        <div className="card glass">
          <p style={{ color: "#e74c3c" }}>❌ {error}</p>
        </div>
      </div>
    );
  }

  const pages = Math.ceil(total / 10);

  return (
    <div className="container" style={{ marginTop: 20, marginBottom: 40 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2>📚 My Catalog</h2>
        <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 12, marginTop: 5 }}>
          Total: {total} items
        </p>
      </div>

      {/* Search Bar */}
      <div className="card glass" style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="🔎 Search by part number or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            background: "rgba(0, 0, 0, 0.2)",
            border: "1px solid rgba(155, 89, 182, 0.3)",
            borderRadius: 6,
            color: "white",
            fontSize: 13,
          }}
        />
      </div>

      {/* Content */}
      {filteredFavorites.length === 0 ? (
        <div className="card glass">
          <p style={{ color: "rgba(255, 255, 255, 0.6)", textAlign: "center", padding: 20 }}>
            📭 No items in catalog yet
          </p>
        </div>
      ) : (
        <div className="card glass">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid rgba(155, 89, 182, 0.3)" }}>
                  <th style={{ textAlign: "left", padding: 12, fontSize: 12, fontWeight: 600 }}>Part Number</th>
                  <th style={{ textAlign: "left", padding: 12, fontSize: 12, fontWeight: 600 }}>EN Name</th>
                  <th style={{ textAlign: "left", padding: 12, fontSize: 12, fontWeight: 600 }}>TH Name</th>
                  <th style={{ textAlign: "center", padding: 12, fontSize: 12, fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFavorites.map((fav, idx) => {
                  const part = getPartInfo(fav);
                  const partNumber = part.partNumber || "Unknown";
                  const partName = part.commonNameEn || partNumber;

                  return (
                    <tr
                      key={fav.id}
                      style={{
                        borderBottom: "1px solid rgba(155, 89, 182, 0.1)",
                        backgroundColor: idx % 2 === 0 ? "rgba(155, 89, 182, 0.03)" : "transparent",
                      }}
                    >
                      <td style={{ padding: 12, fontSize: 12 }}>
                        <Link
                          href={`/generator?pn=${partNumber}`}
                          style={{ color: "#9b59b6", textDecoration: "none", fontWeight: 500, cursor: "pointer" }}
                        >
                          {partNumber}
                        </Link>
                      </td>
                      <td style={{ padding: 12, fontSize: 12, color: "rgba(255, 255, 255, 0.8)" }}>
                        {part.commonNameEn || "—"}
                      </td>
                      <td style={{ padding: 12, fontSize: 12, color: "rgba(255, 255, 255, 0.8)" }}>
                        {part.commonNameTh || "—"}
                      </td>
                      <td style={{ textAlign: "center", padding: 12 }}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                          <Link
                            href={`/generator?pn=${partNumber}`}
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
                            onClick={() => handleDelete(fav.id, partName)}
                            disabled={deleting === fav.id}
                            className="btn btn--ghost"
                            style={{
                              padding: "6px 12px",
                              fontSize: 11,
                              color: deleting === fav.id ? "#999" : "#e74c3c",
                              cursor: deleting === fav.id ? "not-allowed" : "pointer",
                              opacity: deleting === fav.id ? 0.6 : 1,
                            }}
                          >
                            {deleting === fav.id ? "⏳..." : "🗑️ Remove"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ marginTop: 20, textAlign: "center", display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
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
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="btn btn--ghost"
            style={{ padding: "8px 12px" }}
          >
            Next ▶
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDelete && (
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
            <h3 style={{ 
              textAlign: "center", 
              marginTop: 0, 
              marginBottom: 10,
              fontSize: 20,
              fontWeight: 600 
            }}>
              Remove from catalog?
            </h3>

            {/* Message */}
            <p style={{ 
              textAlign: "center",
              color: "rgba(255, 255, 255, 0.7)", 
              marginBottom: 20,
              fontSize: 13,
              lineHeight: 1.5
            }}>
              Are you sure you want to remove <strong>"{deleteName}"</strong> from your catalog?
            </p>

            {/* Warning */}
            <p style={{ 
              fontSize: 11,
              color: "rgba(255, 255, 255, 0.5)",
              textAlign: "center",
              marginBottom: 20,
              fontStyle: "italic"
            }}>
              This action cannot be undone.
            </p>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => setConfirmDelete(null)}
                className="btn btn--ghost"
                style={{ 
                  padding: "12px 24px",
                  flex: 1,
                  minWidth: 120
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
                {deleting === confirmDelete ? "⏳ Removing..." : "🗑️ Remove"}
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
