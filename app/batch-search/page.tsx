"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

// --- Helpers (CSV parse + Excel parse + detection + URL helpers) ---
function normalizeHeader(h: string) {
  return (h || "").toString().trim().toLowerCase();
}

function looksLikePartNumber(s: unknown) {
  if (typeof s !== "string") return false;
  const v = s.trim();
  return v.length >= 3 && /^[A-Za-z0-9\-\_./]+$/.test(v);
}

function detectPartColumnFromTable(rows: any[][], headers?: string[]) {
  if (headers && headers.length) {
    const headerIdx = headers.findIndex((h) => {
      const n = normalizeHeader(String(h));
      return ["part", "part_number", "part number", "partno", "pn", "part_no", "part-no"].some((k) => n.includes(k));
    });
    if (headerIdx >= 0) return headerIdx;
  }
  if (!rows || rows.length === 0) return -1;
  const colCount = Math.max(...rows.map((r) => r.length));
  let bestIdx = -1;
  let bestScore = 0;
  for (let c = 0; c < colCount; c++) {
    let score = 0;
    let checked = 0;
    for (let r = 0; r < Math.min(rows.length, 50); r++) {
      const cell = rows[r][c];
      if (cell !== undefined && cell !== null) {
        checked++;
        if (looksLikePartNumber(cell)) score++;
      }
    }
    if (checked > 0 && score / checked >= 0.4 && score > bestScore) {
      bestScore = score;
      bestIdx = c;
    }
  }
  return bestIdx;
}

// Simple CSV parser for browser (handles quoted fields)
function parseCSVText(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let curCell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"') {
        if (next === '"') {
          curCell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        curCell += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        cur.push(curCell);
        curCell = "";
      } else if (ch === "\r") {
      } else if (ch === "\n") {
        cur.push(curCell);
        rows.push(cur);
        cur = [];
        curCell = "";
      } else {
        curCell += ch;
      }
    }
  }
  if (inQuotes) {
    cur.push(curCell);
    rows.push(cur);
  } else if (curCell !== "" || cur.length > 0) {
    cur.push(curCell);
    rows.push(cur);
  }
  return rows;
}

// CSV file parser
async function parseCsvFile(file: File) {
  const text = await file.text();
  const aoa = parseCSVText(text).filter((r) => r.length > 0);
  if (!aoa || aoa.length === 0) return { rows: [] as any[] };
  const firstRow = aoa[0];
  const hasHeader = firstRow.every((c: any) => typeof c === "string" && /[A-Za-z]/.test(c));
  if (hasHeader) {
    return { headers: firstRow.map(String), rows: aoa.slice(1) };
  }
  return { rows: aoa };
}

// Excel file parser
async function parseExcelFile(file: File) {
  try {
    const XLSX = await import('xlsx');
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return { rows: [] as any[] };

    const worksheet = workbook.Sheets[sheetName];
    const aoa = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: false,
      defval: ''
    }) as any[][];

    if (!aoa || aoa.length === 0) return { rows: [] as any[] };

    const filtered = aoa.filter((r) => r.some((c) => c !== null && c !== undefined && c !== ''));
    if (filtered.length === 0) return { rows: [] as any[] };

    const firstRow = filtered[0];
    const hasHeader = firstRow.every((c: any) => typeof c === "string" && /[A-Za-z]/.test(c));

    if (hasHeader) {
      return { headers: firstRow.map(String), rows: filtered.slice(1) };
    }

    return { rows: filtered };
  } catch (error) {
    console.error('Excel parsing error:', error);
    throw new Error('Failed to parse Excel file. Please ensure the file is a valid Excel document.');
  }
}

function getImageUrl(u: any): string {
  if (!u) return "";
  if (typeof u === "string") return u;
  if (typeof u === "object") {
    if (typeof u.url === "string" && u.url) return u.url;
    if (typeof u.src === "string" && u.src) return u.src;
    if (typeof u.image === "string" && u.image) return u.image;
  }
  return "";
}

