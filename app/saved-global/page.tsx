"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Part = {
  id: string;
  partNumber: string;
  productName?: string;
  commonNameEn?: string;
  commonNameTh?: string;
  uom?: string;
  characteristicsOfMaterialEn?: string;
  characteristicsOfMaterialTh?: string;
  estimatedCapacityMachineYear?: string;
  quantityToUse?: string;
  functionEn?: string;
  functionTh?: string;
  whereUsedEn?: string;
  whereUsedTh?: string;
  longEn?: string;
  longTh?: string;
  eccn?: string;
  hts?: string;
  coo?: string;
  tagsJson?: string[] | null;
  imagesJson?: string[] | null;
  sourcesJson?: any[] | null;
  createdById?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
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

export default function SavedGlobalPage() {
  const router = useRouter();
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

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
        `/api/saved-global?page=${page}&limit=12&search=${encodeURIComponent(search)}`,
        { cache: "no-store", credentials: "include" }
      );

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setParts(data.parts || []);
        setTotalPages(data.pagination?.pages || 1);
      }
    } catch (e) {
      showToast("❌ Failed to load parts", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(partId: string) {
    if (!confirm("Are you sure you want to delete this part?")) return;

    setDeleting(partId);
    try {
      const res = await fetch(`/api/saved-global?id=${partId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setParts(parts.filter((p) => p.id !== partId));
        showToast("✅ Part deleted");
        if (selectedPart?.id === partId) closeDetail();
      } else {
        showToast("❌ Failed to delete part", "error");
      }
    } catch (e) {
      showToast("❌ Error deleting part", "error");
    } finally {
      setDeleting(null);
    }
  }

  function openDetail(part: Part) {
    setSelectedPart(part);
    setImageIndex(0);
  }

  function closeDetail() {
    setSelectedPart(null);
    setImageIndex(0);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopyStatus(text);
      showToast("📋 Copied to clipboard");
      setTimeout(() => setCopyStatus(null), 2000);
    });
  }

  const images = selectedPart?.imagesJson || [];
  const currentImage = images[imageIndex];

  if (!mounted) return null;

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "40px 20px" }}>
      {/* Header */}
      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <h1 style={{
          fontSize: 42,
          fontWeight: 800,
          marginBottom: 12,
          background: "linear-gradient(135deg, #6366f1, #a855f7, #ec4899)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          letterSpacing: "-0.02em"
        }}>
          🌐 Global Parts Library
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 16, maxWidth: 600, margin: "0 auto", lineHeight: 1.6 }}>
          A centralized database of all generated and saved parts. <br />
          Search, manage, and export your engineering data.
        </p>
      </div>

      {/* Search Bar */}
      <div style={{
        maxWidth: 700,
        margin: "0 auto 50px",
        position: "relative",
        zIndex: 10
      }}>
        <div className="glass-panel" style={{
          padding: 8,
          borderRadius: 16,
          display: "flex",
          gap: 10,
          boxShadow: "0 20px 40px -10px rgba(0,0,0,0.1)"
        }}>
          <div style={{ position: "relative", flex: 1 }}>
            <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 18, opacity: 0.5 }}>🔎</span>
            <input
              type="text"
              placeholder="Search by Part Number, Name, or Keywords..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{
                width: "100%",
                padding: "14px 14px 14px 48px",
                borderRadius: 12,
                border: "1px solid transparent",
                background: "var(--surface)",
                color: "var(--text)",
                fontSize: 16,
                outline: "none",
                transition: "all 0.2s"
              }}
              onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
              onBlur={(e) => e.target.style.borderColor = "transparent"}
            />
          </div>
          <button
            onClick={fetchParts}
            className="btn btn-primary"
            style={{ padding: "0 28px", borderRadius: 12, fontSize: 16 }}
          >
            Search
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && parts.length === 0 && (
        <div style={{ textAlign: "center", padding: 60 }}>
          <div className="spinner" style={{ width: 40, height: 40, border: "4px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 20px" }}></div>
          <p style={{ color: "var(--muted)" }}>Loading library...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && parts.length === 0 && (
        <div style={{ textAlign: "center", padding: 80, opacity: 0.6 }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>📭</div>
          <h3 style={{ fontSize: 20, fontWeight: 600, color: "var(--text)" }}>No parts found</h3>
          <p style={{ color: "var(--muted)" }}>Try adjusting your search terms or generate new parts.</p>
        </div>
      )}

      {/* Grid Layout */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: 24
      }}>
        {parts.map((part) => {
          const images = part.imagesJson || [];
          const firstImage = images[0];

          return (
            <div
              key={part.id}
              className="card"
              style={{
                padding: 0,
                overflow: "hidden",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                height: "100%",
                border: "1px solid var(--border)",
                background: "var(--card-bg)",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
              onClick={() => openDetail(part)}
            >
              {/* Image Area */}
              <div style={{
                height: 220,
                width: "100%",
                background: "var(--surface)",
                position: "relative",
                borderBottom: "1px solid var(--border)"
              }}>
                {firstImage ? (
                  <Image
                    src={firstImage}
                    alt={part.partNumber}
                    fill
                    style={{ objectFit: "cover" }}
                    unoptimized
                  />
                ) : (
                  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", color: "var(--muted)" }}>
                    <span style={{ fontSize: 40, marginBottom: 10 }}>📦</span>
                    <span style={{ fontSize: 12 }}>No Preview</span>
                  </div>
                )}

                {/* Badge */}
                <div style={{
                  position: "absolute",
                  top: 12,
                  left: 12,
                  background: "rgba(0,0,0,0.6)",
                  backdropFilter: "blur(4px)",
                  color: "white",
                  padding: "4px 10px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.05em"
                }}>
                  {part.uom || "EA"}
                </div>

                {images.length > 1 && (
                  <div style={{
                    position: "absolute",
                    bottom: 12,
                    right: 12,
                    background: "rgba(0,0,0,0.6)",
                    color: "white",
                    padding: "4px 8px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600
                  }}>
                    +{images.length - 1}
                  </div>
                )}
              </div>

              {/* Content Area */}
              <div style={{ padding: 20, flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
                  <h3 style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--text)",
                    fontFamily: "monospace",
                    margin: 0
                  }}>
                    {part.partNumber}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(part.partNumber);
                    }}
                    style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.5, padding: 4 }}
                    title="Copy Part Number"
                  >
                    📋
                  </button>
                </div>

                <p style={{
                  fontSize: 13,
                  color: "var(--muted)",
                  margin: "0 0 16px 0",
                  lineHeight: 1.5,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  flex: 1
                }}>
                  {part.productName || part.commonNameEn || "No description available"}
                </p>

                {/* Tags */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                  {(part.tagsJson || []).slice(0, 3).map((tag, i) => (
                    <span key={i} style={{
                      fontSize: 10,
                      padding: "4px 8px",
                      borderRadius: 4,
                      background: "var(--surface)",
                      color: "var(--accent)",
                      border: "1px solid var(--border)",
                      fontWeight: 500
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Footer Actions */}
                <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
                  <button
                    className="btn btn-secondary"
                    style={{ flex: 1, fontSize: 13, padding: "8px" }}
                  >
                    View Details
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(part.id);
                    }}
                    className="btn"
                    style={{
                      padding: "8px 12px",
                      background: "rgba(239, 68, 68, 0.1)",
                      color: "var(--danger)",
                      border: "1px solid transparent"
                    }}
                  >
                    {deleting === part.id ? "..." : "🗑️"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 60 }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-secondary"
            style={{ opacity: page === 1 ? 0.5 : 1 }}
          >
            Previous
          </button>
          <span style={{ display: "flex", alignItems: "center", padding: "0 16px", fontWeight: 600, color: "var(--text)" }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn btn-secondary"
            style={{ opacity: page === totalPages ? 0.5 : 1 }}
          >
            Next
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedPart && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 2000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(8px)",
          animation: "fadeIn 0.2s ease-out"
        }} onClick={closeDetail}>
          <div
            onClick={e => e.stopPropagation()}
            className="glass-panel"
            style={{
              width: "100%",
              maxWidth: 1000,
              maxHeight: "90vh",
              borderRadius: 24,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 50px 100px -20px rgba(0,0,0,0.3)",
              background: "var(--panel)"
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: "20px 30px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "var(--surface)"
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--text)" }}>
                  {selectedPart.partNumber}
                </h2>
                <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 14 }}>
                  {selectedPart.productName || "Product Details"}
                </p>
              </div>
              <button
                onClick={closeDetail}
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "var(--text)",
                  fontSize: 18
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ overflowY: "auto", padding: 30 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 40 }}>

                {/* Left Column: Images & Key Info */}
                <div>
                  <div style={{
                    borderRadius: 16,
                    overflow: "hidden",
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    marginBottom: 20
                  }}>
                    <div style={{ height: 300, position: "relative", background: "#f8fafc" }}>
                      {currentImage ? (
                        <Image
                          src={currentImage}
                          alt="Preview"
                          fill
                          style={{ objectFit: "contain" }}
                          unoptimized
                        />
                      ) : (
                        <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                          No Image Available
                        </div>
                      )}
                    </div>

                    {/* Thumbnails */}
                    {images.length > 1 && (
                      <div style={{ display: "flex", gap: 8, padding: 12, overflowX: "auto", borderTop: "1px solid var(--border)" }}>
                        {images.map((img: string, idx: number) => (
                          <div
                            key={idx}
                            onClick={() => setImageIndex(idx)}
                            style={{
                              width: 60,
                              height: 60,
                              borderRadius: 8,
                              overflow: "hidden",
                              cursor: "pointer",
                              border: idx === imageIndex ? "2px solid var(--accent)" : "1px solid var(--border)",
                              position: "relative",
                              flexShrink: 0
                            }}
                          >
                            <Image src={img} alt="" fill style={{ objectFit: "cover" }} unoptimized />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quick Stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <InfoCard label="UOM" value={selectedPart.uom} />
                    <InfoCard label="COO" value={selectedPart.coo} />
                    <InfoCard label="ECCN" value={selectedPart.eccn} />
                    <InfoCard label="HTS" value={selectedPart.hts} />
                  </div>
                </div>

                {/* Right Column: Detailed Specs */}
                <div>
                  <SectionTitle>General Information</SectionTitle>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 30 }}>
                    <DataField label="Common Name (EN)" value={selectedPart.commonNameEn} />
                    <DataField label="Common Name (TH)" value={selectedPart.commonNameTh} />
                  </div>

                  <SectionTitle>Technical Specifications</SectionTitle>
                  <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 30 }}>
                    <DataField label="Material Characteristics" value={selectedPart.characteristicsOfMaterialEn} />
                    <DataField label="Function / Usage" value={selectedPart.functionEn} />
                    <DataField label="Where Used" value={selectedPart.whereUsedEn} />
                  </div>

                  <SectionTitle>Thai Translation</SectionTitle>
                  <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 30 }}>
                    <DataField label="ลักษณะวัสดุ" value={selectedPart.characteristicsOfMaterialTh} />
                    <DataField label="หน้าที่การใช้งาน" value={selectedPart.functionTh} />
                    <DataField label="ตำแหน่งที่ใช้" value={selectedPart.whereUsedTh} />
                  </div>

                  <SectionTitle>Additional Data</SectionTitle>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    <DataField label="Est. Capacity / Year" value={selectedPart.estimatedCapacityMachineYear} />
                    <DataField label="Quantity to Use" value={selectedPart.quantityToUse} />
                  </div>

                  {/* Tags */}
                  {selectedPart.tagsJson && selectedPart.tagsJson.length > 0 && (
                    <div style={{ marginTop: 30 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 10, textTransform: "uppercase" }}>Tags</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {selectedPart.tagsJson.map((tag, i) => (
                          <span key={i} style={{
                            fontSize: 12,
                            padding: "6px 12px",
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                            borderRadius: 20,
                            color: "var(--text)"
                          }}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: "20px 30px",
              borderTop: "1px solid var(--border)",
              background: "var(--surface)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                Last updated: {new Date(selectedPart.updatedAt).toLocaleString()}
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={closeDetail} className="btn btn-secondary">Close</button>
                <button
                  onClick={() => handleDelete(selectedPart.id)}
                  className="btn"
                  style={{ background: "var(--danger)", color: "white" }}
                >
                  Delete Part
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{
      fontSize: 14,
      fontWeight: 700,
      color: "var(--accent)",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      marginBottom: 16,
      borderBottom: "1px solid var(--border)",
      paddingBottom: 8
    }}>
      {children}
    </h3>
  );
}

function InfoCard({ label, value }: { label: string, value?: string }) {
  return (
    <div style={{ background: "var(--bg)", padding: 12, borderRadius: 8, border: "1px solid var(--border)" }}>
      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{value || "—"}</div>
    </div>
  );
}

function DataField({ label, value }: { label: string, value?: string }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>{label}</div>
      <div style={{
        fontSize: 14,
        color: "var(--text)",
        lineHeight: 1.6,
        background: "var(--surface)",
        padding: 12,
        borderRadius: 8,
        border: "1px solid var(--border)"
      }}>
        {value || "—"}
      </div>
    </div>
  );
}

