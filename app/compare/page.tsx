"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

// ✅ แยก component ที่ใช้ useSearchParams ออกมา
function CompareContent() {
  const searchParams = useSearchParams();
  const [parts, setParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = searchParams.get("ids")?.split(",") || [];
    if (ids.length > 0) {
      fetchParts(ids);
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  async function fetchParts(ids: string[]) {
    try {
      setLoading(true);
      const responses = await Promise.all(
        ids.map((id) => fetch(`/api/parts/${id}`, { cache: "no-store" }))
      );

      const data = await Promise.all(
        responses.map((res) => (res.ok ? res.json() : null))
      );

      setParts(data.filter(Boolean));
    } catch (e) {
      console.error("Failed to load parts:", e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="container" style={{ marginTop: 40 }}>
        <div className="card glass">
          <p style={{ color: "#9b59b6" }}>⏳ Loading comparison...</p>
        </div>
      </div>
    );
  }

  if (parts.length === 0) {
    return (
      <div className="container" style={{ marginTop: 40 }}>
        <div className="card glass">
          <p>No parts to compare</p>
        </div>
      </div>
    );
  }

  const fields = [
    "partNumber",
    "commonNameEn",
    "commonNameTh",
    "uom",
    "characteristicsOfMaterialEn",
    "characteristicsOfMaterialTh",
    "longEn",
    "longTh",
  ];

  const fieldLabels: { [key: string]: string } = {
    partNumber: "Part Number",
    commonNameEn: "Common Name (EN)",
    commonNameTh: "Common Name (TH)",
    uom: "UOM",
    characteristicsOfMaterialEn: "Characteristics (EN)",
    characteristicsOfMaterialTh: "Characteristics (TH)",
    longEn: "Description (EN)",
    longTh: "Description (TH)",
  };

  return (
    <div className="container" style={{ marginTop: 40, marginBottom: 40 }}>
      <h1 style={{ fontSize: 28, marginBottom: 20 }}>📊 Compare Parts</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${parts.length}, 1fr)`,
          gap: 20,
        }}
      >
        {parts.map((part) => (
          <div key={part.id} className="card glass">
            <h3 style={{ fontSize: 16, marginBottom: 10 }}>
              {part.part_number}
            </h3>
            <p style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.7)" }}>
              {part.common_name_en}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ✅ Main component ที่ wrap ด้วย Suspense
export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="container" style={{ marginTop: 40 }}>
          <div className="card glass">
            <p style={{ color: "#9b59b6" }}>⏳ Loading...</p>
          </div>
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