function getHostname(u: string) {
  try {
    return new URL(u).hostname;
  } catch {
    return u;
  }
}

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

function Field({ label, value, onCopy }: { label: string, value: any, onCopy?: () => void }) {
  const display = value && String(value).trim() !== "" ? value : "—";
  return (
    <div className="field-box">
      <div className="field-label">{label}</div>
      <div className="field-value">{display}</div>
      {display !== "—" && onCopy && (
        <button className="copy-btn" onClick={(e) => { e.stopPropagation(); onCopy(); }} title="Copy">📋</button>
      )}
    </div>
  );
}

export default function BatchSearchPage() {
  const [inputText, setInputText] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [parsedPartNumbers, setParsedPartNumbers] = useState<string[]>([]);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [withImage, setWithImage] = useState(true);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageLoadingMap, setImageLoadingMap] = useState<Record<string, boolean>>({});
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});
  const [copyStatus, setCopyStatus] = useState<Record<string, string>>({});
  const [toasts, setToasts] = useState<{ id: number; msg: string; type?: "success" | "error" | "info" }[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalItem, setModalItem] = useState<any | null>(null);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  function showToast(msg: string, type: "success" | "error" | "info" = "success") {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      const fileName = e.target.files[0].name;
      const ext = fileName.toLowerCase().split('.').pop();
      showToast(`File selected: ${fileName} (${ext?.toUpperCase()})`, "info");
    }
  }

  async function detectPartNumbers() {
    if (!file && !inputText.trim()) {
      showToast("Please upload a file (CSV/Excel) or paste text", "error");
      return;
    }

    let parts: string[] = [];

    if (inputText.trim()) {
      const lines = inputText.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length >= 3);
      parts = [...parts, ...lines];
    }

    if (file) {
      try {
        const ext = file.name.toLowerCase().split('.').pop();
        let parsedData;

        if (ext === 'csv') {
          parsedData = await parseCsvFile(file);
        } else if (ext === 'xlsx' || ext === 'xls') {
          parsedData = await parseExcelFile(file);
        } else {
          showToast("Unsupported file type. Please upload CSV or Excel file.", "error");
          return;
        }

        const { rows, headers } = parsedData;
        const colIdx = detectPartColumnFromTable(rows, headers);

        if (colIdx === -1) {
          showToast("Could not auto-detect part number column", "error");
        } else {
          rows.forEach((row: any) => {
            const cell = row[colIdx];
            if (looksLikePartNumber(cell)) parts.push(String(cell).trim());
          });
        }
      } catch (err) {
        console.error(err);
        showToast(`Error parsing file: ${(err as Error).message}`, "error");
      }
    }

    const unique = Array.from(new Set(parts));
    setParsedPartNumbers(unique);
    if (unique.length === 0) showToast("No valid part numbers found", "error");
    else showToast(`✅ Detected ${unique.length} part number(s)`, "success");
  }

  async function startBatchSearch() {
    if (parsedPartNumbers.length === 0) return;
    setLoading(true);
    setResults([]);

    try {
      const CONCURRENCY = 3;

      for (let i = 0; i < parsedPartNumbers.length; i += CONCURRENCY) {
        const chunk = parsedPartNumbers.slice(i, i + CONCURRENCY);
        const chunkPromises = chunk.map(async (pn) => {
          try {
            const res = await fetch("/api/generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ part_number: pn, withImage })
            });
            if (!res.ok) return { part_number: pn, error: "Failed" };
            return await res.json();
          } catch (e) {
            return { part_number: pn, error: "Error" };
          }
        });

        const chunkResults = await Promise.all(chunkPromises);

        setResults(prev => {
          const newResults = chunkResults.map((item: any) => ({
            partNumber: item.part_number || "",
            productName: item.product_name || "",
            commonNames: [item.common_name_en, item.common_name_th].filter(Boolean),
            summary: [
              item.function_en,
              item.characteristics_of_material_en,
              item.where_used_en
            ].filter(Boolean).join(". ") || item.long_en || "",
            imageUrl: item.images && item.images[0] ? item.images[0] : null,
            images: item.images || [],
            sources: item.sources || [],
            uom: item.uom || "",
            characteristics_of_material_en: item.characteristics_of_material_en,
            characteristics_of_material_th: item.characteristics_of_material_th,
            function_en: item.function_en,
            function_th: item.function_th,
            where_used_en: item.where_used_en,
            where_used_th: item.where_used_th,
            eccn: item.eccn,
            hts: item.hts,
            coo: item.coo,
            tokens: item.tokens,
            _raw: item
          }));
          return [...prev, ...newResults];
        });
      }

      showToast(`✅ Search completed`, "success");
    } catch (err: any) {
      console.error(err);
      showToast(`❌ Search failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  }

  async function regenerateImage(partNumber: string) {
    setImageLoadingMap(prev => ({ ...prev, [partNumber]: true }));

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partNumber })
      });

      if (!res.ok) throw new Error("Image generation failed");

      const data = await res.json();

      setResults(prev => prev.map(item =>
        item.partNumber === partNumber
          ? { ...item, imageUrl: data.url }
          : item
      ));

      if (modalItem && modalItem.partNumber === partNumber) {
        setModalItem((prev: any) => ({ ...prev, imageUrl: data.url, images: [data.url] }));
      }

      showToast("✅ Image regenerated", "success");
    } catch (err: any) {
      showToast(`❌ ${err.message}`, "error");
    } finally {
      setImageLoadingMap(prev => ({ ...prev, [partNumber]: false }));
    }
  }

  async function handleSave(item: any) {
    if (!item._raw) return;
    setSavingMap(prev => ({ ...prev, [item.partNumber]: true }));
    try {
      const res = await fetch("/api/saved-global", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item._raw),
      });
      if (!res.ok) throw new Error("Save failed");
      showToast("✅ Saved to Global", "success");
    } catch (e: any) {
      showToast(`❌ Save failed: ${e.message}`, "error");
    } finally {
      setSavingMap(prev => ({ ...prev, [item.partNumber]: false }));
    }
  }

  async function handleSaveAll() {
    if (results.length === 0) return;
    if (!confirm(`Save all ${results.length} items to Global ? `)) return;

    let successCount = 0;
    for (const item of results) {
      if (!item._raw) continue;
      try {
        await fetch("/api/saved-global", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item._raw),
        });
        successCount++;
      } catch (e) {
        console.error(e);
      }
    }
    showToast(`✅ Saved ${successCount} items`, "success");
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopyStatus(prev => ({ ...prev, [id]: "✅ Copied!" }));
      showToast(`Copied ${id}`, "success");
      setTimeout(() => {
        setCopyStatus(prev => ({ ...prev, [id]: "" }));
      }, 2000);
    });
  }

  function clearAll() {
    setInputText("");
    setFile(null);
    setParsedPartNumbers([]);
    setResults([]);
    if (fileRef.current) fileRef.current.value = "";
    showToast("All data cleared", "info");
  }

  function removePartNumber(index: number) {
    setParsedPartNumbers(prev => prev.filter((_, i) => i !== index));
  }

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

        /* Input Section */
        .input-card {
          background: var(--card-bg);
          backdrop-filter: blur(12px);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 24px;
          box-shadow: var(--shadow-lg);
          margin-bottom: 32px;
        }
        
        .input-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }
        
        .styled-textarea {
          width: 100%;
          min-height: 140px;
          padding: 16px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--bg);
          color: var(--text);
          font-family: monospace;
          font-size: 14px;
          resize: vertical;
          transition: border-color 0.2s;
        }
        .styled-textarea:focus {
          outline: none;
          border-color: var(--accent);
        }
        
        .file-drop-area {
          border: 2px dashed var(--border);
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          background: var(--bg);
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 140px;
        }
        .file-drop-area:hover {
          border-color: var(--accent);
          background: rgba(124, 58, 237, 0.05);
        }

        /* Results Grid */
        .result-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 24px;
        }

        /* Cards */
        .card {
          background: var(--card-bg);
          backdrop-filter: blur(12px);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 20px;
          box-shadow: var(--shadow-lg);
          transition: transform 0.2s, box-shadow 0.2s;
          cursor: pointer;
          display: flex;
          flex-direction: column;
        }
        .card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border-color: var(--accent);
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

        /* Buttons */
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
          font-size: 14px;
        }
        .btn:hover { transform: translateY(-1px); }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .btn-primary { background: var(--primary); color: white; }
        .btn-secondary { background: var(--panel); color: var(--text); border: 1px solid var(--border); }
        .btn-accent { background: var(--accent); color: white; }
        .btn-ghost { background: transparent; color: var(--muted); }
        .btn-ghost:hover { color: var(--text); background: var(--bg); }

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
          max-width: 1000px;
          max-height: 90vh;
          border-radius: 24px;
          padding: 32px;
          overflow-y: auto;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
        }
        
        .modal-grid {
            display: grid;
            grid-template-columns: 400px 1fr;
            gap: 32px;
        }
        @media (max-width: 900px) {
            .modal-grid { grid-template-columns: 1fr; }
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
          <h1 className="title">Batch Part Search</h1>
          <p style={{ color: "var(--muted)" }}>Process multiple part numbers via CSV, Excel, or text</p>
        </div>
        <Link href="/saved-global" className="btn btn-secondary" style={{ textDecoration: "none" }}>
          🌐 Saved Parts
        </Link>
      </header>

      {/* Input Section */}
      <div className="input-card">
        <div className="input-grid">
          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 14 }}>
              📝 Paste Part Numbers
            </label>
            <textarea
              className="styled-textarea"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste your part numbers here...&#10;&#10;Supported formats:&#10;• One per line&#10;• Comma separated&#10;&#10;Example:&#10;SMC KQ2H06-M5A&#10;FX3U-32MR/ES, LRS-350-24"
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 14 }}>
              📁 Upload File
            </label>
            <div className="file-drop-area" onClick={() => fileRef.current?.click()}>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
              <div style={{ fontWeight: 600, color: "var(--text)" }}>
                {file ? file.name : "Click to upload CSV or Excel"}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                {file ? `${(file.size / 1024).toFixed(1)} KB` : "Supports .csv, .xlsx, .xls"}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, fontWeight: 500 }}>
            <input
              type="checkbox"
              checked={withImage}
              onChange={(e) => setWithImage(e.target.checked)}
              style={{ cursor: "pointer", width: 16, height: 16, accentColor: "var(--accent)" }}
            />
            <span>Include AI-generated images</span>
          </label>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={clearAll}
              className="btn btn-ghost"
            >
              Clear All
            </button>
            <button
              onClick={detectPartNumbers}
              disabled={(!file && !inputText.trim())}
              className="btn btn-secondary"
            >
              🔍 Detect Parts
            </button>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      {parsedPartNumbers.length > 0 && (
        <div className="input-card" style={{ animation: "slideUp 0.3s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
              📋 Detected {parsedPartNumbers.length} Parts
            </h2>
            <button
              onClick={() => setPreviewOpen(!previewOpen)}
              className="btn btn-ghost"
              style={{ fontSize: 12 }}
            >
              {previewOpen ? "Hide" : "Show"}
            </button>
          </div>

          {previewOpen && (
            <div style={{ maxHeight: 150, overflowY: "auto", background: "var(--bg)", padding: 16, borderRadius: 12, border: "1px solid var(--border)", marginBottom: 24 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {parsedPartNumbers.map((pn, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: "4px 8px 4px 12px",
                      background: "rgba(124, 58, 237, 0.1)",
                      color: "var(--accent)",
                      borderRadius: 16,
                      fontSize: 12,
                      fontWeight: 600,
                      fontFamily: "monospace",
                      border: "1px solid rgba(124, 58, 237, 0.2)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    {pn}
                    <button
                      onClick={() => removePartNumber(idx)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--accent)",
                        cursor: "pointer",
                        padding: "2px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        lineHeight: 1,
                        fontSize: 14,
                        opacity: 0.6
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = "0.6"}
                      title="Remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={startBatchSearch}
            disabled={loading}
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", padding: 16, fontSize: 16 }}
          >
            {loading ? <><SpinnerSmall /> Processing Batch...</> : "🚀 Start Batch Generation"}
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: "center", padding: 60 }}>
          <SpinnerLarge label={`Processing ${parsedPartNumbers.length} items...`} />
        </div>
      )}

      {/* Results Section */}
      {!loading && results.length > 0 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
              Results ({results.length})
            </h2>
            <button
              onClick={handleSaveAll}
              className="btn btn-primary"
            >
              💾 Save All to Global
            </button>
          </div>

          <div className="result-grid">
            {results.map((item, idx) => {
              const imgUrl = getImageUrl(item.imageUrl || item.image);
              return (
                <div
                  key={idx}
                  className="card"
                  onClick={() => {
                    setModalItem(item);
                    setModalImageIndex(0);
                    setModalOpen(true);
                  }}
                >
                  <div className="img-container" style={{ marginBottom: 16 }}>
                    {imgUrl ? (
                      <Image
                        src={imgUrl}
                        alt={item.partNumber}
                        width={300}
                        height={225}
                        className="img-main"
                        unoptimized
                      />
                    ) : (
                      <div style={{ color: "var(--muted)", fontSize: 12 }}>No Image</div>
                    )}
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Part Number</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--accent)", fontFamily: "monospace" }}>
                      {item.partNumber}
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Product</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.productName || "—"}
                    </div>
                  </div>

                  {item.tokens && (
                    <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid var(--border)", fontSize: 11, color: "var(--muted)", display: "flex", justifyContent: "space-between" }}>
                      <span>Tokens:</span>
                      <span style={{ color: "var(--text)", fontWeight: 600 }}>{item.tokens.total}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && modalItem && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 24, background: "linear-gradient(to right, var(--text), var(--muted))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {modalItem.partNumber}
                </h2>
                <div style={{ color: "var(--accent)", fontSize: 14, marginTop: 4 }}>{modalItem.productName}</div>
              </div>
              <button onClick={() => setModalOpen(false)} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 24, cursor: "pointer" }}>
                ×
              </button>
            </div>

            <div className="modal-grid">
              {/* Left Column: Images & Actions */}
              <div>
                <div className="img-container">
                  {modalItem.images && modalItem.images.length > 0 ? (
                    <Image
                      src={getImageUrl(modalItem.images[modalImageIndex])}
                      alt="Main"
                      width={500}
                      height={400}
                      className="img-main"
                      unoptimized
                    />
                  ) : (
                    <div style={{ color: "var(--muted)" }}>No Image Available</div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      regenerateImage(modalItem.partNumber);
                    }}
                    style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.6)", color: "white", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", backdropFilter: "blur(4px)" }}
                  >
                    {imageLoadingMap[modalItem.partNumber] ? "🔄..." : "🔄 Regenerate"}
                  </button>
                </div>

                {modalItem.images && modalItem.images.length > 1 && (
                  <div className="img-nav">
                    {modalItem.images.map((img: any, i: number) => (
                      <div
                        key={i}
                        className={`dot ${i === modalImageIndex ? "active" : ""}`}
                        onClick={() => setModalImageIndex(i)}
                      />
                    ))}
                  </div>
                )}

                <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
                  <button
                    onClick={() => handleSave(modalItem)}
                    disabled={savingMap[modalItem.partNumber]}
                    className="btn btn-primary"
                    style={{ justifyContent: "center" }}
                  >
                    {savingMap[modalItem.partNumber] ? "Saving..." : "💾 Save to Global"}
                  </button>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(modalItem, null, 2), "modal-json")}
                    className="btn btn-secondary"
                    style={{ justifyContent: "center" }}
                  >
                    📋 Copy JSON Data
                  </button>
                </div>

                {modalItem.tokens && (
                  <div style={{ marginTop: 24, padding: 16, background: "var(--bg)", borderRadius: 12, border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 8, textTransform: "uppercase" }}>Token Usage</div>
                    <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
                      <div><span style={{ color: "var(--muted)" }}>Prompt:</span> <strong>{modalItem.tokens.prompt}</strong></div>
                      <div><span style={{ color: "var(--muted)" }}>Completion:</span> <strong>{modalItem.tokens.completion}</strong></div>
                      <div><span style={{ color: "var(--muted)" }}>Total:</span> <strong style={{ color: "var(--accent)" }}>{modalItem.tokens.total}</strong></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Details */}
              <div>
                <div className="section-title">Identity</div>
                <div className="field-group">
                  <Field label="Part Number" value={modalItem.partNumber} onCopy={() => copyToClipboard(modalItem.partNumber, "Part Number")} />
                  <Field label="Product Name" value={modalItem.productName} onCopy={() => copyToClipboard(modalItem.productName, "Product Name")} />
                </div>

                <div className="section-title">Common Names</div>
                <div className="field-group">
                  <Field label="Common Name (EN)" value={modalItem.commonNames?.[0] || modalItem._raw?.common_name_en} onCopy={() => copyToClipboard(modalItem.commonNames?.[0] || modalItem._raw?.common_name_en, "Common Name EN")} />
                  <Field label="Common Name (TH)" value={modalItem.commonNames?.[1] || modalItem._raw?.common_name_th} onCopy={() => copyToClipboard(modalItem.commonNames?.[1] || modalItem._raw?.common_name_th, "Common Name TH")} />
                </div>

                <div className="section-title">Specifications</div>
                <div className="field-group">
                  <Field label="Material (EN)" value={modalItem.characteristics_of_material_en} onCopy={() => copyToClipboard(modalItem.characteristics_of_material_en, "Material EN")} />
                  <Field label="Material (TH)" value={modalItem.characteristics_of_material_th} onCopy={() => copyToClipboard(modalItem.characteristics_of_material_th, "Material TH")} />
                  <Field label="UOM" value={modalItem.uom} onCopy={() => copyToClipboard(modalItem.uom, "UOM")} />
                </div>

                <div className="section-title">Function & Usage</div>
                <div className="field-group">
                  <Field label="Function (EN)" value={modalItem.function_en} onCopy={() => copyToClipboard(modalItem.function_en, "Function EN")} />
                  <Field label="Function (TH)" value={modalItem.function_th} onCopy={() => copyToClipboard(modalItem.function_th, "Function TH")} />
                </div>
                <div className="field-group" style={{ marginTop: 16 }}>
                  <Field label="Where Used (EN)" value={modalItem.where_used_en} onCopy={() => copyToClipboard(modalItem.where_used_en, "Where Used EN")} />
                  <Field label="Where Used (TH)" value={modalItem.where_used_th} onCopy={() => copyToClipboard(modalItem.where_used_th, "Where Used TH")} />
                </div>

                <div className="section-title">Trade Info</div>
                <div className="field-group" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                  <Field label="ECCN" value={modalItem.eccn} onCopy={() => copyToClipboard(modalItem.eccn, "ECCN")} />
                  <Field label="HTS" value={modalItem.hts} onCopy={() => copyToClipboard(modalItem.hts, "HTS")} />
                  <Field label="COO" value={modalItem.coo} onCopy={() => copyToClipboard(modalItem.coo, "COO")} />
                </div>

                {modalItem.sources && modalItem.sources.length > 0 && (
                  <div>
                    <div className="section-title">Sources</div>
                    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: "var(--text)" }}>
                      {modalItem.sources.map((src: string, i: number) => (
                        <li key={i} style={{ marginBottom: 4 }}>
                          <a href={src} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", textDecoration: "none" }}>
                            {getHostname(src)}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}