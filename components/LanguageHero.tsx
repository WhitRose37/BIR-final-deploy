"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const translations = {
  en: {
    pill: "New • v0.5",
    title: "Search your Part by part number",
    desc: "Type a part number → the system searches authoritative sources and summarizes concise bilingual (EN/TH) specifications, fetches product images, and provides source references.",
    ctaStart: "🚀 Get started",
    ctaSaved: "🌐 Saved (Global)",
    ctaDoc: "Documentation / How to use",
    feature1Title: "Source-first",
    feature1Desc: "Search manufacturers/distributors first, then summarize (no hallucination)",
    feature2Title: "EN / TH",
    feature2Desc: "Side-by-side English and Thai outputs",
    feature3Title: "Product Images",
    feature3Desc: "Fetches product photos from search results",
    exampleTitle: "Example",
    createNow: "Create now"
  },
  th: {
    pill: "ใหม่ • v0.5",
    title: "ค้นหาพาร์ต",
    desc: "พิมพ์เลขพาร์ต → ระบบค้นแหล่งที่เชื่อถือได้แล้วสรุปสเปคสั้น ๆ แบบสองภาษา (EN/TH) พร้อมดึงรูปสินค้าและอ้างอิงแหล่งที่มา",
    ctaStart: "🚀 เริ่มเลย",
    ctaSaved: "🌐 บันทึก (สาธารณะ)",
    ctaDoc: "เอกสาร / วิธีใช้",
    feature1Title: "เน้นแหล่งข้อมูล",
    feature1Desc: "ค้นผู้ผลิต/ผู้จำหน่ายก่อน แล้วสรุป (ลดการมั่วของข้อมูล)",
    feature2Title: "EN / TH",
    feature2Desc: "แสดงผลอังกฤษและไทยคู่กัน",
    feature3Title: "ภาพสินค้า",
    feature3Desc: "ดึงรูปสินค้าจากผลการค้นหา",
    exampleTitle: "ตัวอย่าง",
    createNow: "สร้างเลย"
  }
};

export default function LanguageHero() {
  const [lang, setLang] = useState<"en" | "th">("en");

  useEffect(() => {
    const saved = localStorage.getItem("ui_lang");
    if (saved === "en" || saved === "th") setLang(saved);

    const handler = (e: Event) => {
      const newLang = (e as CustomEvent).detail;
      if (newLang === "en" || newLang === "th") setLang(newLang);
    };
    window.addEventListener("lang-change", handler);
    return () => window.removeEventListener("lang-change", handler);
  }, []);

  const t = translations[lang];

  return (
    <section className="hero">
      <div className="hero__left">
        <div className="pill">{t.pill}</div>
        <h1 className="hero__title">
          {t.title}
        </h1>
        <p className="hero__desc">{t.desc}</p>

        <div className="hero__cta">
          <Link href="/generator" className="btn btn--primary">
            {t.ctaStart}
          </Link>
          <Link href="/saved-global" className="btn btn--ghost">
            {t.ctaSaved}
          </Link>
          <a
            className="btn btn--ghost"
            href="https://docs.google.com/document/d/1XCdDKvJ7yQQaCkt13WMh75gMDb_P-7hA9O7_1ugqKTo/edit?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.ctaDoc}
          </a>
        </div>

        <div className="features">
          <div className="feature">
            <div className="feature__icon">🔎</div>
            <div className="feature__text">
              <b>{t.feature1Title}</b>
              <span>{t.feature1Desc}</span>
            </div>
          </div>
          <div className="feature">
            <div className="feature__icon">🌐</div>
            <div className="feature__text">
              <b>{t.feature2Title}</b>
              <span>{t.feature2Desc}</span>
            </div>
          </div>
          <div className="feature">
            <div className="feature__icon">📸</div>
            <div className="feature__text">
              <b>{t.feature3Title}</b>
              <span>{t.feature3Desc}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="hero__right card glass">
        <div className="demo">
          <span className="demo__tag">{t.exampleTitle}</span>
          <div className="demo__row">
            <span className="demo__label">Part No.</span>
            <span className="demo__value">CFS1919060</span>
          </div>
          <div className="demo__row">
            <span className="demo__label">Common Name</span>
            <span className="demo__value">Conductive Foam Sheet</span>
          </div>
          <div className="demo__row">
            <span className="demo__label">UOM</span>
            <span className="demo__value">Sheet</span>
          </div>
          <div className="demo__footer">
            <Link href="/generator" className="btn btn--sm btn--primary">
              {t.createNow}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
