"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      alert("Logout failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      className="nav__link nav__link--primary"
      onClick={handleLogout}
      disabled={loading}
    >
      {loading ? "⏳ Logging out..." : "🚪 Logout"}
    </button>
  );
}
