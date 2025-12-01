"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

// --- Components ---

function SpinnerSmall({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 50 50" aria-hidden style={{ verticalAlign: "middle" }}>
      <circle cx="25" cy="25" r="20" stroke="currentColor" strokeOpacity="0.2" strokeWidth="5" fill="none" />
      <path d="M45 25a20 20 0 0 1-20 20" stroke="currentColor" strokeWidth="5" strokeLinecap="round" fill="none">
        <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.8s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}

function SpinnerLarge({ label }: { label?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <svg width={64} height={64} viewBox="0 0 50 50" aria-hidden>
        <circle cx="25" cy="25" r="20" stroke="rgba(255,255,255,0.1)" strokeWidth="4" fill="none" />
        <path d="M45 25a20 20 0 0 1-20 20" stroke="var(--primary)" strokeWidth="4" strokeLinecap="round" fill="none">
          <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite" />
        </path>
      </svg>
      <div style={{ color: "var(--text)", fontWeight: 500, fontSize: 16 }}>{label ?? "Loading..."}</div>
    </div>
  );
}

export default function GeneratorPage() {
  // State
  const [partNumber, setPartNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [detailedAnalysis, setDetailedAnalysis] = useState<string | null>(null);
  const [showDetailedModal, setShowDetailedModal] = useState(false);
  const [copyStatus, setCopyStatus] = useState<Record<string, string>>({});



  // Toasts
  const [toasts, setToasts] = useState<{ id: number; msg: string; type?: "success" | "error" }[]>([]);
  function showToast(msg: string, type: "success" | "error" = "success") {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }

  // Logic
  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!partNumber.trim()) {
      showToast("Please enter a part number", "error");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setImageIndex(0);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ part_number: partNumber.trim(), withImage: true }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e?.message || "Generation failed");
      showToast("Generation failed", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!result) return;
    setSaving(true);
    try {
      const res = await fetch("/api/saved-global", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...result }),
      });
      if (!res.ok) throw new Error("Save failed");
      showToast("Part saved successfully!");
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDetailedAnalysis() {
    if (!result) return;
    setAnalyzing(true);
    try {
      const res = await fetch("/api/generate-detailed-spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });
      if (!res.ok) throw new Error("Analysis failed");
      const data = await res.json();
      setDetailedAnalysis(data.analysis);
      setShowDetailedModal(true);
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setAnalyzing(false);
    }
  }

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopyStatus(prev => ({ ...prev, [key]: "copied" }));
    setTimeout(() => setCopyStatus(prev => ({ ...prev, [key]: "" })), 2000);
    showToast(`Copied ${key}`);
  }

  function handleCopyForBookmarklet() {
    if (!result) return;
    const data = {
      part_number: result.part_number || "",
      product_name: result.product_name || "",
      common_name_en: result.common_name_en || "",
      common_name_th: result.common_name_th || "",
      uom: result.uom || "",
      characteristics_of_material_en: result.characteristics_of_material_en || "",
      characteristics_of_material_th: result.characteristics_of_material_th || "",
      function_en: result.function_en || "",
      function_th: result.function_th || "",
      where_used_en: result.where_used_en || "",
      where_used_th: result.where_used_th || "",
      eccn: result.eccn || "",
      hts: result.hts || "",
      coo: result.coo || "",
    };
    localStorage.setItem("BIR_AUTO_FILL_DATA", JSON.stringify(data));
    showToast("Ready for Bookmarklet! Go to target site and click bookmark.");
  }

  async function regenerateImage() {
    if (!result) return;
    showToast("Generating new image...", "success");
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ part: result.part_number, fields: result })
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.url) {
          setResult({ ...result, images: [data.url] });
          setImageIndex(0);
          showToast("New image generated!");
        }
      }
    } catch {
      showToast("Failed to generate image", "error");
    }
  }

  // Helpers
  const images = result?.images || [];
  const currentImage = images[imageIndex];
  const hasValue = (v: any) => v && String(v).trim() !== "";

  return (
    <div className="gen-root">
      <style>{`
        :root {
          --radius: 16px;
          --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
        }
        .gen-root {
          min-height: 100vh;
          background: var(--bg);
          color: var(--text);
          font-family: 'Inter', sans-serif;
          padding: 40px 6vw;
          transition: background-color 0.3s ease;
        }
        
        /* Header */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
        }
        .title {
          font-size: 32px;
          font-weight: 800;
          background: linear-gradient(135deg, var(--text) 0%, var(--muted) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* Search Bar */
        .search-container {
          max-width: 800px;
          margin: 0 auto 40px;
          position: relative;
        }
        .search-input {
          width: 100%;
          padding: 20px 24px;
          padding-right: 140px;
          font-size: 18px;
          background: var(--card-bg);
          backdrop-filter: blur(12px);
          border: 1px solid var(--border);
          border-radius: 24px;
          color: var(--text);
          box-shadow: var(--shadow-lg);
          transition: all 0.2s ease;
        }
        .search-input:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.1);
        }
        .search-btn {
          position: absolute;
          right: 8px;
          top: 8px;
          bottom: 8px;
          padding: 0 32px;
          border-radius: 18px;
          background: linear-gradient(135deg, var(--accent) 0%, #6d28d9 100%);
          color: white;
          border: none;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.1s ease;
        }
        .search-btn:hover { transform: scale(1.02); }
        .search-btn:active { transform: scale(0.98); }

        /* Results Layout */
        .result-grid {
          display: grid;
          grid-template-columns: 400px 1fr;
          gap: 32px;
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @media (max-width: 900px) {
          .result-grid { grid-template-columns: 1fr; }
        }

        /* Cards */
        .card {
          background: var(--card-bg);
          backdrop-filter: blur(12px);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 24px;
          box-shadow: var(--shadow-lg);
        }

        /* Image Gallery */
        .img-container {
          aspect-ratio: 4/3;
          background: var(--bg);
          border-radius: 12px;
          overflow: hidden;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }
        .img-main {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        .img-nav {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 12px;
        }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--border);
          cursor: pointer;
          transition: background 0.2s;
        }
        .dot.active { background: var(--accent); }

        /* Data Fields */
        .section-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 16px;
          margin-top: 24px;
        }
        .section-title:first-child { margin-top: 0; }
        
        .field-group {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }
        .field-box {
          background: var(--bg);
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid var(--border);
          position: relative;
          transition: border-color 0.2s;
        }
        .field-box:hover { border-color: var(--accent); }
        .field-label {
          font-size: 12px;
          color: var(--muted);
          margin-bottom: 4px;
        }
        .field-value {
          font-size: 14px;
          font-weight: 500;
          color: var(--text);
          word-break: break-word;
        }
        .copy-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          opacity: 0;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--accent);
          transition: opacity 0.2s;
        }
        .field-box:hover .copy-btn { opacity: 1; }

        /* Action Bar */
        .action-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .btn {
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: transform 0.1s;
        }
        .btn:hover { transform: translateY(-1px); }
        .btn-primary { background: var(--primary); color: white; }
        .btn-secondary { background: var(--panel); color: var(--text); border: 1px solid var(--border); }
        .btn-accent { background: var(--accent); color: white; }

        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .modal-content {
          background: var(--panel);
          width: 100%;
          max-width: 800px;
          max-height: 80vh;
          border-radius: 24px;
          padding: 32px;
          overflow-y: auto;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
        }

        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>

      {/* Toasts */}
      <div style={{ position: "fixed", top: 24, right: 24, zIndex: 2000, display: "flex", flexDirection: "column", gap: 12 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: t.type === "error" ? "#ef4444" : "#10b981",
            color: "white", padding: "12px 20px", borderRadius: 12,
            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", fontWeight: 500
          }}>
            {t.msg}
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="header">
        <div>
          <h1 className="title">Part Generator</h1>
          <p style={{ color: "var(--muted)" }}>AI-powered specification generator</p>
        </div>
      </header>

      {/* Search */}
      <form onSubmit={handleGenerate} className="search-container">
        <input
          className="search-input"
          placeholder="Enter a Part Number (ex. SMC KQ2H06-M5A , Omron MY2N-GS)"
          value={partNumber}
          onChange={(e) => setPartNumber(e.target.value)}
          disabled={loading}
        />
        <button type="submit" className="search-btn" disabled={loading}>
          {loading ? <SpinnerSmall /> : "Generate"}
        </button>
      </form>

      {/* Loading Overlay */}
      {loading && (
        <div style={{ textAlign: "center", padding: 60 }}>
          <SpinnerLarge label="Analyzing part data..." />
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: 20, background: "rgba(239,68,68,0.1)", color: "#ef4444", borderRadius: 16, textAlign: "center" }}>
          {error}
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="result-grid">
          {/* Left Column: Images */}
          <div className="card">
            <div className="img-container">
              {currentImage ? (
                <img src={currentImage} alt="Part" className="img-main" />
              ) : (
                <div style={{ color: "var(--muted)" }}>No Image Available</div>
              )}
              <button
                onClick={regenerateImage}
                style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.6)", color: "white", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", backdropFilter: "blur(4px)" }}
              >
                🔄 Regenerate
              </button>
            </div>

            {images.length > 1 && (
              <div className="img-nav">
                {images.map((_: any, i: number) => (
                  <div
                    key={i}
                    className={`dot ${i === imageIndex ? "active" : ""}`}
                    onClick={() => setImageIndex(i)}
                  />
                ))}
              </div>
            )}

            <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ justifyContent: "center" }}>
                {saving ? <SpinnerSmall /> : "💾 Save to Global"}
              </button>
              <button onClick={handleDetailedAnalysis} disabled={analyzing} className="btn btn-accent" style={{ justifyContent: "center" }}>
                {analyzing ? <SpinnerSmall /> : "📖 Detailed Analysis"}
              </button>
              <button onClick={handleCopyForBookmarklet} className="btn btn-secondary" style={{ justifyContent: "center" }}>
                📋 Smart Copy
              </button>
              <Link href="/saved-global" className="btn btn-secondary" style={{ justifyContent: "center", textDecoration: "none" }}>
                🌐 Saved Parts
              </Link>
            </div>

            {result.tokens && (
              <div style={{ marginTop: 24, padding: 16, background: "var(--bg)", borderRadius: 12, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 8, textTransform: "uppercase" }}>Token Usage</div>
                <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
                  <div><span style={{ color: "var(--muted)" }}>Prompt:</span> <strong>{result.tokens.prompt}</strong></div>
                  <div><span style={{ color: "var(--muted)" }}>Completion:</span> <strong>{result.tokens.completion}</strong></div>
                  <div><span style={{ color: "var(--muted)" }}>Total:</span> <strong style={{ color: "var(--accent)" }}>{result.tokens.total}</strong></div>
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Details */}
          <div className="card">
            <div className="section-title">Identity</div>
            <div className="field-group">
              <Field label="Part Number" value={result.part_number} onCopy={() => copyToClipboard(result.part_number, "Part Number")} />
              <Field label="Product Name" value={result.product_name} onCopy={() => copyToClipboard(result.product_name, "Product Name")} />
            </div>
            <div className="field-group" style={{ marginTop: 16 }}>
              <Field label="Common Name (EN)" value={result.common_name_en} onCopy={() => copyToClipboard(result.common_name_en, "Common Name EN")} />
              <Field label="Common Name (TH)" value={result.common_name_th} onCopy={() => copyToClipboard(result.common_name_th, "Common Name TH")} />
            </div>

            <div className="section-title">Specifications</div>
            <div className="field-group">
              <Field label="Material (EN)" value={result.characteristics_of_material_en} onCopy={() => copyToClipboard(result.characteristics_of_material_en, "Material EN")} />
              <Field label="Material (TH)" value={result.characteristics_of_material_th} onCopy={() => copyToClipboard(result.characteristics_of_material_th, "Material TH")} />
              <Field label="UOM" value={result.uom} onCopy={() => copyToClipboard(result.uom, "UOM")} />
            </div>

            <div className="section-title">Function & Usage</div>
            <div className="field-group">
              <Field label="Function (EN)" value={result.function_en} onCopy={() => copyToClipboard(result.function_en, "Function EN")} />
              <Field label="Function (TH)" value={result.function_th} onCopy={() => copyToClipboard(result.function_th, "Function TH")} />
            </div>
            <div className="field-group" style={{ marginTop: 16 }}>
              <Field label="Where Used (EN)" value={result.where_used_en} onCopy={() => copyToClipboard(result.where_used_en, "Where Used EN")} />
              <Field label="Where Used (TH)" value={result.where_used_th} onCopy={() => copyToClipboard(result.where_used_th, "Where Used TH")} />
            </div>

            <div className="section-title">Trade Info</div>
            <div className="field-group" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              <Field label="ECCN" value={result.eccn} onCopy={() => copyToClipboard(result.eccn, "ECCN")} />
              <Field label="HTS" value={result.hts} onCopy={() => copyToClipboard(result.hts, "HTS")} />
              <Field label="COO" value={result.coo} onCopy={() => copyToClipboard(result.coo, "COO")} />
            </div>
          </div>
        </div>
      )}

      {/* Detailed Modal */}
      {showDetailedModal && (
        <div className="modal-overlay" onClick={() => setShowDetailedModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 24, background: "linear-gradient(to right, var(--text), var(--muted))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Detailed Analysis
                </h2>
                <div style={{ color: "var(--accent)", fontSize: 14, marginTop: 4 }}>{result?.part_number} — {result?.product_name}</div>
              </div>
              <button onClick={() => setShowDetailedModal(false)} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 24, cursor: "pointer" }}>
                ×
              </button>
            </div>

            <div className="modal-body">
              {/* Image Gallery in Modal */}
              {images.length > 0 && (
                <div style={{ marginBottom: 32 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 12 }}>Visual Reference</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
                    {images.map((img: string, idx: number) => (
                      <div key={idx} style={{ aspectRatio: "4/3", borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)", background: "var(--bg)" }}>
                        <img src={img} alt={`Ref ${idx}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Analysis Content */}
              <div className="analysis-content">
                {detailedAnalysis?.split('\n').map((line, i) => {
                  const trimmed = line.trim();
                  if (!trimmed) return <div key={i} style={{ height: 12 }} />;

                  // Headers
                  if (trimmed.startsWith('# ') || trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
                    return <h3 key={i} style={{ color: "var(--accent)", marginTop: 24, marginBottom: 12, fontSize: 18 }}>{trimmed.replace(/^#+ /, '')}</h3>;
                  }
                  if (trimmed.match(/^\d+\./) || trimmed.endsWith(':')) {
                    return <h4 key={i} style={{ color: "var(--text)", marginTop: 16, marginBottom: 8, fontSize: 16, fontWeight: 600 }}>{trimmed}</h4>;
                  }

                  // List items
                  if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
                    return (
                      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, paddingLeft: 8 }}>
                        <span style={{ color: "var(--accent)" }}>•</span>
                        <span style={{ color: "var(--muted)", lineHeight: 1.6 }}>
                          {trimmed.substring(2).split('**').map((part, j) =>
                            j % 2 === 1 ? <strong key={j} style={{ color: "var(--text)" }}>{part}</strong> : part
                          )}
                        </span>
                      </div>
                    );
                  }

                  // Normal text with bold parsing
                  return (
                    <p key={i} style={{ color: "var(--muted)", lineHeight: 1.6, marginBottom: 8 }}>
                      {line.split('**').map((part, j) =>
                        j % 2 === 1 ? <strong key={j} style={{ color: "var(--text)" }}>{part}</strong> : part
                      )}
                    </p>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setShowDetailedModal(false)} className="btn btn-primary">
                Close Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onCopy }: { label: string, value: any, onCopy: () => void }) {
  const display = value && String(value).trim() !== "" ? value : "—";
  return (
    <div className="field-box">
      <div className="field-label">{label}</div>
      <div className="field-value">{display}</div>
      {display !== "—" && (
        <button className="copy-btn" onClick={onCopy} title="Copy">📋</button>
      )}
    </div>
  );
}
