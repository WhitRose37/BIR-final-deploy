"use client";

import { useEffect, useState } from "react";

export default function ActiveUsersBadge() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    // แจ้งว่าเข้าหน้าแล้ว (เพิ่มตัวนับ)
    fetch("/api/active-users", { method: "POST" }).catch(() => {});

    // ดึงจำนวนล่าสุดทุก 10s
    const update = async () => {
      try {
        const res = await fetch("/api/active-users", { cache: "no-store" });
        const j = await res.json();
        setCount(j.activeUsers ?? 0);
      } catch {}
    };
    update();
    const t = setInterval(update, 10_000);
    return () => clearInterval(t);
  }, []);

  return (
    <span className="pill" title="Active users on site">
      🙍🏻‍♂️ Active: <b>{count === null ? "…" : count}</b>
    </span>
  );
}
