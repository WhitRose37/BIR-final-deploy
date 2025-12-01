"use client";
import { useEffect, useState } from "react";

export default function LanguageToggle() {
  const [lang, setLang] = useState<"en" | "th">("en");

  useEffect(() => {
    // Load saved preference
    const saved = localStorage.getItem("ui_lang");
    if (saved === "en" || saved === "th") {
      setLang(saved);
    }
  }, []);

  const toggleLang = (newLang: "en" | "th") => {
    setLang(newLang);
    localStorage.setItem("ui_lang", newLang);
    // Dispatch event for other components to react
    window.dispatchEvent(new CustomEvent("lang-change", { detail: newLang }));
  };

  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      <button
        onClick={() => toggleLang("en")}
        className={`btn btn--sm ${lang === "en" ? "btn--primary" : "btn--ghost"}`}
        aria-pressed={lang === "en"}
      >
        EN
      </button>
      <button
        onClick={() => toggleLang("th")}
        className={`btn btn--sm ${lang === "th" ? "btn--primary" : "btn--ghost"}`}
        aria-pressed={lang === "th"}
      >
        TH
      </button>
    </div>
  );
}
