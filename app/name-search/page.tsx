"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type SearchResult = {
  id: string;
  partNumber: string;
  productName?: string;
  commonNameEn?: string;
  commonNameTh?: string;
  characteristicsOfMaterialEn?: string;
  characteristicsOfMaterialTh?: string;
  imagesJson?: string[] | null;
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

export default function NameSearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();

    if (!query.trim()) {
      showToast("❌ กรุณากรอกคำค้นหา", "error");
      return;
    }

    setLoading(true);
    setSearched(true);
    
    try {
      const res = await fetch(`/api/search-by-name?q=${encodeURIComponent(query.trim())}`, {
        cache: "no-store",
        credentials: "include",
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        
        if (data.results?.length === 0) {
          showToast("ℹ️ ไม่พบข้อมูล ลองค้นหาด้วยคำอื่น");
        } else {
          showToast(`✅ พบ ${data.results.length} รายการ`);
        }
      } else {
        showToast("❌ เกิดข้อผิดพลาดในการค้นหา", "error");
      }
    } catch (e) {
      showToast("❌ Network error", "error");
    } finally {
      setLoading(false);
    }
  }

  function handleQuickSearch(term: string) {
    setQuery(term);
    // Auto submit after setting query
    setTimeout(() => {
      const form = document.querySelector("form");
      form?.requestSubmit();
    }, 100);
  }

  if (!mounted) {
    return null;
  }

  return (
    <div className="container" style={{ marginTop: 20, marginBottom: 40 }}>
      {/* Header */}
      <div style={{ marginBottom: 30 }}>
        <h1 style={{ fontSize: 28, marginBottom: 5 }}>🔍 ค้นหาด้วยชื่อ</h1>
        <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 13 }}>
          ค้นหาชิ้นส่วนด้วยชื่อผลิตภัณฑ์ (Product Name) หรือชื่อทั่วไป (Common Name)
        </p>
      </div>

      {/* Search Form */}
      <div className="card glass" style={{ marginBottom: 30 }}>
        <form onSubmit={handleSearch}>
          <div style={{ display: "flex", gap: 12, marginBottom: 15 }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="🔎 พิมพ์ชื่อผลิตภัณฑ์ เช่น Motor, Bearing, Sensor, Valve..."
              disabled={loading}
              style={{
                flex: 1,
                padding: "14px",
                background: "rgba(0, 0, 0, 0.2)",
                border: "1px solid rgba(155, 89, 182, 0.3)",
                borderRadius: 6,
                color: "white",
                fontSize: 14,
              }}
            />
            <button
              type="submit"
              disabled={loading}
              className="btn btn--primary"
              style={{
                padding: "14px 28px",
                opacity: loading ? 0.6 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "⏳ กำลังค้นหา..." : "🔍 ค้นหา"}
            </button>
          </div>

          {/* Quick Search Suggestions */}
          <div style={{ marginTop: 15 }}>
            <p style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.5)", marginBottom: 10 }}>
              💡 คำแนะนำ: ลองค้นหา
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["Motor", "Bearing", "Sensor", "Valve", "Switch", "Relay", "Pump", "Cylinder"].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => handleQuickSearch(term)}
                  style={{
                    padding: "6px 12px",
                    background: "rgba(155, 89, 182, 0.2)",
                    border: "1px solid rgba(155, 89, 182, 0.3)",
                    borderRadius: 20,
                    color: "white",
                    fontSize: 11,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(155, 89, 182, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(155, 89, 182, 0.2)";
                  }}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>

      {/* Results */}
      {searched && !loading && (
        <>
          {results.length === 0 ? (
            <div className="card glass" style={{ textAlign: "center", padding: 40 }}>
              <p style={{ fontSize: 48, margin: "0 0 15px 0" }}>🔍</p>
              <p style={{ color: "rgba(255, 255, 255, 0.6)", margin: 0, fontSize: 14 }}>
                ไม่พบข้อมูลที่ค้นหา "{query}"
              </p>
              <p style={{ color: "rgba(255, 255, 255, 0.5)", margin: "10px 0 0 0", fontSize: 12 }}>
                ลองใช้คำค้นหาอื่น หรือค้นหาด้วย Part Number แทน
              </p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.7)" }}>
                  📊 พบ <strong>{results.length}</strong> รายการสำหรับ "{query}"
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                  gap: 20,
                }}
              >
                {results.map((result) => {
                  const images = result.imagesJson || [];
                  const firstImage = images[0];

                  return (
                    <div
                      key={result.id}
                      className="card glass"
                      style={{
                        padding: 0,
                        overflow: "hidden",
                        transition: "all 0.3s ease",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                        (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 30px rgba(155, 89, 182, 0.3)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                        (e.currentTarget as HTMLElement).style.boxShadow = "none";
                      }}
                      onClick={() => router.push(`/saved-global?highlight=${result.id}`)}
                    >
                      {/* Image */}
                      <div
                        style={{
                          width: "100%",
                          height: 180,
                          background: firstImage
                            ? `url(${firstImage}) center/cover`
                            : "linear-gradient(135deg, rgba(155, 89, 182, 0.2), rgba(52, 152, 219, 0.1))",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {!firstImage && (
                          <span style={{ fontSize: 48, opacity: 0.3 }}>📦</span>
                        )}
                      </div>

                      {/* Content */}
                      <div style={{ padding: 20 }}>
                        {/* Part Number */}
                        <div
                          style={{
                            display: "inline-block",
                            padding: "4px 10px",
                            background: "rgba(155, 89, 182, 0.2)",
                            border: "1px solid rgba(155, 89, 182, 0.3)",
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#9b59b6",
                            marginBottom: 10,
                          }}
                        >
                          📋 {result.partNumber}
                        </div>

                        {/* Product Name */}
                        <h3
                          style={{
                            fontSize: 15,
                            fontWeight: 600,
                            margin: "0 0 8px 0",
                            color: "white",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            minHeight: 40,
                          }}
                        >
                          {result.productName || result.commonNameEn || result.partNumber}
                        </h3>

                        {/* Common Name */}
                        {result.commonNameTh && (
                          <p
                            style={{
                              fontSize: 12,
                              margin: "0 0 12px 0",
                              color: "rgba(255, 255, 255, 0.7)",
                              display: "-webkit-box",
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            🇹🇭 {result.commonNameTh}
                          </p>
                        )}

                        {/* Characteristics */}
                        {result.characteristicsOfMaterialEn && (
                          <p
                            style={{
                              fontSize: 11,
                              margin: 0,
                              color: "rgba(255, 255, 255, 0.5)",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              minHeight: 32,
                            }}
                          >
                            {result.characteristicsOfMaterialEn}
                          </p>
                        )}

                        {/* View Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/saved-global?highlight=${result.id}`);
                          }}
                          className="btn btn--primary"
                          style={{
                            width: "100%",
                            padding: "10px",
                            marginTop: 15,
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          👁️ ดูรายละเอียด
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* Help Section */}
      {!searched && (
        <div className="card glass" style={{ padding: 30, marginTop: 30 }}>
          <h3 style={{ fontSize: 16, marginBottom: 15, fontWeight: 600 }}>
            💡 วิธีใช้งาน
          </h3>
          <ul style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.7)", lineHeight: 1.8, paddingLeft: 20 }}>
            <li>พิมพ์ชื่อผลิตภัณฑ์ เช่น "Motor", "Bearing", "Sensor"</li>
            <li>ระบบจะค้นหาจาก Product Name และ Common Name</li>
            <li>รองรับทั้งภาษาไทยและอังกฤษ</li>
            <li>คลิกที่การ์ดเพื่อดูรายละเอียดเต็ม</li>
          </ul>
        </div>
      )}
    </div>
  );
}
