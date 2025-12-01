"use client";
import React, { useState } from "react";

export default function TestGptUsagePage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [batch, setBatch] = useState([""]);

  async function handleSingleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult("");
    try {
      // ส่งข้อความสั้น ๆ ไปยัง API (mockup)
      const res = await fetch("/api/test-gpt-usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input })
      });
      const data = await res.json();
      setResult(data.result || "");
    } catch (err) {
      setResult("เกิดข้อผิดพลาด");
    }
    setLoading(false);
  }

  async function handleBatchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult("");
    try {
      // ส่ง batch ข้อมูลไป API (mockup)
      const res = await fetch("/api/test-gpt-usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch })
      });
      const data = await res.json();
      setResult(data.result || "");
    } catch (err) {
      setResult("เกิดข้อผิดพลาด");
    }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", background: "#222", color: "#fff", borderRadius: 12, padding: 32, boxShadow: "0 4px 24px #0002" }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: "#b084f7", marginBottom: 18 }}>ทดสอบลดการใช้ GPT API</h2>
      <form onSubmit={handleSingleSubmit} style={{ marginBottom: 24 }}>
        <label>ข้อความสั้น ๆ (Single Request):</label>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          style={{ width: "100%", padding: 8, margin: "8px 0 12px 0", borderRadius: 6, border: "none" }}
        />
        <button type="submit" disabled={loading} style={{ padding: "8px 20px", background: "#4ad991", color: "#fff", border: "none", borderRadius: 6, fontWeight: 600, fontSize: 15, cursor: "pointer" }}>
          ส่ง
        </button>
      </form>
      <form onSubmit={handleBatchSubmit} style={{ marginBottom: 24 }}>
        <label>Batch ข้อความ (Batch Request):</label>
        {batch.map((txt, idx) => (
          <input
            key={idx}
            type="text"
            value={txt}
            onChange={e => {
              const arr = [...batch];
              arr[idx] = e.target.value;
              setBatch(arr);
            }}
            style={{ width: "100%", padding: 8, margin: "8px 0", borderRadius: 6, border: "none" }}
          />
        ))}
        <button type="button" style={{ marginRight: 8, padding: "6px 12px", background: "#b084f7", color: "#fff", border: "none", borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: "pointer" }} onClick={() => setBatch([...batch, ""])}>
          + เพิ่มช่อง
        </button>
        <button type="submit" disabled={loading} style={{ padding: "8px 20px", background: "#4ad991", color: "#fff", border: "none", borderRadius: 6, fontWeight: 600, fontSize: 15, cursor: "pointer" }}>
          ส่ง Batch
        </button>
      </form>
      <div style={{ minHeight: 40, background: "#18122b", borderRadius: 8, padding: 12, marginTop: 12 }}>
        <strong>ผลลัพธ์:</strong>
        <div style={{ marginTop: 8, color: "#4ad991" }}>{loading ? "กำลังประมวลผล..." : result}</div>
      </div>
    </div>
  );
}
